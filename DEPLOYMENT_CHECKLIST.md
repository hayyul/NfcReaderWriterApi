# 🚀 Deployment Checklist

Use this quick checklist to deploy your Gas Station API to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All code tested locally
- [ ] Environment variables configured
- [ ] Database migrations work locally
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Git repository is up to date

### ✅ Files to Verify
- [ ] `render.yaml` exists
- [ ] `.env.example` exists
- [ ] `prisma/migrations/` directory committed
- [ ] `package.json` has correct scripts
- [ ] `.gitignore` excludes `.env`

---

## 🗄️ Step 1: Set Up Neon Database (5 minutes)

### Create Account & Project
1. Go to **[neon.tech](https://neon.tech)**
2. Sign up / Log in
3. Click **"New Project"**
4. Name: `gas-station-rfid`
5. Region: Choose closest to your users

### Get Connection String
1. In project dashboard, click **"Connection Details"**
2. Copy the **connection string**:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. **Save it somewhere safe** (you'll need it for Render)

✅ **Done!** Database is ready.

---

## 🌐 Step 2: Deploy to Render (10 minutes)

### Push Code to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Create Render Service
1. Go to **[render.com](https://render.com)**
2. Sign up / Log in
3. Connect your GitHub account
4. Click **"New +"** → **"Blueprint"**
5. Select your repository
6. Render detects `render.yaml` automatically
7. Click **"Apply"**

### Configure Environment Variables

In Render dashboard, go to **Environment** tab:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | From Neon dashboard |
| `JWT_SECRET` | Random string | Generate below ⬇️ |
| `CORS_ORIGIN` | `*` or your frontend URL | Your frontend domain |

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` value.

### Save & Deploy
1. Click **"Save Changes"**
2. Render automatically starts deployment
3. Wait 3-5 minutes for build to complete

✅ **Done!** API is deployed.

---

## 🧪 Step 3: Test Deployment (2 minutes)

### Get Your URL
After deployment completes:
- You'll see: `https://your-app.onrender.com`

### Test Endpoints

```bash
# Health check
curl https://your-app.onrender.com/health

# API info
curl https://your-app.onrender.com/api/v1
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "version": "1.0.0",
  "database": "connected"
}
```

✅ **Success!** API is working.

---

## 🌱 Step 4: Seed Production Database (Optional)

### Option A: Via Render Shell
1. In Render dashboard → Your service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run prisma:seed
   ```

### Option B: Via API
Use Postman/Insomnia to:
1. Create admin user via registration endpoint
2. Add stations via `/api/v1/stations`
3. Add pumps via `/api/v1/pumps`

✅ **Done!** Database has data.

---

## 🎯 Step 5: Update Frontend (5 minutes)

Update your frontend API base URL:

### React Native (Expo)
```javascript
// In your API config file
const API_BASE_URL = __DEV__
  ? "http://localhost:4000/api/v1"
  : "https://your-app.onrender.com/api/v1";
```

### Environment Variables
```env
# .env.production
REACT_APP_API_URL=https://your-app.onrender.com/api/v1

# .env.development
REACT_APP_API_URL=http://localhost:4000/api/v1
```

✅ **Done!** Frontend connected to production API.

---

## 🔒 Step 6: Security Review (3 minutes)

- [ ] `JWT_SECRET` is strong and unique (64+ characters)
- [ ] `CORS_ORIGIN` is set to your frontend domain (not `*`)
- [ ] `.env` is in `.gitignore` (never committed)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] All secrets are in Render environment variables (not hardcoded)

✅ **Done!** Production is secure.

---

## 🎉 Deployment Complete!

Your Gas Station API is now live at:
```
https://your-app.onrender.com
```

### Next Steps
- [ ] Test all API endpoints
- [ ] Monitor Render logs for errors
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/alerts (optional)

---

## 🆘 Common Issues

### Build Fails
**Problem**: TypeScript errors
**Solution**: Run `npm run build` locally first

**Problem**: Prisma migration fails
**Solution**: Check `DATABASE_URL` has `?sslmode=require`

### Runtime Errors
**Problem**: Database connection failed
**Solution**: Verify `DATABASE_URL` in Render environment variables

**Problem**: 502 Bad Gateway
**Solution**: Check Render logs, ensure server starts correctly

### CORS Errors
**Problem**: Frontend can't connect
**Solution**: Update `CORS_ORIGIN` to your frontend URL

---

## 📞 Support

- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs

---

**Total Time**: ~25 minutes

**Cost**: $0/month (Free tier)

**Result**: Production-ready API 🚀
