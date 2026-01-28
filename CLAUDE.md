# Claude Code Guide - Wanderlust

This file serves as the authoritative build reference for AI assistants and developers working on this codebase.

---

## 1. Project Intent & Product Philosophy

**Wanderlust** is a collaborative trip planning platform for group travel coordination.

### Core Product Principles
1. **Groups are the organizational unit** - All features flow from group membership
2. **Decisions happen democratically** - Polling enables consensus building
3. **Money should be transparent** - Expense splitting removes financial friction
4. **Itineraries are living documents** - Collaborative planning in real-time
5. **Real-time collaboration is first-class** - Users see live updates from group members

### Design Philosophy for Development
- Backend-first implementation - APIs must be complete before frontend integration
- Type contracts before code - Define Zod schemas and TypeScript types first
- Progressive enhancement - Display data first, add interactivity second
- No mock data in production paths - Mock data is only for component development

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | Next.js (App Router) | 16.1.1 | React 19, Tailwind CSS 4 |
| State | React Query + Zustand | 5.x | Server state + client state |
| Backend | Express.js | 4.18 | TypeScript, Zod validation |
| Database | PostgreSQL | 14+ | Via Docker (port 5433) |
| ORM | **Kysely** | 0.28 | ⚠️ Workaround for Prisma P1010 bug |
| Schema | Prisma | 6.8 | Schema source of truth only |
| Caching | Redis | - | Sessions, rate limiting, token blacklist |
| Auth | JWT | - | Access (15min) + Refresh (7d) tokens |
| Testing | Playwright | - | E2E tests only |

### Critical: Prisma/Kysely Split

**Problem**: Prisma Client throws P1010 permission error with PostgreSQL 14+ (known Prisma bug).

**Current Workaround**:
- Schema defined in `backend/prisma/schema.prisma` (13 models)
- All queries use Kysely (`backend/src/config/kysely.ts`)
- Types manually synced in `backend/src/config/database.types.ts`

**Impact on Development**:
1. Schema changes require updating BOTH `schema.prisma` AND `database.types.ts`
2. Manual SQL migrations (not production-ready)
3. Document: `backend/docs/CRITICAL_CHANGES.md`

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js App Router + React Query + Zustand                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ (auth)      │  │ (app)       │  │ components/ │         │
│  │ login       │  │ dashboard   │  │ ui/         │         │
│  │ register    │  │ trips       │  │ patterns/   │         │
│  │             │  │ groups      │  │ sections/   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (Axios)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  Express.js + JWT Auth + Kysely                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /api/v1                                              │   │
│  │ ├── /auth (register, login, refresh, logout)        │   │
│  │ ├── /groups (CRUD, members, roles)                  │   │
│  │ ├── /trips (CRUD, status)                           │   │
│  │ ├── /polls (CRUD, vote, results)                    │   │
│  │ ├── /expenses (CRUD, splits, balances, settlements) │   │
│  │ ├── /trips/:tripId/itinerary (CRUD)                 │   │
│  │ └── /invitations (send, respond, resend)            │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Kysely (SQL)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL + Redis                       │
│  13 models: User, Session, Group, GroupMember, Trip,        │
│  Poll, PollOption, Vote, Expense, ExpenseSplit,             │
│  ItineraryItem, Invitation, ActivityLog                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. MVP Coverage Matrix

### Implementation Status

| MVP Feature | Backend | Frontend | Status |
|-------------|---------|----------|--------|
| **Group & Trip Management** |
| Group creation & invitations | ✅ Complete | ✅ Complete | ✅ Implemented |
| Role-based permissions (OWNER/ADMIN/MEMBER/VIEWER) | ✅ Complete | ✅ Complete | ✅ Implemented |
| Dedicated trip workspaces | ✅ Complete | ✅ Complete | ✅ Implemented |
| **Decision Support via Polling** |
| Create polls (destinations, activities, dates) | ✅ 11 endpoints | ✅ Complete | ✅ Implemented |
| Asynchronous voting | ✅ Complete | ✅ Complete | ✅ Implemented |
| Real-time consensus visibility | 🔴 Not started | 🔴 Not started | 🔴 Missing |
| **Shared Itinerary** |
| Time-based itinerary items | ✅ 5 endpoints | ✅ Complete | ✅ Implemented |
| Collaborative editing | 🔴 Not started | 🔴 Not started | 🔴 Missing |
| Conflict-aware updates | 🔴 Not started | 🔴 Not started | 🔴 Missing |
| **Budgeting & Cost Splitting** |
| Shared expense tracking | ✅ Complete | ✅ Complete | ✅ Implemented |
| Even and custom splits | ✅ Complete | ✅ Complete | ✅ Implemented |
| Percentage splits | ✅ Complete | ✅ Complete | ✅ Implemented |
| Per-user balance calculation | ✅ Complete | ✅ Complete | ✅ Implemented |
| Settlement suggestions | ✅ Complete | ✅ Complete | ✅ Implemented |
| Multi-currency foundation | 🟡 Schema only | 🔴 Not started | 🟡 Partial |
| **Common Interest Suggestions** |
| Lightweight interest profiles | 🟡 Field exists | 🔴 Not started | 🔴 Missing |
| Overlap detection | 🔴 Not started | 🔴 Not started | 🔴 Missing |
| Activity suggestions | 🔴 Not started | 🔴 Not started | 🔴 Missing |

