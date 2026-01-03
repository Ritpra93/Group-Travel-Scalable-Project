# Claude Code Guide - Backend

This file provides context for AI assistants working on the backend.

## Module Structure

Each feature follows this pattern in `src/modules/{feature}/`:

```
modules/
├── auth/
│   ├── auth.routes.ts      # Express router with endpoints
│   ├── auth.controller.ts  # Request handlers (thin layer)
│   ├── auth.service.ts     # Business logic
│   └── schemas/            # Zod validation schemas
│       └── auth.schemas.ts
├── groups/
├── trips/
├── polls/
├── expenses/
├── itinerary/
└── invitations/
```

### Layer Responsibilities

| Layer | Does | Does Not |
|-------|------|----------|
| **Routes** | Define endpoints, apply middleware | Contain business logic |
| **Controller** | Parse request, call service, format response | Access database directly |
| **Service** | Business logic, database queries, validation | Handle HTTP concerns |
| **Schemas** | Zod validation for request bodies | Handle errors |

## API Routes Overview

All routes prefixed with `/api/v1`:

| Route | Auth | Description |
|-------|------|-------------|
| `POST /auth/register` | No | Create account |
| `POST /auth/login` | No | Get tokens |
| `POST /auth/logout` | No | Invalidate refresh |
| `POST /auth/refresh` | No | Get new access token |
| `GET /auth/me` | Yes | Current user |
| `GET,POST /groups` | Yes | List/create groups |
| `GET,PUT,DELETE /groups/:id` | Yes | Group CRUD |
| `*/groups/:id/members` | Yes | Member management |
| `GET,POST /trips` | Yes | List/create trips |
| `GET,PUT,DELETE /trips/:id` | Yes | Trip CRUD |
| `/trips/:tripId/polls` | Yes | Trip polls |
| `/trips/:tripId/expenses` | Yes | Trip expenses |
| `/trips/:tripId/itinerary` | Yes | Trip itinerary |
| `GET /health` | No | Health check |
| `GET /health/ready` | No | Readiness (DB + Redis) |

## Authentication

### JWT Configuration

| Token | Duration | Secret Env Var |
|-------|----------|----------------|
| Access | 15 minutes | `JWT_SECRET` |
| Refresh | 7 days | `JWT_REFRESH_SECRET` |

Both tokens include `type: 'access' | 'refresh'` claim for validation.

### Auth Middleware

Located at `src/middleware/auth.middleware.ts`:

```typescript
// Require authentication - returns 401 if missing/invalid
router.use(authenticate);

// Optional - attaches user if token present, allows anonymous
router.use(optionalAuthenticate);
```

### When to Apply Auth

- **Always require**: Routes that access user data
- **Never require**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/health/*`
- **Optional**: Public content with personalization

## Prisma Safety

### Schema Location

`prisma/schema.prisma` - 12 models with cascade relationships.

### Migration Safety

```bash
# Development - interactive, may drop data
npm run db:migrate:dev

# Production - non-destructive only
npm run db:migrate:deploy

# DANGER: Resets entire database
npm run db:reset
```

### Before Schema Changes

1. **Never drop columns/tables in production** without migration plan
2. **Test cascade behavior** - deleting a Group deletes all Trips, Expenses, etc.
3. **Add indexes** for frequently queried fields
4. **Use transactions** for multi-step operations

### Cascade Delete Chain

```
Group → GroupMember, Trip, Invitation
Trip → Poll, Expense, ItineraryItem
Poll → PollOption → Vote
Expense → ExpenseSplit
```

## API Response Format

All responses follow this shape:

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: {
    code: string,       // e.g., 'VALIDATION_ERROR', 'NOT_FOUND'
    message: string,    // Human-readable
    details?: unknown   // Optional validation errors
  }
}
```

## Error Handling

Global error handler at `src/middleware/errorHandler.middleware.ts`:

| Error Type | HTTP Status |
|------------|-------------|
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| Unknown | 500 |

### Throwing Errors in Services

```typescript
import { NotFoundError, ForbiddenError } from '../common/errors';

if (!trip) {
  throw new NotFoundError('Trip not found');
}

if (user.role !== 'OWNER') {
  throw new ForbiddenError('Only owners can delete trips');
}
```

## Rate Limiting

Applied to all `/api/v1/*` routes:

- Located at `src/middleware/rateLimit.middleware.ts`
- Uses Redis for distributed rate limiting
- Configure via environment variables

## Middleware Stack Order

Applied in `src/app.ts`:

1. `helmet()` - Security headers
2. `cors()` - Cross-origin (localhost dev, whitelist prod)
3. `compression()` - Response compression
4. `express.json()` - Body parsing (10mb limit)
5. `requestId` - Unique request IDs
6. `requestLogger` - Request logging
7. `apiRateLimiter` - Rate limiting on /api/v1
8. Route handlers with `authenticate` where needed
9. `notFoundHandler` - 404 for unmatched routes
10. `errorHandler` - Global error handler (MUST be last)

## Environment Variables

Required (validated by Zod in `src/config/env.ts`):

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:3000
```

Optional:

```env
NODE_ENV=development|production
PORT=4000
LOG_LEVEL=debug|info|warn|error
SMTP_*=...  # Email
SENTRY_DSN=... # Error tracking
```

## Role-Based Access

Group membership uses roles:

| Role | Can Do |
|------|--------|
| OWNER | Everything, delete group, transfer ownership |
| ADMIN | Manage members, edit trips |
| MEMBER | Create trips, expenses, vote |
| VIEWER | Read-only access |

Check roles in services:

```typescript
const member = await prisma.groupMember.findUnique({
  where: { groupId_userId: { groupId, userId } }
});

if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
  throw new ForbiddenError('Insufficient permissions');
}
```

## Before Committing Backend Changes

- [ ] Added auth middleware to new protected routes
- [ ] Created Zod schema for request validation
- [ ] Followed response format `{ success, data }` or `{ success, error }`
- [ ] Tested cascade behavior if touching relationships
- [ ] Created migration for schema changes
- [ ] Ran `npm run lint` in backend/
