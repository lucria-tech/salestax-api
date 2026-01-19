# Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Ready
- [x] All code committed to GitHub
- [x] Tests passing
- [x] Redis integration working
- [x] Environment variables documented

### 2. DigitalOcean App Platform Setup

#### Step 1: Create App
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Connect GitHub repository: `lucria-tech/salestax-api`
4. Select branch: `main`

#### Step 2: Configure Build Settings
- **Build Command:** `bun run build` (or leave empty - uses package.json build script)
- **Run Command:** `bun run start`
- **Environment:** Bun (select Bun runtime if available, otherwise Node.js)

#### Step 3: Set Environment Variables
Go to **Settings → App-Level Environment Variables** and add:

```bash
TEST_API_KEY=your-test-api-key-here
PROD_API_KEY=your-prod-api-key-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
COST_PER_CALL=2
PORT=3000
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### Step 4: Deploy
1. Click **Create Resources** or **Deploy**
2. Wait for build to complete
3. Check deployment logs

### 3. Post-Deployment Verification

#### Test Health Check
```bash
curl https://your-app.ondigitalocean.app/health
```

#### Test API
```bash
curl -H "x-api-key: YOUR_PROD_API_KEY" \
  "https://your-app.ondigitalocean.app/?country=US&zip=48201"
```

#### Check Logs
In DigitalOcean App Platform → Runtime Logs, look for:
- ✅ \"Connected to Upstash Redis\"
- ✅ \"Tax Calculator API server running\"
- ✅ No Redis connection errors

#### Test Admin Dashboard
1. Navigate to: `https://your-app.ondigitalocean.app/admin`
2. Enter password: Your `TEST_API_KEY` value
3. Verify dashboard loads with data

### 4. Monitoring

- Check DigitalOcean App Platform metrics
- Monitor Upstash Redis usage
- Review application logs regularly
- Test API endpoints periodically

## 🚨 Troubleshooting

### Build Fails
- Check build logs in DigitalOcean
- Verify `bun install` completes successfully
- Ensure Node.js runtime is selected

### Redis Connection Fails
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set correctly
- Check Upstash dashboard for database status
- Review runtime logs for connection errors

### API Not Responding
- Check if app is running (Runtime Logs)
- Verify PORT environment variable
- Check health endpoint

### Admin Dashboard Not Loading
- Verify TEST_API_KEY is set correctly
- Check browser console for errors
- Verify Redis has data (check Upstash dashboard)

## 📝 Quick Deploy Commands

After setting up in DigitalOcean dashboard:

```bash
# Your code is already pushed to GitHub
# DigitalOcean will auto-deploy on push

# To trigger manual deploy:
# 1. Go to DigitalOcean App Platform
# 2. Click \"Actions\" → \"Force Rebuild\"
```

## ✅ Success Indicators

- ✅ App builds successfully
- ✅ Health check returns 200 OK
- ✅ API returns tax rates
- ✅ Redis connection established
- ✅ Admin dashboard accessible
- ✅ Data persists across deployments

