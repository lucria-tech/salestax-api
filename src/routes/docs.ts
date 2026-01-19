import { addCorsHeaders } from "../utils/cors.ts";

const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "Tax Calculator API",
    version: "1.0.0",
    description:
      "A server wrapper for the TaxJar tax rate calculator API (US ZIP-code only)",
  },
  servers: [
    {
      url: "https://lucria-salestax-api-3sgwb.ondigitalocean.app",
      description: "Production server",
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "Calculate tax rate",
        description: "Get US sales tax rate information for a given ZIP code",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "zip",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description:
              "US ZIP code / pincode. The API is US-only and always uses country=US.",
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

const DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lucria Sales Tax API Documentation</title>
    <meta name="description" content="Calculate US sales tax by ZIP code using the Lucria Sales Tax API. Simple, production-ready API with API keys, logging, and monitoring.">

    <meta property="og:title" content="Lucria Sales Tax API Documentation">
    <meta property="og:description" content="Calculate US sales tax by ZIP code using the Lucria Sales Tax API.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://lucria-salestax-api-3sgwb.ondigitalocean.app/docs">
    <meta property="og:image" content="https://lucria-salestax-api-3sgwb.ondigitalocean.app/static/og.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Lucria Sales Tax API Documentation">
    <meta name="twitter:description" content="Calculate US sales tax by ZIP code using the Lucria Sales Tax API.">
    <meta name="twitter:image" content="https://lucria-salestax-api-3sgwb.ondigitalocean.app/static/og.png">

    <style>
      :root {
        color-scheme: light dark;
        --bg: #f5f7fb;
        --card-bg: #ffffff;
        --text-main: #0f172a;
        --text-muted: #64748b;
        --accent: #0f766e;
        --code-bg: #0b1120;
        --border-subtle: #e2e8f0;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
          "Inter", sans-serif;
        background: radial-gradient(circle at top left, #e0f2fe 0, transparent 50%),
                    radial-gradient(circle at bottom right, #f5f3ff 0, transparent 55%),
                    var(--bg);
        min-height: 100vh;
        color: var(--text-main);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
      }
      .page {
        max-width: 880px;
        width: 100%;
        background: rgba(255, 255, 255, 0.94);
        border-radius: 32px;
        box-shadow:
          0 40px 80px rgba(15, 23, 42, 0.18),
          0 0 0 1px rgba(148, 163, 184, 0.16);
        padding: 32px 32px 28px;
        backdrop-filter: blur(20px);
      }
      header {
        text-align: center;
        margin-bottom: 28px;
      }
      .logo-circle {
        width: 80px;
        height: 80px;
        border-radius: 999px;
        margin: 0 auto 16px;
        background: #020617;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #e5e7eb;
        font-weight: 600;
        letter-spacing: 0.08em;
        font-size: 11px;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 32px;
        letter-spacing: -0.03em;
      }
      .subtitle {
        margin: 0;
        color: var(--text-muted);
        font-size: 15px;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        gap: 24px;
        align-items: flex-start;
      }
      .card {
        background: var(--card-bg);
        border-radius: 20px;
        border: 1px solid var(--border-subtle);
        padding: 18px 18px 16px;
      }
      .card h2 {
        margin: 0 0 10px;
        font-size: 16px;
        letter-spacing: -0.02em;
      }
      .card p {
        margin: 0 0 12px;
        color: var(--text-muted);
        font-size: 14px;
      }
      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace;
        font-size: 13px;
      }
      pre {
        margin: 0;
        background: var(--code-bg);
        color: #e5e7eb;
        padding: 12px 14px;
        border-radius: 14px;
        overflow-x: auto;
        border: 1px solid rgba(15, 23, 42, 0.7);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.08);
        color: #0f766e;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin-bottom: 8px;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 10px;
        font-size: 12px;
        color: var(--text-muted);
      }
      .meta-label {
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.06em;
        font-size: 11px;
      }
      a {
        color: var(--accent);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        margin: 12px 0 6px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      ul {
        padding-left: 18px;
        margin: 6px 0 0;
        color: var(--text-muted);
        font-size: 13px;
      }
      li + li {
        margin-top: 2px;
      }
      footer {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--text-muted);
      }
      @media (max-width: 768px) {
        .page {
          padding: 20px 18px 18px;
          border-radius: 24px;
        }
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
        h1 {
          font-size: 24px;
        }
      }
    </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="logo-circle">LUCRIA<br>CONSULT</div>
      <h1>Lucria Sales Tax API Documentation</h1>
      <p class="subtitle">Calculate US sales tax in one request using a single ZIP (pincode) parameter.</p>
    </header>

    <div class="grid">
      <section class="card">
        <div class="pill">Quick Start</div>
        <h2>1. Make your first request</h2>
        <p>Call the root endpoint with your API key and a US ZIP code. The API is US-only and always uses country=US internally.</p>
        <pre><code>curl -H "x-api-key: YOUR_API_KEY" \
  "https://lucria-salestax-api-3sgwb.ondigitalocean.app/?zip=48201"</code></pre>

        <div class="section-title">Required input</div>
        <ul>
          <li><strong>Header</strong>: <code>x-api-key: YOUR_API_KEY</code></li>
          <li><strong>Query</strong>: <code>zip=48201</code> (US ZIP / pincode)</li>
        </ul>

        <div class="section-title">Success response (200)</div>
        <pre><code>{
  "rate": {
    "state": "MI",
    "zip": "48201",
    "city": "DETROIT",
    "country": "US",
    "combined_rate": "0.06",
    "state_rate": "0.06"
  }
}</code></pre>
      </section>

      <aside class="card">
        <div class="pill">Reference</div>
        <h2>Endpoint & keys</h2>
        <p>Use this from your backend or serverless functions. All requests must include the <code>x-api-key</code> header.</p>
        <div class="meta">
          <div>
            <div class="meta-label">Base URL</div>
            <div>https://lucria-salestax-api-3sgwb.ondigitalocean.app</div>
          </div>
          <div>
            <div class="meta-label">Endpoint</div>
            <div><code>GET /?zip=48201</code></div>
          </div>
          <div>
            <div class="meta-label">Header</div>
            <div><code>x-api-key: ...</code></div>
          </div>
          <div>
            <div class="meta-label">Docs for devs</div>
            <div><a href="/docs/dev">/docs/dev</a></div>
          </div>
        </div>

        <div class="section-title">Error responses</div>
        <ul>
          <li><strong>401 Unauthorized</strong> – missing or invalid <code>x-api-key</code></li>
          <li><strong>400 Bad Request</strong> – missing <code>zip</code> parameter</li>
          <li><strong>500 Internal Server Error</strong> – unexpected server issue</li>
        </ul>
      </aside>
    </div>

    <footer>
      <span>Built for Lucria Consult</span>
      <span>Developer OpenAPI docs: <a href="/docs/dev">/docs/dev</a></span>
    </footer>
  </div>
</body>
</html>`;

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
                url: "/docs/dev/openapi.json",
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

export function handleDocsHtml(req: Request): Response {
  const headers = addCorsHeaders(
    new Headers({
      "Content-Type": "text/html; charset=utf-8",
    })
  );

  return new Response(DOCS_HTML, {
    headers,
    status: 200,
  });
}

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
