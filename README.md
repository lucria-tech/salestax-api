# Tax Calculator API

A production-ready, serverless-friendly API wrapper for the TaxJar tax rate calculator built with Bun runtime. Features comprehensive query logging, cost tracking, Slack notifications, and an admin dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)

## 🎯 Overview

This API acts as a middleware layer between clients and the TaxJar tax calculation service. It provides:

- **API Key Authentication** - Separate TEST and PROD keys with different behaviors
- **Query Logging** - All requests logged to Upstash Redis for persistence
- **Cost Tracking** - Track API costs per call (₹2 per PROD call) with monthly totals
- **Slack Notifications** - Real-time notifications for PROD API calls
- **Admin Dashboard** - Password-protected dashboard with analytics and charts
- **OpenAPI Documentation** - Interactive API documentation

### Key Features

- ✅ **Serverless-Ready** - Uses Upstash Redis (REST API) for persistence
- ✅ **Production-Grade** - Error handling, logging, and monitoring
- ✅ **Cost Tracking** - Automatic cost calculation and monthly reporting
- ✅ **Beautiful Notifications** - Formatted Slack messages with query details
- ✅ **Admin Dashboard** - Visual analytics with charts and graphs

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│    App)     │
└──────┬──────┘
       │ HTTP Request
       │ (x-api-key header)
       ▼
┌─────────────────────────────────────┐
│      Tax Calculator API Server       │
│         (Bun Runtime)                │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  1. API Key Validation       │  │
│  │     (TEST vs PROD)           │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  2. Forward to TaxJar API   │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  3. Log Query (Redis)       │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  4. Track Cost (PROD only)   │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  5. Send Slack (PROD only)   │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Upstash Redis                │
│  ┌────────────┐  ┌──────────────┐   │
│  │ logs:MM    │  │ costs:MM     │   │
│  │ (queries)  │  │ (tracking)  │   │
│  └────────────┘  └──────────────┘   │
└──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Slack Webhook                │
│    (PROD notifications only)          │
└──────────────────────────────────────┘
```

### Request Flow

1. **Client Request** → API receives HTTP request with `x-api-key` header
2. **Authentication** → Validates API key (TEST or PROD)
3. **Tax Calculation** → Forwards request to TaxJar API
4. **Response Processing** → Receives tax rate data
5. **Logging** → Stores query in Redis (`logs:YYYY-MM`)
6. **Cost Tracking** → If PROD, tracks cost in Redis (`costs:YYYY-MM`)
7. **Notification** → If PROD, sends formatted Slack message
8. **Response** → Returns tax rate data to client

## 🔧 System Components

### 1. Server (`src/server.ts`)

The main HTTP server built on Bun runtime. Handles:

- **Routing** - Routes requests to appropriate handlers
- **CORS** - Handles preflight and CORS headers
- **Error Handling** - Global error handling and logging
- **Health Checks** - `/health` endpoint for monitoring

**Key Responsibilities:**
- Parse incoming requests
- Route to appropriate handlers (tax, docs, admin)
- Handle CORS preflight requests
- Return appropriate error responses

### 2. API Key Service (`src/services/api-key.ts`)

Manages API key validation and type detection.

**Functions:**
- `validateApiKey(apiKey)` - Validates and returns key type (test/prod/invalid)
- `requireApiKey(apiKey)` - Throws error if invalid, returns validation

**Key Types:**
- **TEST_API_KEY** - Logs queries only, no costs, no Slack
- **PROD_API_KEY** - Full features: logging, costs, Slack notifications

### 3. Query Logger (`src/services/query-logger.ts`)

Stores all API requests in Upstash Redis.

**Data Structure:**
```typescript
{
  month: "2026-01",
  queries: [
    {
      timestamp: "2026-01-18T21:10:00Z",
      apiKey: "prod" | "test",
      query: { country, zip, city, street },
      response: { rate: {...} } | { error: "..." },
      statusCode: 200
    }
  ]
}
```

**Redis Key:** `logs:YYYY-MM`

**Functions:**
- `logQuery()` - Logs a single query
- `getAllLogs()` - Retrieves all monthly logs for admin dashboard

### 4. Cost Tracker (`src/services/cost-tracker.ts`)

Tracks API costs for PROD requests only.

**Important Billing Policy:**
- ✅ **Charged:** Only successful TaxJar API calls (status 200 with valid rate data)
- ❌ **NOT Charged:** TaxJar API errors, network failures, invalid responses, or missing data
- This ensures users are never charged for issues outside their control

**Data Structure:**
```typescript
{
  month: "2026-01",
  totalInvocations: 1500,
  totalCost: 3000.00,
  invocations: [
    {
      timestamp: "2026-01-18T21:10:00Z",
      cost: 2
    }
  ]
}
```

**Redis Key:** `costs:YYYY-MM`

**Functions:**
- `trackCost()` - Increments monthly cost and invocation count
- `getMonthlyStats()` - Gets current month's stats
- `getAllCosts()` - Gets all monthly cost data

**Cost Calculation:**
- Cost per call: ₹2 (configurable via `COST_PER_CALL`)
- Only PROD API calls are tracked
- **Only charged for successful API calls** (status 200 with valid rate data)
- Monthly totals automatically calculated

**Billing Protection:**
- Users are NOT charged for:
  - TaxJar API errors (4xx, 5xx status codes)
  - Network failures or timeouts
  - Invalid or malformed responses
  - Missing rate data in response
- All errors are logged for debugging but don't affect billing

### 5. Slack Service (`src/services/slack.ts`)

Sends formatted notifications to Slack for PROD API calls.

**Message Format:**
```
💰 Tax Calculator API - Invocation #1500

