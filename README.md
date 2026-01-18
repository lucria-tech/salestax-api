# Lucria Sales Tax API

A Bun-based server wrapper for the TaxJar tax rate calculator API with query logging, cost tracking, and Slack notifications.

## Features

- 🚀 **Fast Bun Server** - Built on Bun runtime for optimal performance
- 🔐 **API Key Authentication** - Separate TEST and PROD API keys
- 📊 **Query Logging** - All requests logged to monthly JSON files
- 💰 **Cost Tracking** - Track API costs per call with monthly totals (PROD only)
- 📱 **Slack Notifications** - Real-time notifications for PROD API calls with query details
- 📚 **OpenAPI/Swagger Docs** - Interactive API documentation
- ✅ **Full Test Coverage** - Unit and integration tests
- 🔄 **CI/CD Ready** - GitHub Actions workflow included

## Environment Variables

Create a `.env` file in the root directory:

```bash
# API Keys
TEST_API_KEY=your-test-api-key-here
PROD_API_KEY=your-prod-api-key-here

# Slack Integration (PROD only)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cost Tracking
COST_PER_CALL=2  # INR (Rupees) per API call

# Server Configuration
PORT=3000  # Optional, defaults to 3000
```

## Installation

```bash
# Install dependencies
bun install
```

## Running

```bash
# Development mode
bun run dev

# Production mode
bun run start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Calculate Tax Rate

```bash
GET /
```

**Headers:**
- `x-api-key`: Your API key (TEST_API_KEY or PROD_API_KEY)

**Query Parameters:**
- `country` (required): Country code (e.g., "US")
- `zip` (optional, required for US): ZIP/Postal code
- `street` (optional): Street address
- `city` (optional): City name

**Example:**
```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "http://localhost:3000/?country=US&zip=48201"
```

**Response:**
```json
{
  "rate": {
    "state": "MI",
    "zip": "48201",
    "city": "DETROIT",
    "country": "US",
    "combined_rate": "0.06"
  }
}
```

### API Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs/openapi.json`

### Health Check

```bash
GET /health
```

Returns server status and timestamp.

## API Key Behavior

### TEST_API_KEY
- ✅ Logs all queries to JSON files
- ❌ No Slack notifications
- ❌ No cost tracking

### PROD_API_KEY
- ✅ Logs all queries to JSON files
- ✅ Sends Slack notifications with invocation count and costs
- ✅ Tracks costs per call and monthly totals

## Data Storage

All data is stored in the `data/` directory:

- `data/logs/YYYY-MM.json` - Query logs (all requests)
- `data/costs/YYYY-MM.json` - Cost tracking (PROD only)

Files are automatically created per month and reset at the start of each new month.

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

## Project Structure

```
lucria-salestax/
├── src/
│   ├── server.ts          # Main server entry point
│   ├── routes/
│   │   ├── tax.ts         # Tax calculation endpoint
│   │   └── docs.ts        # Documentation endpoints
│   ├── services/
│   │   ├── api-key.ts     # API key validation
│   │   ├── query-logger.ts # Query logging service
│   │   ├── cost-tracker.ts # Cost tracking service
│   │   └── slack.ts        # Slack notification service
│   ├── utils/
│   │   └── cors.ts         # CORS headers
│   └── types/
│       └── index.ts        # TypeScript types
├── data/
│   ├── logs/              # Query logs (monthly JSON files)
│   └── costs/             # Cost tracking (monthly JSON files)
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions CI/CD
└── README.md
```

## CI/CD

GitHub Actions workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The workflow:
1. Runs all tests
2. Checks code formatting
3. Performs type checking

## License

Private - All rights reserved