### Legend
- ✅ Implemented - Feature is complete and working
- 🟡 Partial - Foundation exists but incomplete
- 🔴 Missing - Not implemented

---

## 5. Known Gaps & Technical Debt

### Critical Issues (Block Production)

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| Prisma P1010 Bug | Database connection | **HIGH** | Using Kysely workaround instead of Prisma Client |
| No Backend Tests | `backend/` | **HIGH** | Jest configured, zero test files exist |
| Manual Migrations | Database | **MEDIUM** | Not production-ready, need proper migration system |

### Feature Gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| Real-Time Updates | Users don't see live changes | Socket.IO installed (`socket.io`, `socket.io-client`) but zero handlers |
| Interest Matching | No activity suggestions | `User.interests: String[]` exists but unused |

### Technical Debt Registry

1. **Kysely Migration** - Must migrate back to Prisma when P1010 fixed
2. **Database Types Sync** - `database.types.ts` must match `schema.prisma`
3. **Layout Debug Files** - `/tests/` contains debug test files from Jan 19 layout fixes
4. **Expenses UI** - Per commit "needs to fix UI all around"

---

## 6. Recommended Build Sequence

### Phase 0: Stabilization (Before New Features)
| Priority | Task | File |
|----------|------|------|
| P0.1 | Add auth service tests | `backend/src/modules/auth/__tests__/` |

### Phase 1: Complete MVP Features (Backend Ready)
| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| P1 | Expenses UI Polish | Low | None |

### Phase 2: Real-Time Foundation
| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| P4 | Socket.IO Event Architecture | High | Backend socket handlers |
| P5 | Live Poll Results | Low | P4 |
| P6 | Live Expense Updates | Low | P4 |

### Phase 3: Collaborative Features
| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| P7 | Conflict Detection | Medium | P4, event system |
| P8 | Optimistic Locking | Medium | P7 |

### Phase 4: Interest Matching (MVP Complete)
| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| P9 | Interest Capture UI | Low | None |
| P10 | Overlap Detection Service | Medium | P9 |
| P11 | Activity Suggestions | High | P10 |

---

## 7. Development Rules

### When Adding New Features

**MUST DO:**
1. Check if backend endpoint exists first
2. Add Zod schema in `backend/src/modules/{feature}/{feature}.types.ts`
3. Add frontend types in `frontend/types/`
4. Create React Query hook in `frontend/lib/api/hooks/`
5. Create service in `frontend/lib/api/services/`
6. Follow component hierarchy: `ui/` → `patterns/` → page

**MUST NOT:**
1. Add mock data to production pages
2. Create one-off components without considering reusability
3. Bypass auth middleware on protected routes
4. Use raw SQL without transaction handling
5. Hardcode configuration values
6. Skip updating both Prisma schema AND Kysely types for DB changes

### Frontend Component Hierarchy

```
components/
├── ui/          # Atomic, stateless, no API calls
├── patterns/    # Composed, may use hooks, business logic OK
└── sections/    # Full-page sections, orchestrate patterns
```

- `ui/` components NEVER import from `patterns/` or `sections/`
- `patterns/` components MAY import from `ui/`
- `sections/` components MAY import from both

### Backend Module Pattern

Each feature module MUST follow:
```
modules/{feature}/
├── {feature}.routes.ts      # Express router, apply middleware
├── {feature}.controller.ts  # Parse request, call service, format response
├── {feature}.service.ts     # Business logic, DB queries
├── {feature}.middleware.ts  # Permission checks
└── {feature}.types.ts       # TypeScript interfaces + Zod schemas
```

### Scalability Expectations

- No one-off logic - If it's done once, it will be done again
- No hard-coded assumptions - Use environment variables and configuration
- Design for concurrent users - Consider race conditions and data consistency
- Plan for growth - Use pagination, lazy loading, and efficient queries

---

## 8. Cross-Cutting Concerns

### Layout Coupling (HIGH RISK)

The sidebar width is hardcoded in multiple locations that MUST stay synchronized:

| File | Pattern | Role |
|------|---------|------|
| `frontend/app/(app)/layout.tsx:85` | `w-[70px] lg:w-64` | Source of truth |
| `frontend/app/(app)/layout.tsx:174` | `ml-[70px] lg:ml-64` | Main content offset |
| `frontend/components/patterns/featured-trip-hero.tsx:40` | `-ml-[70px] lg:-ml-64` | Hero negative offset |
| `frontend/app/(app)/trips/[tripId]/page.tsx:55,164` | `pl-[78px]` / `pl-[268px]` | Derived padding |

