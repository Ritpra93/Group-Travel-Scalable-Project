# Claude Code Guide - Wanderlust

This file provides context for AI assistants working on this codebase.

## Project Overview

**Wanderlust** is a full-stack trip planning application for group travel coordination.

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Next.js 16.1.1 (App Router), React 19, Tailwind CSS 4 | `/frontend` |
| Backend | Express.js 4.18, TypeScript, Prisma ORM | `/backend` |
| Database | PostgreSQL | via Prisma |
| Caching | Redis | session/rate limiting |
| Testing | Playwright (E2E) | `/tests` |

## Architecture Diagram

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
│  Express.js + JWT Auth + Rate Limiting                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /api/v1                                              │   │
│  │ ├── /auth (register, login, refresh, logout)        │   │
│  │ ├── /groups (CRUD, members, leave)                  │   │
│  │ ├── /trips (CRUD, status)                           │   │
│  │ ├── /trips/:tripId/polls                            │   │
│  │ ├── /trips/:tripId/expenses                         │   │
│  │ └── /trips/:tripId/itinerary                        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL + Redis                       │
│  12 models: User, Session, Group, GroupMember, Trip,        │
│  Poll, PollOption, Vote, Expense, ExpenseSplit,             │
│  ItineraryItem, Invitation, ActivityLog                     │
└─────────────────────────────────────────────────────────────┘
```

## Critical Files Reference

| Purpose | Path |
|---------|------|
| Layout source of truth | `frontend/app/(app)/layout.tsx` |
| Global styles | `frontend/app/globals.css` |
| Auth store | `frontend/lib/stores/auth-store.ts` |
| API client | `frontend/lib/api/client.ts` |
| Backend entry | `backend/src/app.ts` |
| Auth middleware | `backend/src/middleware/auth.middleware.ts` |
| Database schema | `backend/prisma/schema.prisma` |
| Layout tests | `tests/layout.spec.ts` |

## Cross-Cutting Rules

### 1. Layout Coupling (HIGH RISK)

The sidebar width is hardcoded in multiple locations that MUST stay synchronized:

| File | Pattern | Role |
|------|---------|------|
| `frontend/app/(app)/layout.tsx:85` | `w-[70px] lg:w-64` | Source of truth |
| `frontend/app/(app)/layout.tsx:174` | `ml-[70px] lg:ml-64` | Main content offset |
| `frontend/components/patterns/featured-trip-hero.tsx:40` | `-ml-[70px] lg:-ml-64` | Hero negative offset |
| `frontend/app/(app)/trips/[tripId]/page.tsx:55,164` | `pl-[78px]` / `pl-[268px]` | Derived padding |

**If changing sidebar width**: Update ALL locations above. Run `npm run test` to verify layout tests pass.

### 2. Z-Index Layering

| Element | Z-Index | Purpose |
|---------|---------|---------|
| Sidebar | `z-30` | Fixed navigation |
| Hero sections | `z-0` (default) | Must be BELOW sidebar |

Playwright tests (`tests/layout.spec.ts:116-131`) verify this hierarchy. Changing z-index will fail tests.

### 3. Authentication Flow

```
Login → JWT Access Token (15min) + Refresh Token (7d, httpOnly cookie)
     → Stored in Zustand (localStorage key: 'wanderlust-auth')
     → Axios interceptor auto-refreshes on 401
     → All routes except /auth/* require auth middleware
```

**Breaking auth flow locks users out**. Test thoroughly after any changes.

### 4. Data Contracts

Frontend and backend share implicit type contracts. No shared types package exists.

- Frontend types: `frontend/types/*.ts`
- Backend validation: Zod schemas in `backend/src/modules/*/schemas/`
- API response format: `{ success: boolean, data: T, error?: { code: string, message: string } }`

## Current Architecture Patterns

These describe the current state. Architectural evolution is valid when justified - the goal is awareness of coupling.

| Pattern | Current Implementation | If Changing, Update |
|---------|----------------------|---------------------|
| Data fetching | Client-side via React Query | All components using `useQuery`, API client |
| Styling | Tailwind utilities + CSS variables | See `/frontend/CLAUDE.md` |
| Package structure | Separate `/frontend` + `/backend` | Consider shared types if needed |
| Server rendering | Minimal; client-side dominant | React Query cache, loading states |

## Before Committing Checklist

- [ ] If touching layout files: verified sidebar width sync
- [ ] If touching auth: tested login/logout/refresh flow
- [ ] If touching Prisma schema: created migration, tested cascade behavior
- [ ] If adding new routes: added appropriate auth middleware
- [ ] If changing API response shape: updated frontend types
- [ ] Run `npm run test` in root (Playwright tests)

## Domain-Specific Guides

- [Frontend Guide](frontend/CLAUDE.md) - Layout coupling, components, styling
- [Backend Guide](backend/CLAUDE.md) - Module patterns, auth, Prisma safety
- [Testing Guide](tests/CLAUDE.md) - Test patterns, layout invariants

## Risk Classification

| Level | Examples | Changelog? |
|-------|----------|------------|
| LOW | Typos, comments, test-only | No |
| MEDIUM | New features, non-breaking additions | Yes |
| HIGH | Schema changes, auth, layout coupling | Yes + careful review |
| CRITICAL | Security fixes, breaking changes | Yes + alert |
