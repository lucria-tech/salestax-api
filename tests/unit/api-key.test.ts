import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { validateApiKey } from "../../src/services/api-key.ts";

describe("API Key Validation", () => {
  const originalTestKey = Bun.env.TEST_API_KEY;
  const originalProdKey = Bun.env.PROD_API_KEY;

  beforeEach(() => {
    // Clear env before each test
    delete Bun.env.TEST_API_KEY;
    delete Bun.env.PROD_API_KEY;
  });

  afterEach(() => {
    // Restore env after each test
    if (originalTestKey) Bun.env.TEST_API_KEY = originalTestKey;
    if (originalProdKey) Bun.env.PROD_API_KEY = originalProdKey;
  });

  it("should validate TEST_API_KEY correctly", () => {
    Bun.env.TEST_API_KEY = "test-key-123";
    const result = validateApiKey("test-key-123");
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("test");
  });

  it("should validate PROD_API_KEY correctly", () => {
    Bun.env.PROD_API_KEY = "prod-key-456";
    const result = validateApiKey("prod-key-456");
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("prod");
  });

  it("should reject invalid API key", () => {
    Bun.env.TEST_API_KEY = "test-key-123";
    Bun.env.PROD_API_KEY = "prod-key-456";
    const result = validateApiKey("invalid-key");
    expect(result.isValid).toBe(false);
    expect(result.type).toBe("invalid");
  });

  it("should reject null API key", () => {
    const result = validateApiKey(null);
    expect(result.isValid).toBe(false);
    expect(result.type).toBe("invalid");
  });

  it("should reject empty API key", () => {
    const result = validateApiKey("");
    expect(result.isValid).toBe(false);
    expect(result.type).toBe("invalid");
  });
});