Query Details:
🌍 Country: US
📮 ZIP Code: 48201
🏙️ City: Detroit

📊 Invocation Number    💵 Total Cost This Month
#1500                   ₹3000.00

🕐 Jan 19, 2026 at 2:40 AM IST
```

**Features:**
- Beautiful formatting with emojis
- Query details in readable format
- Invocation count and monthly cost
- IST timezone timestamp

**Only triggers for:** PROD_API_KEY requests

### 6. Tax Route Handler (`src/routes/tax.ts`)

Main API endpoint handler for tax calculations.

**Process:**
1. Validates API key
2. Parses query parameters (country, zip, city, street)
3. Builds TaxJar API URL
4. Forwards request to TaxJar (with error handling)
5. Logs query to Redis (always, for debugging)
6. **Only if successful:** Tracks cost (PROD only)
7. **Only if successful:** Sends Slack notification (PROD only)
8. Returns response to client

**Billing Protection:**
- Cost is tracked ONLY if TaxJar returns status 200 with valid rate data
- Network errors, API errors, or invalid responses do NOT result in charges
- All requests are logged for debugging, but billing only occurs on success

### 7. Admin Dashboard (`src/routes/admin.ts`)

Password-protected admin interface.

**Authentication:**
- Password: `TEST_API_KEY` value
- Session cookie-based (1 hour expiry)
- Login form at `/admin`

**Features:**
- **Statistics Cards** - Total queries, PROD queries, TEST queries, total cost
- **Charts** - Query trends over time, monthly costs
- **Query Table** - Last 50 queries with details
- **Real-time Data** - Reads directly from Redis

**Data Sources:**
- `getAllLogs()` - All query logs from Redis
- `getAllCosts()` - All cost tracking from Redis

### 8. Documentation Routes (`src/routes/docs.ts`)

API documentation endpoints.

**Endpoints:**
- `/docs` - Swagger UI (interactive documentation)
- `/docs/openapi.json` - OpenAPI 3.0 specification

### 9. Redis Utility (`src/utils/redis.ts`)

Upstash Redis client wrapper.

**Features:**
- Singleton pattern (one connection)
- Automatic reconnection
- Error handling
- Connection logging

**Configuration:**
- Uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- REST API (serverless-friendly)
- No persistent connections needed

## 📊 Data Flow

### TEST API Key Flow

```
Request → Validate TEST_API_KEY → Forward to TaxJar → Log Query → Return Response
```

**What happens:**
1. ✅ Query logged to Redis
2. ❌ No cost tracking
3. ❌ No Slack notification

### PROD API Key Flow

```
Request → Validate PROD_API_KEY → Forward to TaxJar → Check Success → Log Query → [If Success: Track Cost + Send Slack] → Return Response
```

**What happens:**
1. ✅ Query logged to Redis (always, for debugging)
2. ✅ **If successful:** Cost tracked (₹2 per call)
3. ✅ **If successful:** Slack notification sent
4. ✅ **If successful:** Monthly totals updated
5. ❌ **If error:** No charge, no Slack, but error logged

**Success Criteria (must all be true):**
- TaxJar API returns status 200
- Response contains valid `rate` object
- Rate object has `combined_rate` field
- No error field in response

**Billing Protection:**
- Users are NOT charged for TaxJar errors, network failures, or invalid responses
- All errors are logged for debugging but don't affect billing

## 🌐 API Endpoints

### Calculate Tax Rate

**Endpoint:** `GET /`

**Headers:**
```
x-api-key: YOUR_API_KEY
```

**Query Parameters:**
- `country` (required) - Country code (e.g., "US")
- `zip` (optional, required for US) - ZIP/Postal code
- `city` (optional) - City name
- `street` (optional) - Street address

**Example Request:**
```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-api.com/?country=US&zip=48201&city=Detroit"
```

**Success Response (200):**
```json
{
  "rate": {
    "state": "MI",
    "zip": "48201",
    "city": "DETROIT",
    "country": "US",
    "combined_rate": "0.06",
    "state_rate": "0.06",
    "county_rate": "0.0",
    "city_rate": "0.0"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing API key
- `400 Bad Request` - Missing required parameters
- `500 Internal Server Error` - Server error

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T21:10:00.000Z"
}
```

### API Documentation

**Endpoint:** `GET /docs`

Returns interactive Swagger UI for API exploration.

**OpenAPI Spec:** `GET /docs/openapi.json`

### Admin Dashboard

**Endpoint:** `GET /admin`

Password-protected dashboard. Password is your `TEST_API_KEY` value.

## ⚙️ Installation & Setup

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- Upstash Redis account (free tier available)
- Slack webhook URL (optional, for PROD notifications)

### Step 1: Clone Repository

```bash
git clone https://github.com/lucria-tech/salestax-api.git
cd salestax-api
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Configure Environment Variables

Create a `.env` file:

```bash
# API Keys
TEST_API_KEY=your-test-api-key-here
PROD_API_KEY=your-prod-api-key-here

# Slack Integration (PROD only)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cost Tracking
COST_PER_CALL=2  # INR per API call

# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Server Configuration
PORT=3000  # Optional, defaults to 3000
```

### Step 4: Get Upstash Redis Credentials

1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy the REST URL and Token
4. Add to `.env` file

### Step 5: Start Server

```bash
# Development
bun run dev

# Production
bun run start
```

Server will start on `http://localhost:3000`

## 🔐 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TEST_API_KEY` | Yes | Test API key (logs only) | `test-key-123` |
| `PROD_API_KEY` | Yes | Production API key (full features) | `prod-key-456` |
| `SLACK_WEBHOOK_URL` | No | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `COST_PER_CALL` | Yes | Cost per API call in INR | `2` |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST Token | `xxx` |
| `PORT` | No | Server port (default: 3000) | `3000` |

### API Key Behavior

#### TEST_API_KEY
- ✅ Logs all queries to Redis
- ❌ No cost tracking
- ❌ No Slack notifications
- ✅ Can access admin dashboard (used as password)

#### PROD_API_KEY
- ✅ Logs all queries to Redis
- ✅ Tracks costs (₹2 per call)
- ✅ Sends Slack notifications
- ✅ Monthly cost totals

## 💡 Usage Examples

### Basic Tax Calculation

```bash
curl -H "x-api-key: YOUR_PROD_API_KEY" \
  "http://localhost:3000/?country=US&zip=48201"
```

### With Full Address

```bash
curl -H "x-api-key: YOUR_PROD_API_KEY" \
  "http://localhost:3000/?country=US&zip=10001&city=New%20York&street=123%20Main%20St"
```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  'http://localhost:3000/?country=US&zip=48201',
  {
    headers: {
      'x-api-key': 'YOUR_API_KEY'
    }
  }
);