**If changing sidebar width**: Update ALL locations above. Run `npm run test` to verify layout tests pass.

### Z-Index Layering

| Element | Z-Index | Purpose |
|---------|---------|---------|
| Sidebar | `z-30` | Fixed navigation |
| Hero sections | `z-0` (default) | Must be BELOW sidebar |

Playwright tests (`tests/layout.spec.ts:116-131`) verify this hierarchy.

### Authentication Flow

```
Login → JWT Access Token (15min) + Refresh Token (7d, httpOnly cookie)
     → Stored in Zustand (localStorage key: 'wanderlust-auth')
     → Axios interceptor auto-refreshes on 401
     → All routes except /auth/* require auth middleware
```

Auth guard is active and handles route protection with proper hydration handling.

### Role-Based Permissions

| Role | Create | Edit Own | Edit All | Delete | Admin Actions |
|------|--------|----------|----------|--------|---------------|
| OWNER | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | Some | ✅ |
| MEMBER | ✅ | ✅ | ❌ | Own only | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ❌ |

Permission middleware in: `backend/src/modules/groups/groups.middleware.ts`

### Data Contracts

Frontend and backend share implicit type contracts. No shared types package exists.

- Frontend types: `frontend/types/*.ts`
- Backend validation: Zod schemas in `backend/src/modules/*/*.types.ts`
- API response format: `{ success: boolean, data: T, error?: { code: string, message: string } }`

---

## 9. API Reference (Incomplete Features)

### Polls API (Complete)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/trips/:tripId/polls` | List polls for trip |
| POST | `/api/v1/polls` | Create poll |
| GET | `/api/v1/polls/:id` | Get poll with results |
| PUT | `/api/v1/polls/:id` | Update poll |
| PATCH | `/api/v1/polls/:id/close` | Close poll |
| DELETE | `/api/v1/polls/:id` | Delete poll |
| POST | `/api/v1/polls/:id/vote` | Cast vote |
| PUT | `/api/v1/polls/:id/vote` | Change vote |
| DELETE | `/api/v1/polls/:id/vote/:optionId` | Remove vote |
| GET | `/api/v1/polls/:id/results` | Get vote counts |
| GET | `/api/v1/polls/:id/my-votes` | Get user's votes |

**Poll Types**: `PLACE`, `ACTIVITY`, `DATE`, `CUSTOM`

### Itinerary API (Complete)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/trips/:tripId/itinerary` | List items |
| POST | `/api/v1/trips/:tripId/itinerary` | Create item |
| GET | `/api/v1/trips/:tripId/itinerary/:itemId` | Get item |
| PUT | `/api/v1/trips/:tripId/itinerary/:itemId` | Update item |
| DELETE | `/api/v1/trips/:tripId/itinerary/:itemId` | Delete item |

**Item Types**: `ACCOMMODATION`, `TRANSPORT`, `ACTIVITY`, `MEAL`, `CUSTOM`

---

## 10. Critical Files Reference

| Purpose | Path |
|---------|------|
| Layout source of truth | `frontend/app/(app)/layout.tsx` |
| Global styles | `frontend/app/globals.css` |
| Auth store | `frontend/lib/stores/auth-store.ts` |
| API client | `frontend/lib/api/client.ts` |
| Auth guard | `frontend/components/providers/auth-guard.tsx` |
| Backend entry | `backend/src/app.ts` |
| Auth middleware | `backend/src/middleware/auth.middleware.ts` |
| Database schema | `backend/prisma/schema.prisma` |
| Kysely config | `backend/src/config/kysely.ts` |
| Kysely types | `backend/src/config/database.types.ts` |
| Layout tests | `tests/layout.spec.ts` |
| Prisma workaround docs | `backend/docs/CRITICAL_CHANGES.md` |

---

## 11. Before Committing Checklist

- [ ] If touching layout files: verified sidebar width sync (4 locations)
- [ ] If touching auth: tested login/logout/refresh flow
- [ ] If touching database schema: updated BOTH `schema.prisma` AND `database.types.ts`
- [ ] If adding new routes: added appropriate auth middleware
- [ ] If changing API response shape: updated frontend types
- [ ] No mock data added to production pages
- [ ] New components follow `ui/` → `patterns/` → `sections/` hierarchy
- [ ] Run `npm run test` in root (Playwright tests)

---

## 12. Domain-Specific Guides

- [Frontend Guide](frontend/CLAUDE.md) - Layout coupling, components, styling
- [Backend Guide](backend/CLAUDE.md) - Module patterns, auth, database safety
- [Testing Guide](tests/CLAUDE.md) - Test patterns, layout invariants

---

## 13. Risk Classification

| Level | Examples | Changelog? |
|-------|----------|------------|
| LOW | Typos, comments, test-only changes | No |
| MEDIUM | New features, non-breaking additions | Yes |
| HIGH | Schema changes, auth, layout coupling | Yes + careful review |
| CRITICAL | Security fixes, breaking changes, Prisma/Kysely changes | Yes + alert |
