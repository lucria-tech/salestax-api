import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import type { MonthlyCostLog, CostLog } from "../types/index.ts";

const DATA_DIR = join(process.cwd(), "data");
const COSTS_DIR = join(DATA_DIR, "costs");

// Ensure directories exist
function ensureDirectories() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(COSTS_DIR)) {
    mkdirSync(COSTS_DIR, { recursive: true });
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCostFilePath(month: string): string {
  return join(COSTS_DIR, `${month}.json`);
}

async function loadMonthlyCost(month: string): Promise<MonthlyCostLog> {
  const filePath = getCostFilePath(month);
  
  if (!existsSync(filePath)) {
    return {
      month,
      totalInvocations: 0,
      totalCost: 0,
      invocations: [],
    };
  }

  try {
    const file = Bun.file(filePath);
    const content = await file.text();
    return JSON.parse(content) as MonthlyCostLog;
  } catch (error) {
    console.error(`Error loading cost file ${filePath}:`, error);
    return {
      month,
      totalInvocations: 0,
      totalCost: 0,
      invocations: [],
    };
  }
}

async function saveMonthlyCost(costLog: MonthlyCostLog): Promise<void> {
  ensureDirectories();
  const filePath = getCostFilePath(costLog.month);
  
  try {
    await Bun.write(filePath, JSON.stringify(costLog, null, 2));
  } catch (error) {
    console.error(`Error saving cost file ${filePath}:`, error);
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
  
  if (!existsSync(COSTS_DIR)) {
    return costs;
  }

  try {
    const files = readdirSync(COSTS_DIR).filter((f) => f.endsWith(".json"));
    
    for (const file of files) {
      const filePath = join(COSTS_DIR, file);
      const fileContent = await Bun.file(filePath).text();
      const cost = JSON.parse(fileContent) as MonthlyCostLog;
      costs.push(cost);
    }

    // Sort by month descending (newest first)
    costs.sort((a, b) => b.month.localeCompare(a.month));
    
    return costs;
  } catch (error) {
    console.error("Error loading all costs:", error);
    return costs;
  }
}
