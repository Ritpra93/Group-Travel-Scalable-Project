# Navio

A full-stack collaborative trip planning platform for group travel coordination, featuring real-time updates, expense splitting, group polling, shared itinerary management, and interest-based activity matching.

## Key Features

- **Group Management** — Create travel groups, invite members via email, manage roles (Owner, Admin, Member, Viewer)
- **Trip Planning** — Plan multiple trips per group with budgets, destinations, and date ranges
- **Expense Tracking** — Log shared expenses with smart splitting (equal, custom, percentage) and settlement calculations
- **Group Polling** — Vote on destinations, activities, and dates with configurable voting rules
- **Shared Itinerary** — Build collaborative timelines with accommodations, transport, activities, and meals
- **Real-Time Updates** — Live collaboration via WebSocket (Socket.IO) for polls, expenses, and itinerary changes
- **Interest Matching** — User interest profiles with group overlap detection for activity suggestions
- **Conflict Detection** — Optimistic locking prevents concurrent edit conflicts

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
| Socket.IO Client | Real-time event handling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express.js | REST API server |
| TypeScript | Type safety |
| Kysely | Type-safe SQL query builder |
| Prisma | Schema definition (migrations) |
| PostgreSQL | Primary database |
| Redis | Session management, rate limiting, token blacklist |
| JWT | Authentication (access + refresh tokens) |
| Socket.IO | Real-time WebSocket server |
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
│   │   └── (app)/               # Protected routes
│   │       ├── dashboard/       # User dashboard
│   │       ├── groups/          # Group management
│   │       ├── trips/           # Trip workspaces
│   │       └── profile/         # User profile & interests
│   ├── components/              # React components
│   │   ├── ui/                  # Atomic components (Button, Card, Input)
│   │   ├── patterns/            # Composed components (TripCard, InterestSelector)
│   │   └── sections/            # Full-page sections
│   ├── lib/                     # Utilities & services
│   │   ├── api/                 # Axios client, services, React Query hooks
│   │   ├── socket/              # Socket.IO client & hooks
│   │   ├── stores/              # Zustand stores
│   │   ├── schemas/             # Zod validation schemas
│   │   └── utils/               # Helpers (cn, api-errors)
│   └── types/                   # TypeScript type definitions
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── config/              # Environment, database, Redis config
│   │   ├── middleware/          # Auth, rate limiting, error handling
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # JWT authentication
│   │   │   ├── users/           # Profile & interest management
│   │   │   ├── groups/          # Group CRUD & membership
│   │   │   ├── trips/           # Trip management
│   │   │   ├── polls/           # Voting system
│   │   │   ├── expenses/        # Expense tracking & splitting
│   │   │   ├── itinerary/       # Trip timeline
│   │   │   └── invitations/     # Email invitations
│   │   ├── websocket/           # Socket.IO server & event emitters
│   │   └── common/              # Shared utilities (errors, JWT, logging)
│   └── prisma/                  # Database schema
│
├── tests/                       # Playwright E2E tests
└── docker/                      # Docker Compose configuration
```

### Database Schema (13 Models)
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
   git clone https://github.com/yourusername/Group-Travel-Scalable-Project.git
   cd Group-Travel-Scalable-Project
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

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create user account |
| `/auth/login` | POST | Authenticate & get tokens |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Invalidate tokens |
| `/auth/me` | GET | Get current user |

### Users & Profile
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/me` | GET/PUT | Get/update profile |
| `/users/me/interests` | PUT | Update interests |
| `/users/interests/categories` | GET | Get available interests |

### Groups
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/groups` | GET/POST | List/create groups |
| `/groups/:id` | GET/PATCH/DELETE | Group operations |
| `/groups/:id/members` | GET | List members |
| `/groups/:id/interests` | GET | Interest overlap analysis |

### Trips
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/trips` | GET/POST | List/create trips |
| `/trips/:id` | GET/PUT/DELETE | Trip operations |
| `/trips/:id/polls` | GET/POST | Polls for trip |
| `/trips/:id/expenses` | GET/POST | Expenses for trip |
| `/trips/:id/itinerary` | GET/POST | Itinerary items |

### Polls
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/polls/:id` | GET/PUT/DELETE | Poll operations |
| `/polls/:id/vote` | POST/PUT/DELETE | Voting |
| `/polls/:id/results` | GET | Vote counts |
| `/polls/:id/close` | PATCH | Close poll |

### Expenses
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/expenses/:id` | GET/PUT/DELETE | Expense operations |
| `/expenses/:id/splits/:splitId` | PATCH | Mark split paid |
| `/trips/:id/expenses/balances` | GET | User balances |
| `/trips/:id/expenses/settlements` | GET | Settlement suggestions |

## Real-Time Events

The application uses Socket.IO for live updates. Events are scoped to trip rooms:

| Event | Trigger | Data |
|-------|---------|------|
| `poll:created` | New poll created | Poll ID, title |
| `poll:voted` | Vote cast | Poll ID, option ID |
| `poll:closed` | Poll closed | Poll ID |
| `expense:created` | New expense | Expense ID, title, amount |
| `expense:updated` | Expense modified | Expense ID |
| `expense:deleted` | Expense removed | Expense ID |
| `itinerary:created` | New item | Item ID, title, type |
| `itinerary:updated` | Item modified | Item ID |
| `itinerary:deleted` | Item removed | Item ID |

## Skills Demonstrated

### Full-Stack Development
- Modern React patterns (Server Components, App Router, React Query)
- RESTful API design with Express.js
- Relational database modeling with type-safe queries
- Type-safe development with TypeScript end-to-end

### Authentication & Security
- JWT implementation with access/refresh token rotation
- Role-based access control (RBAC)
- Rate limiting with Redis
- Security headers (Helmet.js)
- Input validation with Zod

### Real-Time Collaboration
- WebSocket architecture with Socket.IO
- Room-based event broadcasting (trip rooms)
- Optimistic locking for conflict detection
- Cache invalidation on real-time events

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
- Interest overlap detection with similarity scoring
- Multi-tenant data isolation (groups → trips → features)

## Implementation Highlights

### Conflict Detection
The application implements optimistic locking to prevent lost updates:
- Client sends `clientUpdatedAt` timestamp when editing
- Server compares with current `updatedAt` before saving
- Returns 409 Conflict if another user modified the resource
- Frontend shows conflict UI with refresh option

### Interest Matching
Users can select from 40 predefined travel interests:
- Profile page with multi-select interest picker
- Group interest analysis shows overlap between members
- Jaccard-like similarity scoring for compatibility
- Top shared interests highlighted on group page

### Expense Splitting
Three splitting strategies with automatic balance calculation:
- **Equal**: Divide evenly among selected members
- **Custom**: Specify exact amounts per person
- **Percentage**: Allocate by percentage shares
- Settlement suggestions minimize number of transactions

## Known Limitations

- **Prisma P1010 Bug**: Using Kysely as query builder due to Prisma permission issue with PostgreSQL 14+
- **Email Delivery**: Invitations store tokens but don't send actual emails
- **Migrations**: Manual SQL migrations (not production-ready)

## Future Improvements

- [ ] Activity suggestions based on group interests (AI integration)
- [ ] Multi-currency support with exchange rate conversion
- [ ] Collaborative editing with real-time cursors
- [ ] Mobile responsiveness and PWA support
- [ ] Mapping APIs for itinerary visualization
- [ ] Export functionality (PDF itineraries, expense reports)

## License

MIT
