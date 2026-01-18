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

    // Forward request to TaxJar API
    const response = await fetch(taxjarUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();
    const statusCode = response.status;

    // Log the query (both TEST and PROD)
    await logQuery(apiKeyType, query, data, statusCode);

    // Handle PROD API key: track costs and send Slack notification
    if (apiKeyType === "prod") {
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
