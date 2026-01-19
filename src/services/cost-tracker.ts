import { getRedisClient } from "../utils/redis.ts";
import type { MonthlyCostLog, CostLog } from "../types/index.ts";

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCostKey(month: string): string {
  return `costs:${month}`;
}

async function loadMonthlyCost(month: string): Promise<MonthlyCostLog> {
  try {
    const redis = getRedisClient();
    const key = getCostKey(month);
    const data = await redis.get(key);
    
    if (!data) {
      return {
        month,
        totalInvocations: 0,
        totalCost: 0,
        invocations: [],
      };
    }

    // Upstash returns data as string, parse it
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return parsed as MonthlyCostLog;
  } catch (error) {
    console.error(`Error loading cost from Redis for month ${month}:`, error);
    return {
      month,
      totalInvocations: 0,
      totalCost: 0,
      invocations: [],
    };
  }
}

async function saveMonthlyCost(costLog: MonthlyCostLog): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = getCostKey(costLog.month);
    await redis.set(key, JSON.stringify(costLog));
    
    // Set expiration to 2 months (~60 days) to keep storage low while retaining 1 extra month of history
    await redis.expire(key, 60 * 24 * 60 * 60);
  } catch (error) {
    console.error(`Error saving cost to Redis for month ${costLog.month}:`, error);
    throw error;
  }
}

export async function trackCost(): Promise<{
  totalInvocations: number;
  totalCost: number;
  costThisCall: number;
}> {
  const costPerCall = parseFloat(Bun.env.COST_PER_CALL || "0");
  
  if (costPerCall <= 0) {
    console.warn("COST_PER_CALL not set or invalid, defaulting to 0");
  }

  const month = getCurrentMonth();
  const monthlyCost = await loadMonthlyCost(month);

  const costLog: CostLog = {
    timestamp: new Date().toISOString(),
    cost: costPerCall,
  };

  monthlyCost.invocations.push(costLog);
  monthlyCost.totalInvocations += 1;
  monthlyCost.totalCost += costPerCall;

  await saveMonthlyCost(monthlyCost);

  return {
    totalInvocations: monthlyCost.totalInvocations,
    totalCost: monthlyCost.totalCost,
    costThisCall: costPerCall,
  };
}

export async function getMonthlyStats(): Promise<MonthlyCostLog> {
  const month = getCurrentMonth();
  return await loadMonthlyCost(month);
}

export async function getAllCosts(): Promise<MonthlyCostLog[]> {
  const costs: MonthlyCostLog[] = [];
  
  try {
    const redis = getRedisClient();
    const keys = await redis.keys("costs:*");
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        // Upstash returns data as string, parse it
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        costs.push(parsed as MonthlyCostLog);
      }
    }

    // Sort by month descending (newest first)
    costs.sort((a, b) => b.month.localeCompare(a.month));
    
    return costs;
  } catch (error) {
    console.error("Error loading all costs from Redis:", error);
    return costs;
  }
}
