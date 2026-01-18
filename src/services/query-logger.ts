import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import type { QueryLog, MonthlyQueryLog, TaxQuery, TaxResponse } from "../types/index.ts";

const DATA_DIR = join(process.cwd(), "data");
const LOGS_DIR = join(DATA_DIR, "logs");

// Ensure directories exist
function ensureDirectories() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getLogFilePath(month: string): string {
  return join(LOGS_DIR, `${month}.json`);
}

async function loadMonthlyLog(month: string): Promise<MonthlyQueryLog> {
  const filePath = getLogFilePath(month);
  
  if (!existsSync(filePath)) {
    return {
      month,
      queries: [],
    };
  }

  try {
    const file = Bun.file(filePath);
    const content = await file.text();
    return JSON.parse(content) as MonthlyQueryLog;
  } catch (error) {
    console.error(`Error loading log file ${filePath}:`, error);
    return {
      month,
      queries: [],
    };
  }
}

async function saveMonthlyLog(log: MonthlyQueryLog): Promise<void> {
  ensureDirectories();
  const filePath = getLogFilePath(log.month);
  
  try {
    await Bun.write(filePath, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error(`Error saving log file ${filePath}:`, error);
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
  
  if (!existsSync(LOGS_DIR)) {
    return logs;
  }

  try {
    const files = readdirSync(LOGS_DIR).filter((f) => f.endsWith(".json"));
    
    for (const file of files) {
      const filePath = join(LOGS_DIR, file);
      const fileContent = await Bun.file(filePath).text();
      const log = JSON.parse(fileContent) as MonthlyQueryLog;
      logs.push(log);
    }

    // Sort by month descending (newest first)
    logs.sort((a, b) => b.month.localeCompare(a.month));
    
    return logs;
  } catch (error) {
    console.error("Error loading all logs:", error);
    return logs;
  }
}
