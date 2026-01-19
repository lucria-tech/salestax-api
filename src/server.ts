import { join } from "path";
import { handleTaxRequest } from "./routes/tax.ts";
import {
  handleSwaggerUI,
  handleOpenApiJson,
  handleDocsHtml,
} from "./routes/docs.ts";
import { handleAdminUI } from "./routes/admin.ts";
import { addCorsHeaders } from "./utils/cors.ts";

const PORT = parseInt(Bun.env.PORT || "3000", 10);

const API_DOCS = `Tax Calculator API - Usage Guide (US-only)

Authentication:
  - Required Header: x-api-key: YOUR_API_KEY
  - All requests must include this header

Query Parameters:
  - zip (required): US ZIP/Postal code

Example Request:
  curl -H "x-api-key: YOUR_API_KEY" \\
    "https://lucria-salestax-api-3sgwb.ondigitalocean.app/?zip=48201"

Example Response:
  {
    "rate": {
      "state": "MI",
      "zip": "48201",
      "city": "DETROIT",
      "country": "US",
      "combined_rate": "0.06"
    }
  }

Error Responses:
  - 401: Missing or invalid API key
  - 400: Missing required parameters (zip is required)`;

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: addCorsHeaders(new Headers()) });
  }

  // Health check endpoint
  if (url.pathname === "/health") {
    const headers = addCorsHeaders(
      new Headers({
        "Content-Type": "application/json",
      })
    );
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      { headers, status: 200 }
    );
  }

  // Admin dashboard
  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    return handleAdminUI(req);
  }

  // Documentation endpoints
  if (url.pathname === "/docs" || url.pathname === "/docs/") {
    return handleDocsHtml(req);
  }

  if (url.pathname === "/docs/dev" || url.pathname === "/docs/dev/") {
    return handleSwaggerUI(req);
  }

  if (url.pathname === "/docs/dev/openapi.json") {
    return handleOpenApiJson(req);
  }

  // Static assets
  if (url.pathname === "/static/og.png") {
    try {
      const filePath = join(process.cwd(), "static", "og.png");
      const file = Bun.file(filePath);
      
      // Check if file exists
      const exists = await file.exists();
      if (!exists) {
        const headers = addCorsHeaders(
          new Headers({
            "Content-Type": "application/json",
          })
        );
        return new Response(
          JSON.stringify({ error: "OG image not found" }),
          { headers, status: 404 }
        );
      }

      const headers = addCorsHeaders(
        new Headers({
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        })
      );

      return new Response(file, {
        headers,
        status: 200,
      });
    } catch (error) {
      const headers = addCorsHeaders(
        new Headers({
          "Content-Type": "application/json",
        })
      );
      return new Response(
        JSON.stringify({ error: "Failed to serve OG image" }),
        { headers, status: 500 }
      );
    }
  }

  // Root endpoint - tax calculation or API docs
  if (url.pathname === "/" || url.pathname === "") {
    // If no API key provided, return plain text documentation
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      const headers = addCorsHeaders(
        new Headers({
          "Content-Type": "text/plain; charset=utf-8",
        })
      );
      return new Response(API_DOCS, { headers, status: 200 });
    }

    // Handle tax calculation request
    return handleTaxRequest(req);
  }

  // 404 for unknown routes
  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "application/json",
    })
  );
  return new Response(
    JSON.stringify({ error: "Not found" }),
    { headers, status: 404 }
  );
}

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`🚀 Tax Calculator API server running on http://localhost:${PORT}`);
console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
console.log(
  `🧑‍💻 Developer Docs (Swagger UI): http://localhost:${PORT}/docs/dev`,
);
console.log(
  `🔍 OpenAPI Spec: http://localhost:${PORT}/docs/dev/openapi.json`,
);
console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
