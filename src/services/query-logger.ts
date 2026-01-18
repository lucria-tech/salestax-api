import { getRedisClient } from "../utils/redis.ts";
import type { QueryLog, MonthlyQueryLog, TaxQuery, TaxResponse } from "../types/index.ts";

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getLogKey(month: string): string {
  return `logs:${month}`;
}

async function loadMonthlyLog(month: string): Promise<MonthlyQueryLog> {
  try {
    const redis = getRedisClient();
    const key = getLogKey(month);
    const data = await redis.get(key);
    
    if (!data) {
      return {
        month,
        queries: [],
      };
    }

    // Upstash returns data as string, parse it
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return parsed as MonthlyQueryLog;
  } catch (error) {
    console.error(`Error loading log from Redis for month ${month}:`, error);
    return {
      month,
      queries: [],
    };
  }
}

async function saveMonthlyLog(log: MonthlyQueryLog): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = getLogKey(log.month);
    await redis.set(key, JSON.stringify(log));
    
    // Set expiration to 1 year (optional, but good practice)
    await redis.expire(key, 365 * 24 * 60 * 60);
  } catch (error) {
    console.error(`Error saving log to Redis for month ${log.month}:`, error);
    throw error;
  }
}

export async function logQuery(
  apiKeyType: "test" | "prod",
  query: TaxQuery,
  response: TaxResponse | { error: string },
  statusCode: number
): Promise<void> {
  try {
    const month = getCurrentMonth();
    const monthlyLog = await loadMonthlyLog(month);

    const queryLog: QueryLog = {
      timestamp: new Date().toISOString(),
      apiKey: apiKeyType,
      query,
      response,
      statusCode,
    };

    monthlyLog.queries.push(queryLog);
    await saveMonthlyLog(monthlyLog);
  } catch (error) {
    console.error("Error logging query:", error);
    // Don't throw - logging failures shouldn't break the API
  }
}

export async function getAllLogs(): Promise<MonthlyQueryLog[]> {
  const logs: MonthlyQueryLog[] = [];
  
  try {
    const redis = getRedisClient();
    const keys = await redis.keys("logs:*");
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        // Upstash returns data as string, parse it
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        logs.push(parsed as MonthlyQueryLog);
      }
    }

    // Sort by month descending (newest first)
    logs.sort((a, b) => b.month.localeCompare(a.month));
    
    return logs;
  } catch (error) {
    console.error("Error loading all logs from Redis:", error);
    return logs;
  }
}
