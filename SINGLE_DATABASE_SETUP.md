# 🗄️ Single Database Setup (Neon for Local & Production)

Your project is configured to use **one Neon database** for both local development and production deployment. This simplifies your workflow significantly!

---

## ✅ Benefits of Single Database Setup

- **No Docker Required** - No need to run PostgreSQL locally
- **Same Data Everywhere** - Work with real production-like data locally
- **Simplified Setup** - One database to manage
- **Team Collaboration** - Everyone works with the same database
- **Always Available** - Neon is always online
- **Free Tier** - 0.5 GB storage, perfect for development

---

## 🚀 Current Configuration

### Database: Neon PostgreSQL

```
Host: ep-raspy-butterfly-a4mb1kw8-pooler.us-east-1.aws.neon.tech
Database: neondb
User: neondb_owner
Region: us-east-1 (AWS)
```

### Your Environment

**Local Development:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_be86ACEvaJlD@ep-raspy-butterfly-a4mb1kw8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Production (Render):**
```env
DATABASE_URL=postgresql://neondb_owner:npg_be86ACEvaJlD@ep-raspy-butterfly-a4mb1kw8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Same database, same connection string!** 🎯

---

## 📊 Current Database Contents

Your Neon database already has:

| Table | Count | Description |
|-------|-------|-------------|
| **users** | 2 | admin, controller |
| **gas_stations** | 2 | Makpetrol Aerodrom, OKTA Avtoput |
| **pumps** | 4 | With RFID tags |
| **expected_child_tags** | ~12 | Expected RFID child tags |

---

## 🛠️ Local Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

That's it! No Docker, no local PostgreSQL needed.

### 2. Make Database Changes

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# This will:
# 1. Update your local Prisma schema
# 2. Generate SQL migration
# 3. Apply it to Neon database
# 4. Regenerate Prisma Client
```

### 3. View Database

```bash
# Open Prisma Studio
npm run prisma:studio

# Opens at: http://localhost:5555
# Visual interface to view/edit data
```

**Or** use Neon's SQL Editor:
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Run queries directly

---

## 🚀 Deploy to Production

Since you're using the same database, deployment is even simpler:

### Step 1: Push Code

```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### Step 2: Deploy to Render

1. Go to https://render.com
2. New → Blueprint → Select your repo
3. Add environment variables (same DATABASE_URL!)
4. Deploy

Your production app will use the **same Neon database** you use locally.

---

## ⚠️ Important Considerations

### Data Safety

Since local and production use the same database:

✅ **Good for:**
- Small projects / MVPs
- Solo development
- Team prototypes
- Testing with real data

⚠️ **Consider separate databases when:**
- You have many developers
- You need to test destructive operations
- You have sensitive production data
- Your app is live with real users

### Creating Separate Databases (Optional)

If you need separate databases later:

**Option 1: Create a Second Neon Database**
1. In Neon dashboard → Create new project
2. Name it "gas-station-dev" or "gas-station-prod"
3. Update `.env` for local (dev database)
4. Update Render env vars for production (prod database)

**Option 2: Use Neon Branches** (Recommended)
```bash
# Create a development branch
npx neon branches create dev

# Use branch for local development
DATABASE_URL=postgresql://...@dev-branch.neon.tech/...
```

---

## 🔄 Database Operations

### Reset Database (Careful!)

```bash
# This will DELETE ALL DATA and re-run migrations
npm run db:reset

# Then re-seed
npm run prisma:seed
```

⚠️ **Warning:** This affects your database immediately. Use with caution!

### Add Seed Data

```bash
npm run prisma:seed
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Push Schema Changes (No Migration)

```bash
# Useful for quick prototyping
npm run db:push
```

---

## 🎯 Team Collaboration

When working with a team using the same database:

### Best Practices

1. **Communicate Changes**
   - Tell team before running migrations
   - Migrations affect everyone immediately

2. **Commit Migrations**
   ```bash
   git add prisma/migrations/
   git commit -m "Add user roles migration"
   git push
   ```

3. **Pull and Apply Migrations**
   ```bash
   git pull
   npx prisma migrate deploy
   ```

4. **Don't Delete Production Data**
   - Be careful with db:reset
   - Test destructive operations locally first

---

## 🔐 Security Notes

### Current Setup

Your `.env` file contains:
- ✅ Neon database credentials
- ✅ JWT secret (same for local and production)

**File is in .gitignore** - won't be committed.

### For Production

When deploying, you'll use:
- Same DATABASE_URL (Neon)
- Same JWT_SECRET (so tokens work everywhere)
- Different CORS_ORIGIN (your frontend URL)

---

## 💡 Tips & Tricks

### 1. Quick Database Inspection

```bash
# Count records in all tables
npx prisma db execute --stdin <<< "
  SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM gas_stations) as stations,
    (SELECT COUNT(*) FROM pumps) as pumps;
"
```

### 2. Backup Your Data

Neon provides automatic backups, but you can also:

```bash
# Export schema and data
npx prisma db pull
npx prisma db seed
```

### 3. Monitor Database Usage

Check your Neon dashboard for:
- Storage usage
- Query performance
- Connection stats

Free tier limits:
- 0.5 GB storage
- 3 GB data transfer/month
- Compute hours (generous)

---

## 🆘 Troubleshooting

### "Connection timed out"

Neon free tier auto-suspends after inactivity.
- First request takes 1-2 seconds to wake
- Subsequent requests are fast
- Upgrade to paid tier for instant wake

### "Too many connections"

Using the pooler URL (you are!):
- Handles connection pooling automatically
- Supports many concurrent connections
- No action needed

### "Migration conflicts"

If team members create migrations simultaneously:
```bash
# Reset local migrations
rm -rf prisma/migrations
# Pull latest from git
git pull
# Create your migration again
npx prisma migrate dev
```

---

## 📊 Monitoring

### Check Database Health

**Neon Dashboard:**
https://console.neon.tech
- Storage usage
- Query statistics
- Connection metrics

**Your API Health Check:**
```bash
curl http://localhost:4000/health
```

**Prisma Studio:**
```bash
npm run prisma:studio
# http://localhost:5555
```

---

## 🎉 Summary

You're now running with:

- ✅ **One Neon database** for everything
- ✅ **No Docker** needed
- ✅ **Same data** in local and production
- ✅ **Simplified workflow**
- ✅ **Already seeded and ready**

**Start developing:**
```bash
npm run dev
# Server runs at: http://localhost:4000
# Database: Neon PostgreSQL (already connected)
```

**Deploy to production:**
- Push to GitHub
- Deploy to Render (same DATABASE_URL)
- Done! 🚀

---

## 📞 Need Help?

- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
- Your setup: See RENDER_CONFIG.md for deployment details
