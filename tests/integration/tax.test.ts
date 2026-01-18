import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, rmSync } from "fs";
import { join } from "path";

// Note: These tests require the server to be running
// Start the server with: bun run dev
// Or set TEST_BASE_URL to point to a running server

const BASE_URL = Bun.env.TEST_BASE_URL || "http://localhost:3000";
const TEST_API_KEY = Bun.env.TEST_API_KEY || "test-key";
const PROD_API_KEY = Bun.env.PROD_API_KEY || "prod-key";

// Helper to check if server is running
async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

describe("Tax API Integration Tests", () => {
  let serverRunning = false;

  beforeAll(async () => {
    // Check if server is running
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn("⚠️  Server not running. Skipping integration tests.");
      console.warn("   Start server with: bun run dev");
    }

    // Clean up test data directories
    const dataDir = join(process.cwd(), "data");
    if (existsSync(dataDir)) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  it("should return 200 with valid API key and query params", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(
      `${BASE_URL}/?country=US&zip=48201`,
      {
        headers: {
          "x-api-key": TEST_API_KEY,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("rate");
    expect(data.rate).toHaveProperty("combined_rate");
  });

  it("should return 200 without API key (shows docs)", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(`${BASE_URL}/?country=US&zip=48201`);
    
    // Should return docs, not 401, when no API key is provided
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("Tax Calculator API");
  });

  it("should return 401 with invalid API key", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(
      `${BASE_URL}/?country=US&zip=48201`,
      {
        headers: {
          "x-api-key": "invalid-key",
        },
      }
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Unauthorized");
  });

  it("should handle CORS preflight request", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(`${BASE_URL}/`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("should return health check", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(`${BASE_URL}/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data.status).toBe("ok");
  });

  it("should return OpenAPI spec", async () => {
    if (!serverRunning) {
      console.log("⏭️  Skipping - server not running");
      return;
    }
    const response = await fetch(`${BASE_URL}/docs/openapi.json`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("openapi");
    expect(data.openapi).toBe("3.0.0");
  });
});
