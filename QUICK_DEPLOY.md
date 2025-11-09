# ⚡ Quick Deploy Guide (5 Minutes)

Deploy your Gas Station API in 5 minutes or less!

---

## 1️⃣ Neon Database (2 min)

1. **[neon.tech](https://neon.tech)** → Sign up → New Project
2. Copy connection string:
   ```
   postgresql://user:pass@...neon.tech/db?sslmode=require
   ```

---

## 2️⃣ Push to GitHub (1 min)

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

---

## 3️⃣ Render Deploy (2 min)

1. **[render.com](https://render.com)** → New → Blueprint
2. Select your repo
3. Add environment variables:
   - `DATABASE_URL`: (paste Neon URL)
   - `JWT_SECRET`: (generate with command below)

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. Click **"Create"**

---

## ✅ Done!

Your API: `https://your-app.onrender.com`

Test it:
```bash
curl https://your-app.onrender.com/health
```

---

Need details? See **[DEPLOYMENT.md](./DEPLOYMENT.md)**
