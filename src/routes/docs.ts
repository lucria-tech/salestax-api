import { addCorsHeaders } from "../utils/cors.ts";

const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "Tax Calculator API",
    version: "1.0.0",
    description: "A server wrapper for the TaxJar tax rate calculator API",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "Calculate tax rate",
        description: "Get tax rate information for a given location",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "country",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "Country code (e.g., 'US')",
          },
          {
            name: "zip",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "ZIP/Postal code (required when country is US)",
          },
          {
            name: "street",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Street address",
          },
          {
            name: "city",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "City name",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rate: {
                      type: "object",
                      properties: {
                        state: { type: "string" },
                        zip: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                        county: { type: "string" },
                        country_rate: { type: "string" },
                        state_rate: { type: "string" },
                        county_rate: { type: "string" },
                        combined_district_rate: { type: "string" },
                        combined_rate: { type: "string" },
                        freight_taxable: { type: "boolean" },
                        city_rate: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing API key",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request - Missing required parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        description: "Check if the API is running",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    },
  },
};

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Calculator API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/docs/openapi.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;

export function handleOpenApiJson(req: Request): Response {
  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "application/json",
    })
  );

  return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
    headers,
    status: 200,
  });
}

export function handleSwaggerUI(req: Request): Response {
  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "text/html",
    })
  );

  return new Response(SWAGGER_HTML, {
    headers,
    status: 200,
  });
}
