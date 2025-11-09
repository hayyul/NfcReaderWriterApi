# Deployment Guide

This guide walks you through deploying the Gas Station RFID API to production using Neon (PostgreSQL) and Render.

## Architecture

- **Database**: Neon (Serverless PostgreSQL)
- **Backend API**: Render (Web Service)
- **Environment**: Same codebase for local and production

---

## Part 1: Set Up Neon Database

### 1.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project named "gas-station-rfid"

### 1.2 Get Database Connection String

1. In your Neon dashboard, go to your project
2. Click on "Connection Details"
3. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this connection string** - you'll need it for Render

### 1.3 Configure Database

Your Neon database is ready! The migrations will be applied automatically during Render deployment.

---

## Part 2: Deploy to Render

### 2.1 Prepare Repository

1. Ensure your code is pushed to GitHub/GitLab/Bitbucket:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. Verify these files are in your repository:
   - `render.yaml` ✓
   - `prisma/migrations/` directory ✓
   - `package.json` with updated scripts ✓

### 2.2 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. Connect your GitHub/GitLab/Bitbucket account

### 2.3 Create New Web Service

#### Option A: Using render.yaml (Recommended)

1. Click **"New +"** → **"Blueprint"**
2. Select your repository
3. Render will automatically detect `render.yaml`
4. Click **"Apply"**

#### Option B: Manual Setup

1. Click **"New +"** → **"Web Service"**
2. Select your repository
3. Configure the following:

   **Basic Settings:**
   - Name: `gas-station-api`
   - Region: Choose closest to your users (Frankfurt/Oregon/Singapore)
   - Branch: `main`
   - Root Directory: Leave empty
   - Environment: `Node`
   - Build Command:
     ```
     npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - Start Command:
     ```
     npm start
     ```

   **Advanced Settings:**
   - Plan: Free (or Starter for production)
   - Health Check Path: `/health`

### 2.4 Configure Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `4000` | Render will override this |
| `HOST` | `0.0.0.0` | Required |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | **Your Neon connection string** |
| `JWT_SECRET` | `your-secure-random-string` | **Generate a secure secret!** |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `CORS_ORIGIN` | `*` | Change to your frontend URL |
| `RATE_LIMIT_MAX` | `100` | Requests per window |
| `RATE_LIMIT_TIMEWINDOW` | `60000` | Window in milliseconds |

**Generate JWT Secret:**
```bash
# Use this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Install dependencies
   - Build TypeScript
   - Generate Prisma client
   - Run database migrations
   - Start the server

3. Wait for deployment to complete (usually 2-5 minutes)

### 2.6 Verify Deployment

Once deployed, you'll get a URL like: `https://gas-station-api.onrender.com`

Test the endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# API info
curl https://your-app.onrender.com/api/v1
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## Part 3: Seed Production Database (Optional)

To add initial data to your production database:

### Option 1: Using Render Shell

1. In Render dashboard, go to your web service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run prisma:seed
   ```

### Option 2: Using API Endpoints

Use your API endpoints to create:
1. Users (via auth endpoints)
2. Stations (via stations endpoints)
3. Pumps (via pumps endpoints)

---

## Part 4: Local Development Setup

Your local environment remains unchanged:

### 4.1 Keep Using Docker Locally

```bash
# Start local PostgreSQL
docker-compose up -d

# Run migrations locally
npm run prisma:migrate

# Seed local database
npm run prisma:seed

# Run dev server
npm run dev
```

### 4.2 Environment Configuration

**Local (`.env`):**
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres123@localhost:5434/gasstation
JWT_SECRET=dev-secret-key-change-in-production-12345678
CORS_ORIGIN=http://localhost:8081
```

**Production (Render Dashboard):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require
JWT_SECRET=your-production-secret-64-chars
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## Part 5: Update Frontend Configuration

Update your frontend to use production API:

### Development Mode
```javascript
const API_BASE_URL = "http://localhost:4000/api/v1";
```

### Production Mode
```javascript
const API_BASE_URL = "https://your-app.onrender.com/api/v1";
```

### Environment-Based Configuration
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? "https://your-app.onrender.com/api/v1"
  : "http://localhost:4000/api/v1";
```

---

## Troubleshooting

### Build Failures

**Issue**: Prisma migrate fails
```
Solution: Check your DATABASE_URL in Render environment variables
Make sure it includes ?sslmode=require for Neon
```

**Issue**: TypeScript compilation errors
```
Solution: Run `npm run build` locally first to catch errors
Fix any TypeScript errors before deploying
```

### Runtime Errors

**Issue**: Database connection failed
```
Solution:
1. Verify DATABASE_URL is correct in Render
2. Check Neon database is active
3. Ensure connection string has ?sslmode=require
```

**Issue**: 502 Bad Gateway
```
Solution:
1. Check Render logs for errors
2. Verify server starts on PORT and HOST from environment
3. Ensure health check endpoint returns 200
```

**Issue**: CORS errors from frontend
```
Solution:
1. Update CORS_ORIGIN in Render to your frontend domain
2. Or use '*' for testing (not recommended for production)
```

### Database Issues

**Issue**: Tables not created
```
Solution:
1. Check migration files are committed to git
2. Verify build command includes: npx prisma migrate deploy
3. Check Render build logs for migration output
```

**Issue**: Database query timeouts
```
Solution:
1. Neon free tier auto-suspends after inactivity
2. First request after suspend takes ~1-2 seconds
3. Consider Neon paid tier for instant wake
```

---

## Monitoring & Maintenance

### View Logs

1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. Real-time logs appear here

### Check Database

1. Go to Neon dashboard
2. Click **"SQL Editor"**
3. Run queries to inspect data:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT * FROM gas_stations;
   ```

### Update Production

When you push new code:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render automatically:
1. Detects the push
2. Rebuilds the application
3. Runs migrations
4. Redeploys with zero downtime

---

## Cost Estimate

### Free Tier (Development/Testing)
- **Neon**: 0.5 GB storage, 3 GB data transfer
- **Render**: 750 hours/month (sleeps after 15 min inactivity)
- **Total**: $0/month

### Production Tier
- **Neon Pro**: $19/month (always-on, better performance)
- **Render Starter**: $7/month (always-on, no sleep)
- **Total**: ~$26/month

---

## Security Checklist

- [ ] Change JWT_SECRET from default value
- [ ] Use strong, random JWT_SECRET (64+ characters)
- [ ] Set CORS_ORIGIN to specific frontend domain
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review rate limiting settings
- [ ] Never commit .env file
- [ ] Use environment variables for all secrets
- [ ] Enable Neon connection pooling for production
- [ ] Set up database backups (Neon provides automatic backups)

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Connect to Neon database
3. 🔄 Deploy frontend to Netlify/Vercel
4. 🔄 Update frontend API URL
5. 🔄 Test end-to-end flow
6. 🔄 Set up monitoring (optional)
7. 🔄 Configure custom domain (optional)

---

## Useful Commands

```bash
# Local development
npm run dev                    # Start dev server with watch mode
npm run build                  # Build for production
npm run start                  # Run production build locally

# Prisma commands
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Create and run migrations (dev)
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed database with test data

# Database commands
npm run db:push                # Push schema without migrations
npm run db:reset               # Reset database (dev only)
```

---

## Support

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs

For issues specific to this project, check the logs and ensure all environment variables are correctly configured.
