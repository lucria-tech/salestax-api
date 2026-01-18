# Testing Guide

This guide covers all ways to test the Tax Calculator API.

## Quick Start

```bash
# Run all tests
bun test

# Run tests in watch mode (auto-rerun on file changes)
bun test --watch

# Run only unit tests
bun test tests/unit

# Run only integration tests
bun test tests/integration
```

## Test Types

### 1. Unit Tests

Unit tests test individual functions and services in isolation.

**Location:** `tests/unit/`

**Current Tests:**
- `api-key.test.ts` - Tests API key validation logic

**Run:**
```bash
bun test tests/unit/api-key.test.ts
```

**Example Output:**
```
✓ API Key Validation > should validate TEST_API_KEY correctly
✓ API Key Validation > should validate PROD_API_KEY correctly
✓ API Key Validation > should reject invalid API key
✓ API Key Validation > should reject null API key
✓ API Key Validation > should reject empty API key
```

### 2. Integration Tests

Integration tests test the full API endpoints and require the server to be running.

**Location:** `tests/integration/`

**Current Tests:**
- `tax.test.ts` - Tests API endpoints, CORS, health checks, etc.

**To Run Integration Tests:**

1. **Start the server** in one terminal:
```bash
bun run dev
```

2. **Run integration tests** in another terminal:
```bash
bun test tests/integration
```

**Note:** If the server isn't running, integration tests will gracefully skip with a warning.

## Manual API Testing

### 1. Start the Server

```bash
# Development mode
bun run dev

# Or production mode
bun run start
```

The server will start on `http://localhost:3000` (or your configured PORT).

### 2. Test with cURL

#### Test API Key (No Slack, No Cost Tracking)

```bash
curl -H "x-api-key: 5863f9667ed0952fc085bb6cdab5c368c66e8d0b0f6057a9d004c09b387cb175" \
  "http://localhost:3000/?country=US&zip=48201"
```

**Expected:** Returns tax rate data, logs query, but no Slack notification or cost tracking.

#### Production API Key (Full Features)

```bash
curl -H "x-api-key: 400c94d04d8e55387fc4247642c31b2e6efe8c10676608c1b7f1f676b82d6956" \
  "http://localhost:3000/?country=US&zip=48201"
```

**Expected:** 
- Returns tax rate data
- Logs query to `data/logs/YYYY-MM.json`
- Tracks cost (₹2 per call) in `data/costs/YYYY-MM.json`
- Sends Slack notification (if SLACK_WEBHOOK_URL is set)

#### Test Invalid API Key

```bash
curl -H "x-api-key: invalid-key" \
  "http://localhost:3000/?country=US&zip=48201"
```

**Expected:** Returns `401 Unauthorized` error.

#### Test Without API Key

```bash
curl "http://localhost:3000/?country=US&zip=48201"
```

**Expected:** Returns API documentation (plain text).

#### Health Check

```bash
curl "http://localhost:3000/health"
```

**Expected:** 
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### OpenAPI Documentation

```bash
curl "http://localhost:3000/docs/openapi.json"
```

**Expected:** Returns OpenAPI 3.0 JSON specification.

### 3. Test Admin Dashboard

1. Navigate to: `http://localhost:3000/admin`
2. Enter password: Your `TEST_API_KEY` value
3. View dashboard with:
   - Query statistics
   - Cost tracking
   - Charts and graphs
   - Recent queries table

### 4. Verify Data Files

After making API calls, check the data files:

```bash
# View query logs
cat data/logs/$(date +%Y-%m).json

# View cost tracking (PROD only)
cat data/costs/$(date +%Y-%m).json
```

**Query Log Format:**
```json
{
  "month": "2024-01",
  "queries": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "apiKey": "prod",
      "query": {
        "country": "US",
        "zip": "48201",
        "city": "",
        "street": ""
      },
      "response": {
        "rate": { ... }
      },
      "statusCode": 200
    }
  ]
}
```

**Cost Log Format:**
```json
{
  "month": "2024-01",
  "totalInvocations": 1500,
  "totalCost": 3000.00,
  "invocations": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "cost": 2
    }
  ]
}
```

## Testing Checklist

### ✅ Unit Tests
- [ ] API key validation works correctly
- [ ] Invalid keys are rejected
- [ ] Null/empty keys are handled

### ✅ Integration Tests (Server Running)
- [ ] Valid API key returns 200 with tax data
- [ ] Invalid API key returns 401
- [ ] Missing API key shows docs
- [ ] CORS headers are present
- [ ] Health check works
- [ ] OpenAPI spec is accessible

### ✅ Manual Testing
- [ ] TEST_API_KEY works (no Slack, no costs)
- [ ] PROD_API_KEY works (with Slack, with costs)
- [ ] Query logs are created
- [ ] Cost tracking works (PROD only)
- [ ] Slack notifications sent (PROD only, if webhook set)
- [ ] Admin dashboard accessible with password
- [ ] Admin dashboard shows correct data

### ✅ Edge Cases
- [ ] Missing query parameters handled
- [ ] Invalid country codes handled
- [ ] Network errors handled gracefully
- [ ] File write errors don't break API

## Environment Variables for Testing

Create a `.env` file with:

```bash
TEST_API_KEY=5863f9667ed0952fc085bb6cdab5c368c66e8d0b0f6057a9d004c09b387cb175
PROD_API_KEY=400c94d04d8e55387fc4247642c31b2e6efe8c10676608c1b7f1f676b82d6956
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
COST_PER_CALL=2
PORT=3000
```

## CI/CD Testing

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/ci.yml` for CI/CD configuration.

## Troubleshooting

### Tests Fail with "Server not running"

**Solution:** Start the server first:
```bash
bun run dev
```

Then run tests in another terminal.

### Integration Tests Timeout

**Solution:** Check if server is accessible:
```bash
curl http://localhost:3000/health
```

### Environment Variables Not Loading

**Solution:** Ensure `.env` file exists in project root and contains required variables.

### Admin Dashboard Password Not Working

**Solution:** Use your `TEST_API_KEY` value exactly as it appears in `.env` file.

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install ab (Apache Bench)
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 -H "x-api-key: YOUR_PROD_API_KEY" \
  "http://localhost:3000/?country=US&zip=48201"
```

### Load Testing with curl

```bash
# Simple loop test
for i in {1..10}; do
  curl -H "x-api-key: YOUR_PROD_API_KEY" \
    "http://localhost:3000/?country=US&zip=48201" &
done
wait
```

## Next Steps

- Add more unit tests for other services
- Add end-to-end tests
- Add performance benchmarks
- Add load testing scenarios
