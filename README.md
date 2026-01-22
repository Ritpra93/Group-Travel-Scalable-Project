# Group-Travel-Scalable-Project

# Group Trip Collaboration Hub - MVP

A production-ready collaborative trip planning platform with expense tracking, polling, and itinerary management.

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: TailwindCSS + shadcn/ui
- **State**: Zustand
- **Forms**: React Hook Form + Zod

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (configured)
- **Monitoring**: Winston (logs) + Prometheus (metrics)

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ (you have v23.5.0 ✅)
- **Docker**: Docker Desktop
- **npm**: v8+

### 1. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker/docker-compose.yml up -d

# Verify services are running
docker ps
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies (already done if you followed along)
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

Backend will be available at: **http://localhost:4000**

### 3. Frontend Setup

```bash
cd frontend

# Install additional dependencies we'll need
npm install zustand axios socket.io-client react-hook-form @hookform/resolvers zod date-fns

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## 📁 Project Structure

```
trip-hub/
├── backend/                 # Express + TypeScript API
│   ├── prisma/
│   │   └── schema.prisma    # Database schema (✅ Created)
│   ├── src/
│   │   ├── config/          # Configuration (env, database, redis)
│   │   ├── middleware/      # Express middleware
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── users/
│   │   │   ├── groups/
│   │   │   ├── trips/
│   │   │   ├── expenses/    # 💰 Priority feature
│   │   │   ├── polls/
│   │   │   ├── itinerary/
│   │   │   └── invitations/
│   │   ├── common/          # Shared utilities
│   │   ├── websocket/       # Socket.IO handlers
│   │   ├── jobs/            # Background jobs
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── .env.local           # Environment variables (✅ Created)
│   └── package.json         # Dependencies (✅ Created)
│
├── frontend/                # Next.js 14 App Router (✅ Initialized)
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities, hooks, stores
│   └── public/              # Static assets
│
├── docker/                  # Docker configuration
│   └── docker-compose.yml   # Local dev services (✅ Created)
│
└── scripts/                 # Utility scripts
```

## ✅ What's Been Created

### Infrastructure
1. ✅ Backend package.json with all dependencies installed
2. ✅ TypeScript configuration (strict mode enabled)
3. ✅ Prisma schema with complete domain model:
   - Users, Groups, GroupMembers
   - Trips, Polls, Votes, PollOptions
   - **Expenses, ExpenseSplits** (priority feature)
   - ItineraryItems, Invitations, ActivityLogs, Sessions
4. ✅ Docker Compose for PostgreSQL + Redis
5. ✅ Environment variables (.env.example, .env.local)
6. ✅ Next.js 14 frontend initialized with TypeScript
7. ✅ Comprehensive .gitignore files

### Backend Core (Day 1-2 ✅ COMPLETE)
8. ✅ Environment configuration with Zod validation
9. ✅ Database connection with Prisma client (singleton pattern)
10. ✅ Redis client with helper functions (caching, connection management)
11. ✅ Winston logger with structured logging
12. ✅ **Complete Authentication Module**:
    - User registration with password strength validation
    - Login with bcrypt password verification
    - JWT token generation (access + refresh)
    - Token refresh endpoint
    - Logout with token blacklisting
    - Session management in database
13. ✅ **Middleware Stack**:
    - Error handling (comprehensive error types)
    - Authentication middleware (JWT verification)
    - Rate limiting (auth: 5/15min, API: 100/15min)
    - Request logging with unique IDs
    - Async handler wrapper
14. ✅ Express app setup with security (Helmet, CORS, compression)
15. ✅ Server with graceful shutdown handling
16. ✅ Health check endpoints (/health, /health/ready)
17. ✅ Prisma client generated

## 📋 Next Steps

### ⚠️ IMMEDIATE: Start Docker Services
```bash
# Open Docker Desktop, then run:
docker-compose -f docker/docker-compose.yml up -d

# Verify services are running
docker ps

# Run database migrations
cd backend
npx prisma migrate dev --name init
```

### Day 1-2: Authentication & Core Setup ✅ COMPLETE
- [x] Create environment configuration with Zod validation
- [x] Set up database connection (Prisma client)
- [x] Set up Redis client
- [x] Create Winston logger
- [x] Implement authentication module (register, login, JWT)
- [x] Create auth middleware
- [x] Add error handling middleware
- [x] Set up rate limiting
- [x] Create Express app with security
- [x] Implement graceful shutdown
- [x] Add health check endpoints

### Day 3-4: Groups & Invitations
- [ ] Groups CRUD
- [ ] Group membership management
- [ ] Invitation system with email
- [ ] Frontend: Dashboard, Groups UI

### Day 6-7: Trips & Expenses (PRIORITY)
- [ ] Trips CRUD
- [ ] **Expense tracking with smart splitting**
- [ ] Settlement calculation algorithm
- [ ] Frontend: Expense UI with split calculator

### Day 8-9: Polls & Itinerary
- [ ] Polls with voting
- [ ] Itinerary timeline

### Day 11-12: Real-Time
- [ ] Socket.IO integration
- [ ] Live updates for polls, expenses

### Day 13-15: Polish & Deploy
- [ ] Common interests feature
- [ ] UI/UX improvements
- [ ] Testing
- [ ] Documentation

## 🔧 Development Commands

### Backend
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run db:migrate:dev   # Create and apply migration
npm run db:studio        # Open Prisma Studio GUI
npm run test             # Run tests
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
```

