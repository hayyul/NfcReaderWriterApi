# 🚀 Render Configuration - Ready to Deploy!

Your Neon database is set up and ready! Here's everything you need to deploy to Render.

---

## ✅ Neon Database Status

**Connection**: ✅ Verified
**Migrations**: ✅ Applied
**Seed Data**: ✅ Loaded

**Database Summary:**
- 2 Users (admin, controller)
- 2 Gas Stations (Makpetrol Aerodrom, OKTA Avtoput)
- 4 Pumps with RFID tags
- Expected child tags configured

---

## 🔐 Environment Variables for Render

Copy these EXACT values into your Render dashboard:

### Required Variables

| Variable Name | Value |
|--------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `HOST` | `0.0.0.0` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_be86ACEvaJlD@ep-raspy-butterfly-a4mb1kw8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `f359b5700ac4ea95770270adf67ee0a61ef6bc9017e14a1c8e0b66746be2bcb4aa8dcde71aed1954bb4377810debe5d9c06ca1d6cc08fecb73fea1c7171fd60a` |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | `*` |
| `RATE_LIMIT_MAX` | `100` |
| `RATE_LIMIT_TIMEWINDOW` | `60000` |

**Important Notes:**
- ⚠️ The `JWT_SECRET` above is **secure and production-ready**
- 🔒 Keep these credentials **private**
- 🌐 Change `CORS_ORIGIN` to your frontend domain when you deploy the frontend (e.g., `https://your-app.netlify.app`)

---

## 📋 Deploy to Render - Step by Step

### Step 1: Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Configure for Render deployment with Neon database"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to **[render.com](https://render.com)**
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your repository: `gas-station-api`
5. Render will detect `render.yaml` automatically
6. Click **"Apply"**

### Step 3: Add Environment Variables

In the Render dashboard:

1. Go to your newly created web service
2. Click **"Environment"** in the left sidebar
3. For each variable in the table above:
   - Click **"Add Environment Variable"**
   - Enter the **Key** (variable name)
   - Paste the **Value**
   - Click **"Save Changes"**

**Quick Copy for Each Variable:**

```bash
# Copy these one by one:

NODE_ENV
production

PORT
4000

HOST
0.0.0.0

DATABASE_URL
postgresql://neondb_owner:npg_be86ACEvaJlD@ep-raspy-butterfly-a4mb1kw8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET
f359b5700ac4ea95770270adf67ee0a61ef6bc9017e14a1c8e0b66746be2bcb4aa8dcde71aed1954bb4377810debe5d9c06ca1d6cc08fecb73fea1c7171fd60a

JWT_EXPIRES_IN
24h

CORS_ORIGIN
*

RATE_LIMIT_MAX
100

RATE_LIMIT_TIMEWINDOW
60000
```

### Step 4: Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait 3-5 minutes for the build to complete
3. Check the **Logs** tab for progress

---

## 🧪 Test Your Deployment

Once deployment is complete, you'll get a URL like:
```
https://gas-station-api.onrender.com
```

### Test the Health Endpoint

```bash
curl https://your-app.onrender.com/health
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

### Test Login with Seeded User

```bash
curl -X POST https://your-app.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

---

## 👥 Default Users (Already in Database)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `controller` | `controller123` | ADMIN |

⚠️ **Change these passwords in production!**

---

## 🔄 Both Environments Working

### Local Development (Unchanged)
```bash
# Your local setup still works exactly as before
npm run dev
# Uses Docker PostgreSQL at localhost:5434
# API: http://localhost:4000
```

### Production (Render + Neon)
```bash
# Automatically uses Neon database when deployed
# API: https://your-app.onrender.com
```

---

## 🎯 Next Steps After Deploy

1. ✅ Test all API endpoints
2. ✅ Update frontend to use production API URL
3. ✅ Change CORS_ORIGIN to your frontend domain
4. ✅ Change default user passwords
5. ✅ Set up custom domain (optional)

---

## 🆘 Troubleshooting

### Build Fails
**Check:** Render logs for specific error
**Solution:** Ensure all files are pushed to GitHub

### Database Connection Fails
**Check:** DATABASE_URL is exactly as shown above
**Solution:** Re-copy the DATABASE_URL including `?sslmode=require`

### 502 Bad Gateway
**Check:** Server logs in Render dashboard
**Solution:** Ensure PORT and HOST are set correctly

---

## 📞 Support

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Quick start: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs

---

**🎉 You're ready to deploy! Your database is live and waiting.**
