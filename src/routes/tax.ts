import { addCorsHeaders } from "../utils/cors.ts";
import { requireApiKey } from "../services/api-key.ts";
import { logQuery } from "../services/query-logger.ts";
import { trackCost, getMonthlyStats } from "../services/cost-tracker.ts";
import { sendSlackNotification } from "../services/slack.ts";
import type { TaxQuery, TaxResponse } from "../types/index.ts";

const TAXJAR_API_URL = "https://taxjar.netlify.app/.netlify/functions/calculator";

export async function handleTaxRequest(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    
    // Get API key from header
    const apiKey = req.headers.get("x-api-key");
    
    // Validate API key
    const validation = requireApiKey(apiKey);
    const apiKeyType = validation.type as "test" | "prod";

    // Parse query parameters
    const street = url.searchParams.get("street") || "";
    const city = url.searchParams.get("city") || "";
    const zip = url.searchParams.get("zip") || "";
    const country = url.searchParams.get("country") || "";

    const query: TaxQuery = {
      street,
      city,
      zip,
      country,
    };

    // Build TaxJar API URL
    const taxjarUrl = new URL(TAXJAR_API_URL);
    taxjarUrl.searchParams.set("street", street);
    taxjarUrl.searchParams.set("city", city);
    taxjarUrl.searchParams.set("zip", zip);
    taxjarUrl.searchParams.set("country", country);

    let data: any;
    let statusCode: number;
    let isSuccess = false;

    try {
      // Forward request to TaxJar API
      const response = await fetch(taxjarUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      statusCode = response.status;
      
      // Try to parse JSON response
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, treat as error
        data = { error: "Invalid response from TaxJar API" };
        statusCode = 500;
      }

      // Check if the TaxJar API call was successful
      // Only charge if: status 200, no error field, and has valid rate data
      isSuccess = statusCode === 200 && 
                  data && 
                  !data.error && 
                  data.rate && 
                  typeof data.rate === "object" &&
                  data.rate.combined_rate !== undefined;

    } catch (fetchError) {
      // Network error, timeout, or other fetch failures
      // Don't charge user for these issues
      statusCode = 500;
      data = { 
        error: fetchError instanceof Error 
          ? `TaxJar API error: ${fetchError.message}` 
          : "Failed to connect to TaxJar API" 
      };
      isSuccess = false;
    }

    // Log the query (both TEST and PROD, including errors for debugging)
    // This helps track issues but doesn't affect billing
    await logQuery(apiKeyType, query, data, statusCode);

    // Handle PROD API key: ONLY track costs and send Slack if TaxJar call was successful
    // Don't charge user for:
    // - TaxJar API errors (4xx, 5xx)
    // - Network failures
    // - Invalid responses
    // - Missing rate data
    if (apiKeyType === "prod" && isSuccess) {
      const costStats = await trackCost();
      await sendSlackNotification(
        query,
        costStats.totalInvocations,
        costStats.totalCost
      );
    }

    // Return response with CORS headers
    const headers = addCorsHeaders(
      new Headers({
        "Content-Type": "application/json",
      })
    );

    return new Response(JSON.stringify(data), {
      headers,
      status: statusCode,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 500;

    const headers = addCorsHeaders(
      new Headers({
        "Content-Type": "application/json",
      })
    );

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers,
        status: statusCode,
      }
    );
  }
}
