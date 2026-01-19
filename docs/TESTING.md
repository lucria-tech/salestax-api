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

> Note: If the server isn't running, integration tests will gracefully skip with a warning.

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
curl -H "x-api-key: YOUR_TEST_API_KEY" \
  "http://localhost:3000/?country=US&zip=48201"
```

#### Production API Key (Full Features)

```bash
curl -H "x-api-key: YOUR_PROD_API_KEY" \
  "http://localhost:3000/?country=US&zip=48201"
```

#### Test Invalid API Key

```bash
curl -H "x-api-key: invalid-key" \
  "http://localhost:3000/?country=US&zip=48201"
```

#### Test Without API Key

```bash
curl "http://localhost:3000/?country=US&zip=48201"
```

#### Health Check

```bash
curl "http://localhost:3000/health"
```

#### OpenAPI Documentation

```bash
curl "http://localhost:3000/docs/openapi.json"
```

### 3. Test Admin Dashboard

1. Navigate to: `http://localhost:3000/admin`
2. Enter password: Your `TEST_API_KEY` value
3. View dashboard with:
   - Query statistics
   - Cost tracking
   - Charts and graphs
   - Recent queries table

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

## Environment Variables for Testing

Create a `.env` file with:

```bash
TEST_API_KEY=your-test-api-key-here
PROD_API_KEY=your-prod-api-key-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
COST_PER_CALL=2
PORT=3000
```

## CI/CD Testing

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/ci.yml` for CI/CD configuration.

