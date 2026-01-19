# Deployment Guide - DigitalOcean App Platform

This guide covers deploying the Tax Calculator API to DigitalOcean App Platform with Redis.

## Prerequisites

1. DigitalOcean account
2. Redis instance (DigitalOcean Managed Redis or external)

## Setup Steps

### 1. Create Redis Database

**Option A: DigitalOcean Managed Redis**
1. Go to DigitalOcean Dashboard → Databases → Create Database
2. Choose Redis
3. Select a plan (Basic plan works fine for this use case)
4. Choose region close to your app
5. Note the connection string

**Option B: External Redis (Recommended)**
- Use **Upstash Redis** (serverless-friendly, free tier available)
- Get the REST URL and Token from Upstash dashboard
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables

### 2. Create App on DigitalOcean App Platform

1. Go to DigitalOcean Dashboard → Apps → Create App
2. Connect your GitHub repository: `lucria-tech/salestax-api`
3. Configure build settings:
   - **Build Command:** `bun run build` (or leave empty, uses package.json build script)
   - **Run Command:** `bun run start`
   - **Environment:** Bun (select Bun runtime if available, otherwise Node.js)

### 3. Configure Environment Variables

In DigitalOcean App Platform → Settings → App-Level Environment Variables, add:

```bash
TEST_API_KEY=your-test-api-key-here
PROD_API_KEY=your-prod-api-key-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
COST_PER_CALL=2
PORT=3000
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Note:** We use Upstash Redis (REST API) which is perfect for serverless platforms like DigitalOcean App Platform.

### 4. Deploy

1. Push your code to GitHub
2. DigitalOcean will automatically build and deploy
3. Check the logs to ensure Redis connection is successful

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TEST_API_KEY` | Yes | Test API key | `your-test-key` |
| `PROD_API_KEY` | Yes | Production API key | `your-prod-key` |
| `SLACK_WEBHOOK_URL` | No | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `COST_PER_CALL` | Yes | Cost per API call in INR | `2` |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL | `https://your-redis.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST Token | `your-token-here` |
| `PORT` | No | Server port (default: 3000) | `3000` |

## Redis Key Structure

Data is stored in Redis with the following keys:

- `logs:YYYY-MM` - Query logs for each month
- `costs:YYYY-MM` - Cost tracking for each month

Keys expire after 2 months automatically.

## Troubleshooting

### Redis Connection Issues

1. **Check Upstash credentials:**
   - Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set correctly
   - Check Upstash dashboard for correct values

2. **Verify Redis is accessible:**
   - Upstash works over HTTPS, so no firewall issues
   - Check Upstash dashboard for any rate limits or errors

3. **Check logs:**
   ```bash
   # In DigitalOcean App Platform → Runtime Logs
   # Look for "✅ Connected to Upstash Redis" message
   ```

### App Won't Start

1. Check environment variables are set correctly
2. Verify `REDIS_URL` is accessible
3. Check build logs for errors

## Local Development

For local development, use Upstash Redis:

1. **Sign up for Upstash (Free Tier):**
   - Go to https://upstash.com/
   - Create a free Redis database
   - Copy the REST URL and Token

2. **Add to `.env`:**
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

3. **Start the server:**
   ```bash
   bun run dev
   ```

## Monitoring

- Check DigitalOcean App Platform metrics
- Monitor Redis memory usage
- Review application logs for errors

## Cost Optimization

- Upstash free tier: 10,000 commands/day (perfect for development)
- Paid plans start at $0.20 per 100K commands
- Keys auto-expire after 2 months
- Consider archiving old data if needed

