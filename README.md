# Navio

A full-stack collaborative trip planning platform for group travel coordination, featuring expense splitting, group polling, and shared itinerary management.

## Key Features

- **Group Management** — Create travel groups, invite members via email, manage roles (Owner, Admin, Member, Viewer)
- **Trip Planning** — Plan multiple trips per group with budgets, destinations, and date ranges
- **Expense Tracking** — Log shared expenses with smart splitting (equal, custom, percentage) and settlement calculations
- **Group Polling** — Vote on destinations, activities, and dates with configurable voting rules
- **Shared Itinerary** — Build collaborative timelines with accommodations, transport, activities, and meals
- **Real-Time Updates** — WebSocket integration for live collaboration (Socket.IO)

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | React framework with server components |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| Zustand | Client-side state management |
| TanStack React Query | Server state & caching |
| React Hook Form + Zod | Form handling & validation |
| Axios | HTTP client with interceptors |
| Framer Motion | Animations |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express.js | REST API server |
| TypeScript | Type safety |
| Prisma ORM | Database access & migrations |
| PostgreSQL | Primary database |
| Redis | Session management & rate limiting |
| JWT | Authentication (access + refresh tokens) |
| Socket.IO | Real-time communication |
| Zod | Request validation |
| Winston | Structured logging |

### DevOps & Testing
| Technology | Purpose |
|------------|---------|
| Docker + Docker Compose | Local development services |
| GitHub Actions | CI/CD pipeline |
| Playwright | End-to-end testing |
| Helmet.js | Security headers |

## Project Architecture

```
wanderlust/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router (pages & layouts)
│   │   ├── (auth)/              # Public routes (login, register)
│   │   └── (app)/               # Protected routes (dashboard, trips, groups)
│   ├── components/              # React components
│   │   ├── ui/                  # Atomic components (Button, Card, Input)
│   │   ├── patterns/            # Composed components (TripCard, PollWidget)
│   │   └── sections/            # Full-page sections
│   ├── lib/                     # Utilities & services
│   │   ├── api/                 # Axios client, services, React Query hooks
│   │   ├── stores/              # Zustand stores
│   │   └── schemas/             # Zod validation schemas
│   └── types/                   # TypeScript type definitions
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── config/              # Environment, database, Redis config
│   │   ├── middleware/          # Auth, rate limiting, error handling
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # JWT authentication
│   │   │   ├── groups/          # Group CRUD & membership
│   │   │   ├── trips/           # Trip management
│   │   │   ├── polls/           # Voting system
│   │   │   ├── expenses/        # Expense tracking & splitting
│   │   │   ├── itinerary/       # Trip timeline
│   │   │   └── invitations/     # Email invitations
│   │   └── common/              # Shared utilities (errors, JWT, logging)
│   └── prisma/                  # Database schema & migrations
│
├── tests/                       # Playwright E2E tests
└── docker/                      # Docker Compose configuration
```

### Database Schema (12 Models)
- **User, Session** — Authentication & session management
- **Group, GroupMember** — Travel groups with role-based access
- **Trip** — Trip details with budget tracking
- **Poll, PollOption, Vote** — Group decision-making
- **Expense, ExpenseSplit** — Financial tracking with settlement
- **ItineraryItem** — Trip timeline entries
- **Invitation** — Email-based group invitations
- **ActivityLog** — Audit trail

## Getting Started

### Prerequisites
- Node.js v18+
- Docker Desktop
- npm v8+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wanderlust.git
   cd wanderlust
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

3. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your JWT secrets (generate with: openssl rand -hex 32)
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

4. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api/v1
   - Health check: http://localhost:4000/health

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create user account |
| `/auth/login` | POST | Authenticate & get tokens |
| `/groups` | GET/POST | List/create groups |
| `/groups/:id/members` | GET/PATCH/DELETE | Manage membership |
| `/trips` | GET/POST | List/create trips |
| `/trips/:id/polls` | GET/POST | Trip polling |
| `/trips/:id/expenses` | GET/POST | Expense tracking |
| `/trips/:id/itinerary` | GET/POST | Trip timeline |
| `/invitations` | POST | Send group invitations |

## Skills Demonstrated

### Full-Stack Development
- Modern React patterns (Server Components, App Router, React Query)
- RESTful API design with Express.js
- Relational database modeling with Prisma ORM
- Type-safe development with TypeScript end-to-end

### Authentication & Security
- JWT implementation with access/refresh token rotation
- Role-based access control (RBAC)
- Rate limiting with Redis
- Security headers (Helmet.js)
- Input validation with Zod

### Software Architecture
- Modular backend architecture (routes → controllers → services)
- State management patterns (Zustand for client, React Query for server)
- Database transaction handling
- Error handling with custom error classes

### DevOps & Testing
- Docker containerization
- CI/CD with GitHub Actions
- E2E testing with Playwright
- Structured logging (Winston)

### Domain Complexity
- Financial calculations with decimal precision
- Expense splitting algorithms (equal, custom, percentage)
- Real-time collaboration (WebSocket)
- Multi-tenant data isolation (groups → trips → features)

## Future Improvements

- [ ] Add unit and integration tests for backend services
- [ ] Implement email delivery for invitations (currently stores tokens)
- [ ] Add mobile responsiveness and PWA support
- [ ] Integrate mapping APIs for itinerary visualization
- [ ] Add export functionality (PDF itineraries, expense reports)

## License

MIT
