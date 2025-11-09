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
- Docker & Docker Compose installed
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Check if it's running
docker ps
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be running at: **http://localhost:3000**

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

Copy `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5434/gasstation

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:8081
```

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

### Port 5432 already in use
```bash
# The docker-compose.yml is configured to use port 5434 to avoid conflicts
# Make sure your DATABASE_URL in .env uses port 5434
# If you need to use port 5432, stop local PostgreSQL: brew services stop postgresql
```

### Database connection error
```bash
# Check if Docker container is running
docker ps

# Restart container
docker-compose restart
```

### Prisma Client not generated
```bash
npm run prisma:generate
```

## Next Steps

1. ✅ Database and Prisma setup
2. ⏳ Implement Fastify server
3. ⏳ Create API routes and controllers
4. ⏳ Add authentication middleware
5. ⏳ Add validation with Zod
6. ⏳ Connect with React Native app

## License

MIT
# NfcReaderWriterApi
