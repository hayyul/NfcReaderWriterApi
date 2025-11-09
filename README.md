# Gas Station RFID API

Backend API for Gas Station RFID Control System built with **Node.js**, **TypeScript**, **Fastify**, and **PostgreSQL**.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Prerequisites

- Node.js 20+ installed
- npm or yarn
- Neon database account (free tier available)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Neon database connection string:

```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL from Neon
```

Get your connection string from [Neon Console](https://console.neon.tech).

### 3. Set Up Database (First Time Only)

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations (creates tables)
npx prisma migrate deploy

# Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be running at: **http://localhost:4000**

**Note:** This setup uses Neon PostgreSQL for both local development and production. No Docker required! 🎉

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run prisma:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (WARNING: deletes all data) |

## Database Schema

### Tables

1. **users** - User accounts with roles
2. **gas_stations** - Gas station locations
3. **pumps** - Individual pumps at stations
4. **expected_child_tags** - RFID tags that should be in each pump
5. **verification_sessions** - Records of verification checks
6. **scanned_child_tags** - Details of scanned tags
7. **auth_tokens** - JWT token management

### Relationships

```
gas_stations (1) ----< (N) pumps
pumps (1) ----< (N) expected_child_tags
pumps (1) ----< (N) verification_sessions
verification_sessions (1) ----< (N) scanned_child_tags
users (1) ----< (N) verification_sessions
users (1) ----< (N) auth_tokens
```

## Default Users

After seeding, you can login with:

```
Username: admin
Password: admin123
Role: ADMIN

Username: controller
Password: controller123
Role: ADMIN
```

## Sample Data

The seed creates:
- 2 Gas Stations (Makpetrol Aerodrom, OKTA Avtoput)
- 4 Pumps with main RFID tags
- Expected child tags for each pump

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout

### Gas Stations
- `GET /api/v1/stations` - List all stations
- `GET /api/v1/stations/:id` - Get station details
- `POST /api/v1/stations` - Create station (admin)
- `PUT /api/v1/stations/:id` - Update station (admin)
- `DELETE /api/v1/stations/:id` - Delete station (admin)

### Pumps
- `GET /api/v1/stations/:stationId/pumps` - List pumps
- `GET /api/v1/pumps/:id` - Get pump details
- `POST /api/v1/stations/:stationId/pumps` - Create pump (admin)
- `PUT /api/v1/pumps/:id` - Update pump (admin)
- `DELETE /api/v1/pumps/:id` - Delete pump (admin)

### RFID Verification
- `POST /api/v1/pumps/:id/verify` - Verify RFID tags
- `GET /api/v1/pumps/:id/verifications` - Get verification history
- `GET /api/v1/verifications/:sessionId` - Get session details

## Prisma Studio

To view and manage your database with a GUI:

```bash
npm run prisma:studio
```

Opens at: **http://localhost:5555**

## Environment Variables

Your `.env` file (same for local and production):

```env
# Server
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# JWT (generate secure secret)
JWT_SECRET=your-secure-secret-minimum-64-characters
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

See `.env.example` for all available options.

## Project Structure

```
gas-station-api/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── src/
│   ├── routes/             # API routes
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic
│   ├── middleware/         # Auth, validation, etc.
│   ├── types/              # TypeScript types
│   ├── utils/              # Helper functions
│   └── server.ts           # Main server file
├── docker-compose.yml      # PostgreSQL container
├── package.json
└── tsconfig.json
```

## Development Workflow

1. Make changes to code
2. Server auto-restarts (tsx watch)
3. Test with Postman/Insomnia/curl
4. Check database with Prisma Studio
5. Commit changes

## Troubleshooting

### Database connection slow on first request
Neon free tier auto-suspends after inactivity. First request takes 1-2 seconds to wake up. Subsequent requests are instant.

### Database connection error
```bash
# Verify your DATABASE_URL in .env is correct
# Make sure it includes ?sslmode=require
# Check Neon dashboard to ensure database is active
```

### Prisma Client not generated
```bash
npm run prisma:generate
```

### Need to reset database
```bash
# WARNING: This deletes all data
npm run db:reset
npm run prisma:seed
```

## Deployment

Ready to deploy to production? See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete instructions on deploying to:

- **Database**: Neon (Serverless PostgreSQL)
- **Backend**: Render (Free tier available)

Quick deployment checklist:
- ✅ Push code to GitHub
- ✅ Create Neon database
- ✅ Deploy to Render with one click
- ✅ Configure environment variables
- ✅ Database migrations run automatically

## Documentation

- **[SINGLE_DATABASE_SETUP.md](./SINGLE_DATABASE_SETUP.md)** - Database configuration (Neon)
- **[RENDER_CONFIG.md](./RENDER_CONFIG.md)** - Deploy to Render (start here!)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[API_TESTING.md](./API_TESTING.md)** - API testing guide
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Frontend integration

## Next Steps

1. ✅ Database and Prisma setup
2. ✅ Implement Fastify server
3. ✅ Create API routes and controllers
4. ✅ Add authentication middleware
5. ✅ Add validation with Zod
6. 🔄 Deploy to production
7. 🔄 Connect with React Native app

## License

MIT
