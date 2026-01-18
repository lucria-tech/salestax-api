import type { TaxQuery } from "../types/index.ts";

export type ApiKeyType = "test" | "prod" | "invalid";

export interface ApiKeyValidation {
  type: ApiKeyType;
  isValid: boolean;
}

export function validateApiKey(apiKey: string | null): ApiKeyValidation {
  if (!apiKey) {
    return { type: "invalid", isValid: false };
  }

  const testApiKey = Bun.env.TEST_API_KEY;
  const prodApiKey = Bun.env.PROD_API_KEY;

  if (testApiKey && apiKey === testApiKey) {
    return { type: "test", isValid: true };
  }

  if (prodApiKey && apiKey === prodApiKey) {
    return { type: "prod", isValid: true };
  }

  return { type: "invalid", isValid: false };
}

export function requireApiKey(apiKey: string | null): ApiKeyValidation {
  const validation = validateApiKey(apiKey);
  if (!validation.isValid) {
    throw new Error("Unauthorized: Invalid or missing API key");
  }
  return validation;
}