const data = await response.json();
console.log(data.rate.combined_rate); // "0.06"
```

### Python

```python
import requests

url = "http://localhost:3000/"
headers = {
    "x-api-key": "YOUR_API_KEY"
}
params = {
    "country": "US",
    "zip": "48201"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print(data["rate"]["combined_rate"])  # "0.06"
```

## 🚀 Deployment

### DigitalOcean App Platform

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Steps:**
1. Create Upstash Redis database
2. Create DigitalOcean App
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Environment Variables for Production

Ensure all required environment variables are set in your deployment platform:

```bash
TEST_API_KEY=...
PROD_API_KEY=...
SLACK_WEBHOOK_URL=...
COST_PER_CALL=2
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
PORT=3000
```

## 🧪 Testing

### Run Tests

```bash
# All tests
bun test

# Watch mode
bun test --watch

# Unit tests only
bun test tests/unit

# Integration tests (requires server running)
bun test tests/integration
```

### Manual Testing

1. **Start server:**
   ```bash
   bun run dev
   ```

2. **Test API:**
   ```bash
   curl -H "x-api-key: YOUR_KEY" \
     "http://localhost:3000/?country=US&zip=48201"
   ```

3. **Check admin dashboard:**
   - Navigate to `http://localhost:3000/admin`
   - Enter `TEST_API_KEY` as password
   - View queries and costs

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

## 📁 Project Structure

```
lucria-salestax/
├── src/
│   ├── server.ts              # Main HTTP server
│   ├── routes/
│   │   ├── tax.ts            # Tax calculation endpoint
│   │   ├── admin.ts          # Admin dashboard
│   │   └── docs.ts           # API documentation
│   ├── services/
│   │   ├── api-key.ts        # API key validation
│   │   ├── query-logger.ts   # Query logging service
│   │   ├── cost-tracker.ts   # Cost tracking service
│   │   └── slack.ts          # Slack notifications
│   ├── utils/
│   │   ├── cors.ts           # CORS headers
│   │   └── redis.ts          # Redis client wrapper
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── tests/
│   ├── unit/                 # Unit tests
│   │   └── api-key.test.ts
│   └── integration/          # Integration tests
│       └── tax.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD
├── package.json
├── tsconfig.json
├── README.md                 # This file
├── TESTING.md                # Testing guide
└── DEPLOYMENT.md             # Deployment guide
```

## 🔄 Data Storage

### Redis Keys

All data is stored in Upstash Redis:

- **Query Logs:** `logs:YYYY-MM` (e.g., `logs:2026-01`)
- **Cost Tracking:** `costs:YYYY-MM` (e.g., `costs:2026-01`)

### Data Retention

- Keys expire after 1 year automatically
- Monthly data is organized by month
- All queries are logged (both TEST and PROD)
- Only PROD queries are cost-tracked

### Data Structure Examples

**Query Log:**
```json
{
  "month": "2026-01",
  "queries": [
    {
      "timestamp": "2026-01-18T21:10:00Z",
      "apiKey": "prod",
      "query": {
        "country": "US",
        "zip": "48201",
        "city": "Detroit",
        "street": ""
      },
      "response": {
        "rate": {
          "combined_rate": "0.06",
          ...
        }
      },
      "statusCode": 200
    }
  ]
}
```

**Cost Log:**
```json
{
  "month": "2026-01",
  "totalInvocations": 1500,
  "totalCost": 3000.00,
  "invocations": [
    {
      "timestamp": "2026-01-18T21:10:00Z",
      "cost": 2
    }
  ]
}
```

## 🛡️ Security

### API Key Security

- API keys are validated on every request
- Invalid keys return `401 Unauthorized`
- Keys are stored as environment variables (never in code)

### Admin Dashboard Security

- Password-protected (uses `TEST_API_KEY`)
- Session-based authentication
- HttpOnly cookies
- 1-hour session expiry

### CORS

- Configured for cross-origin requests
- Allows common headers
- Supports OPTIONS preflight

## 📈 Monitoring & Analytics

### Admin Dashboard Features

- **Real-time Statistics** - Total queries, costs, invocations
- **Visual Charts** - Query trends, monthly costs
- **Query History** - Last 50 queries with full details
- **Cost Analysis** - Monthly cost breakdowns

### Slack Notifications

- Real-time notifications for PROD calls
- Formatted with query details
- Includes invocation count and monthly cost
- IST timezone timestamps

## 🐛 Troubleshooting

### Redis Connection Issues

**Error:** "Upstash Redis credentials not set"

**Solution:** Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in `.env`

### API Key Not Working

**Error:** "Unauthorized: Invalid or missing API key"

**Solution:** 
- Check `x-api-key` header is present
- Verify API key matches `TEST_API_KEY` or `PROD_API_KEY`
- Check for extra spaces or quotes

### Slack Notifications Not Sending

**Possible Causes:**
- `SLACK_WEBHOOK_URL` not set
- Using TEST_API_KEY (notifications only for PROD)
- Invalid webhook URL

**Solution:** Check environment variables and use PROD_API_KEY

### Admin Dashboard Access Denied

**Solution:** Use your `TEST_API_KEY` value as the password

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

Private - All rights reserved

## 🔗 Links

- [Bun Runtime](https://bun.sh)
- [Upstash Redis](https://upstash.com/)
- [TaxJar API](https://developers.taxjar.com/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Bun and Upstash Redis**
