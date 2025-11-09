# Gas Station RFID API - Setup Guide

Complete step-by-step guide to get your backend running locally.

## Prerequisites Check

Before starting, make sure you have:

- ✅ Node.js 20+ installed (`node --version`)
- ✅ Docker Desktop installed and running
- ✅ npm installed (`npm --version`)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd /Users/hayyulshabani/Projects/gas-station-api
npm install
```

**What this does**: Installs all required packages (Fastify, Prisma, bcrypt, etc.)

---

### Step 2: Start PostgreSQL Database

```bash
# Start Docker PostgreSQL container
docker-compose up -d

# Verify it's running
docker ps
```

**Expected output**:
```
CONTAINER ID   IMAGE                  STATUS        PORTS
xxxxx          postgres:15-alpine     Up 5 seconds  0.0.0.0:5434->5432/tcp
```

**Troubleshooting**:
- If port 5432/5433 is in use: The docker-compose.yml uses port 5434 to avoid conflicts with local PostgreSQL
- If Docker not running: Open Docker Desktop app

---

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

**What this does**: Creates TypeScript types from your database schema

**Expected output**:
```
✔ Generated Prisma Client
```

---

### Step 4: Run Database Migrations

```bash
npm run prisma:migrate
```

**What this does**: Creates all database tables (users, gas_stations, pumps, etc.)

**Expected output**:
```
Your database is now in sync with your schema.
```

---

### Step 5: Seed Database with Sample Data

```bash
npm run prisma:seed
```

**What this does**: Creates sample users, stations, and pumps

**Expected output**:
```
🌱 Starting database seed...
👤 Creating users...
✅ Created users: admin, controller
⛽ Creating gas stations...
✅ Created stations: Makpetrol Aerodrom, OKTA Avtoput
⛽ Creating pumps...
✅ Created 4 pumps with expected child tags
🎉 Database seed completed successfully!
```

---

### Step 6: Start Development Server

```bash
npm run dev
```

**Expected output**:
```
🚀 Gas Station RFID API Server Started!
📍 Server running at: http://0.0.0.0:3000
🏥 Health check: http://0.0.0.0:3000/health
📚 API v1: http://0.0.0.0:3000/api/v1
🌍 Environment: development
```

---

## Verify Setup

### 1. Test Health Endpoint

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Check API Info

```bash
curl http://localhost:3000/api/v1
```

**Expected response**:
```json
{
  "message": "Gas Station RFID API v1",
  "endpoints": {
    "auth": "/api/v1/auth",
    "stations": "/api/v1/stations",
    "pumps": "/api/v1/pumps",
    "verifications": "/api/v1/verifications"
  }
}
```

### 3. Open Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

Opens at: **http://localhost:5555**

You should see:
- 2 users (admin, controller)
- 2 gas stations
- 4 pumps
- Expected child tags for each pump

---

## Common Commands

```bash
# Development
npm run dev              # Start with hot reload

# Database Management
npm run prisma:studio    # Open database GUI
npm run db:reset         # Reset database (⚠️ deletes data)
npm run prisma:migrate   # Run new migrations

# View logs
docker-compose logs -f   # Database logs
```

---

## Next Steps

Now that your backend is running, you can:

1. ✅ Test endpoints with Postman/Insomnia
2. ✅ View data in Prisma Studio
3. ⏳ Implement API routes (auth, stations, pumps)
4. ⏳ Connect React Native app

---

## Folder Structure

```
gas-station-api/
├── src/
│   └── server.ts          # ✅ Basic server running
│   ├── routes/            # ⏳ TODO: API routes
│   ├── controllers/       # ⏳ TODO: Controllers
│   ├── services/          # ⏳ TODO: Business logic
│   ├── middleware/        # ⏳ TODO: Auth, validation
│   └── utils/             # ⏳ TODO: Helpers
├── prisma/
│   ├── schema.prisma      # ✅ Database schema
│   └── seed.ts            # ✅ Sample data
├── docker-compose.yml     # ✅ PostgreSQL setup
├── .env                   # ✅ Configuration
└── package.json           # ✅ Dependencies
```

---

## Troubleshooting

### Database connection error

```bash
# Check if PostgreSQL is running
docker ps

# Restart container
docker-compose restart

# Check logs
docker-compose logs postgres
```

### Port already in use

```bash
# Change PORT in .env file
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client errors

```bash
# Regenerate client
npm run prisma:generate

# Reset database
npm run db:reset
```

---

## Success Checklist

- ✅ Dependencies installed
- ✅ PostgreSQL running in Docker
- ✅ Database migrated
- ✅ Sample data seeded
- ✅ Server running at http://localhost:3000
- ✅ Health check returns `{"status":"healthy"}`
- ✅ Prisma Studio accessible at http://localhost:5555

**You're ready to build the API! 🎉**

---

## Need Help?

1. Check logs: `docker-compose logs` or server console
2. Verify .env configuration
3. Ensure Docker is running
4. Make sure ports 3000 and 5432 are free

Happy coding! 🚀