### Docker
```bash
docker-compose -f docker/docker-compose.yml up -d       # Start services
docker-compose -f docker/docker-compose.yml down        # Stop services
docker-compose -f docker/docker-compose.yml logs -f     # View logs
```

## 🗄️ Database Management

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio
```

## 🔐 Environment Variables & Security Setup

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Generate secure JWT secrets:
   ```bash
   openssl rand -hex 32  # Copy output for JWT_SECRET
   openssl rand -hex 32  # Copy output for JWT_REFRESH_SECRET
   ```

4. Edit `backend/.env` and replace the JWT secret placeholders with generated values

5. (Optional) Add Figma personal access token if using design system integration:
   - Obtain from: https://www.figma.com/developers/api#access-tokens
   - Add to `backend/.env` as `FIGMA_ACCESS_TOKEN=your_token`

### Frontend Configuration

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### Environment Variables Reference

Backend (`.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for access tokens (generate with openssl)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (generate with openssl)
- `PORT`: Backend port (default: 4000)
- `FRONTEND_URL`: Frontend URL for CORS
- `FIGMA_ACCESS_TOKEN`: (Optional) Figma API token for design integration

⚠️ **Important Security Notes:**
- Never commit `.env` files to version control
- Generate unique secrets for each environment (dev, staging, prod)
- Use your hosting platform's environment variables for production
- See [SECURITY.md](SECURITY.md) for detailed security practices

## 📊 API Documentation

Once the backend is running, interactive API documentation will be available at:
**http://localhost:4000/api-docs** (Swagger UI)

## 🎯 Core Features (MVP)

1. ✅ **User Authentication** - JWT-based with refresh tokens
2. ✅ **Group Management** - Create groups, invite members
3. ✅ **Trip Planning** - Multiple trips per group
4. 💰 **Expense Tracking** - Smart splitting (equal/custom), settlement calculation
5. ✅ **Polling System** - Vote on places, activities, dates
6. ✅ **Shared Itinerary** - Time-based event scheduling
7. ✅ **Common Interests** - Activity suggestions based on overlap

## 🔒 Security Features

- bcrypt password hashing (cost factor 12)
- JWT with short expiry (15min access, 7d refresh)
- Rate limiting (5 req/15min for auth, 100 req/15min for API)
- CORS protection
- Helmet.js security headers
- SQL injection safe (Prisma parameterized queries)
- Input validation (Zod)

## 📈 Performance Features

- Database connection pooling
- Redis caching for expensive calculations
- Response compression (gzip)
- N+1 query prevention
- Strategic database indexes

## 🚢 Deployment Ready

- Docker multi-stage builds
- Health check endpoints
- Graceful shutdown handling
- Structured logging
- Prometheus metrics endpoint
- CI/CD pipeline (GitHub Actions)

## 📝 License

MIT

## 👥 Contributing

This is an MVP project following enterprise-grade standards. See the implementation plan in `/.claude/plans/` for detailed roadmap.

---

## 📍 Current Status

**✅ Day 1-2 Complete**: Full authentication system with JWT, complete middleware stack, security features

**📂 Backend Files Created** (25+ files):
- [config/](backend/src/config/) env.ts, database.ts, redis.ts
- [common/utils/](backend/src/common/utils/) logger.ts, errors.ts, jwt.ts, password.ts
- [common/types/](backend/src/common/types/) api.ts, express.d.ts
- [modules/auth/](backend/src/modules/auth/) auth.service.ts, auth.controller.ts, auth.routes.ts, auth.types.ts
- [middleware/](backend/src/middleware/) auth.middleware.ts, errorHandler.middleware.ts, rateLimit.middleware.ts, requestLogger.middleware.ts, asyncHandler.middleware.ts
- [app.ts](backend/src/app.ts), [server.ts](backend/src/server.ts)

**⚠️ Next Step**: Start Docker Desktop → Run migrations → Test API endpoints → Begin Day 3-4 (Groups & Invitations)

**🧪 Ready to Test**:
```bash
# After starting Docker and running migrations:
npm run dev

# Test registration:
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Test health check:
curl http://localhost:4000/health
```
