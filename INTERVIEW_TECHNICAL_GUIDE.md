# Wanderlust - Comprehensive Technical Interview Guide

> A collaborative trip planning platform for group travel coordination.
> This document explains every technical concept as if encountering it for the first time, with rationale for all architectural decisions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack Explained](#2-technology-stack-explained)
3. [Backend Architecture Deep Dive](#3-backend-architecture-deep-dive)
4. [Frontend Architecture Deep Dive](#4-frontend-architecture-deep-dive)
5. [Core Features Implementation](#5-core-features-implementation)
6. [Real-Time Collaboration](#6-real-time-collaboration)
7. [Security Implementation](#7-security-implementation)
8. [Database Design & Patterns](#8-database-design--patterns)
9. [State Management Strategy](#9-state-management-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Key Algorithms & Data Structures](#11-key-algorithms--data-structures)
12. [Interview Talking Points](#12-interview-talking-points)

---

## 1. Project Overview

### What is Wanderlust?

Wanderlust is a **full-stack collaborative trip planning application** that enables groups of friends to:

1. **Plan trips together** - Create shared workspaces for each trip
2. **Make group decisions democratically** - Voting polls for destinations, activities, dates
3. **Split expenses transparently** - Track who paid what, calculate who owes whom
4. **Build itineraries collaboratively** - Add activities, see real-time updates from group members
5. **Find common interests** - Match group members by interests for activity suggestions

### Why Build This?

**Problem Statement**: Planning group trips is chaotic. Messages get lost in group chats, expense calculations are error-prone, and getting everyone to agree on plans is difficult.

**Solution**: A dedicated platform where:
- All trip information is centralized
- Decisions happen through structured voting
- Money is tracked automatically
- Everyone sees changes in real-time

### Core Product Principles

1. **Groups are the organizational unit** - Everything flows from group membership
2. **Decisions happen democratically** - Polling enables consensus
3. **Money should be transparent** - Expense splitting removes friction
4. **Itineraries are living documents** - Collaborative editing in real-time
5. **Real-time is first-class** - Users see live updates from group members

---

## 2. Technology Stack Explained

### Frontend Stack

| Technology | What It Does | Why We Chose It |
|------------|--------------|-----------------|
| **Next.js 16 (App Router)** | React framework with server-side rendering | App Router provides file-based routing, server components, and better performance out of the box |
| **React 19** | UI component library | Industry standard, large ecosystem, hooks for state management |
| **TypeScript** | Type-safe JavaScript | Catches bugs at compile time, better IDE support, self-documenting code |
| **Tailwind CSS 4** | Utility-first CSS framework | Faster development, consistent design, no context-switching between files |
| **React Query (TanStack Query)** | Server state management | Handles caching, refetching, loading states automatically |
| **Zustand** | Client state management | Simpler than Redux, minimal boilerplate, great TypeScript support |
| **React Hook Form** | Form handling | Performance optimized (minimal re-renders), great validation integration |
| **Zod** | Schema validation | Type inference, runtime validation, works on both frontend and backend |
| **Axios** | HTTP client | Better error handling than fetch, interceptors for token refresh |
| **Socket.IO Client** | Real-time communication | WebSocket with automatic fallback to polling |

### Backend Stack

| Technology | What It Does | Why We Chose It |
|------------|--------------|-----------------|
| **Express.js** | Node.js web framework | Mature, flexible, huge middleware ecosystem |
| **TypeScript** | Type-safe JavaScript | Same benefits as frontend - consistency across codebase |
| **PostgreSQL** | Relational database | ACID compliance, complex queries, JSON support for flexibility |
| **Kysely** | SQL query builder | Type-safe queries, no ORM overhead, full SQL control |
| **Prisma** | Database schema definition | Schema-as-code, migrations, type generation |
| **Redis** | In-memory data store | Session storage, rate limiting, real-time event distribution |
| **Socket.IO** | Real-time server | WebSocket with rooms, Redis adapter for scaling |
| **JWT** | Authentication tokens | Stateless auth, works across distributed systems |
| **bcrypt** | Password hashing | Industry standard, configurable cost factor |
| **Zod** | Validation | Shared validation logic between frontend and backend |

### Infrastructure

| Technology | What It Does | Why We Chose It |
|------------|--------------|-----------------|
| **Docker** | Containerization | Consistent environments, easy PostgreSQL/Redis setup |
| **GitHub Actions** | CI/CD | Free for public repos, integrated with GitHub |
| **Playwright** | E2E Testing | Modern, reliable, cross-browser testing |

---

## 3. Backend Architecture Deep Dive

### The Module Pattern

Every feature in the backend follows a **4-layer architecture**:

```
backend/src/modules/{feature}/
├── {feature}.routes.ts      # Route definitions
├── {feature}.controller.ts  # Request handling
├── {feature}.service.ts     # Business logic
├── {feature}.middleware.ts  # Permission checks
└── {feature}.types.ts       # TypeScript + Zod schemas
```

#### Why This Pattern?

**Separation of Concerns** - Each layer has ONE job:

1. **Routes Layer** - Defines HTTP endpoints, applies middleware
   ```typescript
   // Only defines WHAT endpoints exist, delegates to controller
   router.post('/login',
     asyncHandler(authController.login.bind(authController))
   );
   ```

2. **Controller Layer** - Thin layer that parses requests and formats responses
   ```typescript
   // Parse → Call Service → Format Response
   async login(req, res, next) {
     const validatedData = loginSchema.parse(req.body);      // Parse
     const result = await authService.login(validatedData);  // Call
     res.status(200).json({ success: true, data: result });  // Format
   }
   ```

3. **Service Layer** - Where ALL business logic lives (the "thick" layer)
   ```typescript
   // Database queries, calculations, validations, side effects
   async login(input: LoginInput): Promise<AuthResponse> {
     const user = await db.selectFrom('users')...  // Query
     const isValid = await bcrypt.compare(...);    // Logic
     const tokens = generateTokenPair(user);       // Side effect
     return { user, tokens };                      // Return
   }
   ```

4. **Middleware Layer** - Cross-cutting concerns like authentication
   ```typescript
   // Runs BEFORE controller, can halt request
   function requireGroupMembership(req, res, next) {
     // Check if user is group member, throw 403 if not
   }
   ```

### The Prisma/Kysely Story

#### The Problem: Prisma P1010 Error

Prisma is a popular ORM (Object-Relational Mapping) that simplifies database operations. However, we hit a known bug:

```
Error: User 'postgres' was denied access on the database 'public'
```

This happens with PostgreSQL 14+ due to stricter permission handling. Despite having correct credentials and permissions, Prisma Client fails to connect.

#### The Solution: Kysely as Query Builder

Instead of waiting for a fix, we:

1. **Keep Prisma for schema definition** - `schema.prisma` defines our data model
2. **Use Kysely for queries** - Type-safe SQL query builder that just works

```typescript
// Prisma approach (doesn't work due to P1010):
const user = await prisma.user.findUnique({ where: { id } });

// Kysely approach (what we use):
const user = await db
  .selectFrom('users')
  .selectAll()
  .where('id', '=', id)
  .executeTakeFirst();
```

#### Type Synchronization: prisma-kysely

The challenge: Kysely needs TypeScript types matching our database schema.

**Solution**: The `prisma-kysely` package automatically generates Kysely-compatible types from our Prisma schema:

```prisma
// In schema.prisma
generator kysely {
  provider     = "prisma-kysely"
  output       = "../src/config"
  fileName     = "database.types.ts"
}
```

Now when we change the schema, types are auto-generated.

### Middleware Chain

When a request hits the server, it passes through middleware in order:

```
Request → Helmet → CORS → Compression → Body Parser → Cookie Parser
       → Request Logger → Rate Limiter → Auth (if protected) → Route Handler
```

| Middleware | Purpose |
|------------|---------|
| **Helmet** | Sets security headers (prevents XSS, clickjacking) |
| **CORS** | Controls which domains can make requests |
| **Compression** | Gzip responses for faster transfer |
| **Body Parser** | Converts JSON request bodies to JavaScript objects |
| **Cookie Parser** | Reads cookies (for refresh tokens) |
| **Rate Limiter** | Prevents abuse by limiting requests per IP |
| **Auth Middleware** | Verifies JWT tokens, attaches user to request |

### Error Handling Strategy

All errors flow through a global error handler:

```typescript
// Custom error classes with HTTP status codes
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {}
}

// Specific error types
class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}
```

The error handler converts these to consistent JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip not found"
  }
}
```

---

## 4. Frontend Architecture Deep Dive

### Next.js App Router Structure

Next.js App Router uses **file-based routing** - files and folders determine URL paths:

```
app/
├── (auth)/              # Route group - doesn't affect URL
│   ├── login/page.tsx   # → /login
│   └── register/page.tsx # → /register
├── (app)/               # Another route group
│   ├── dashboard/page.tsx # → /dashboard
│   ├── trips/
│   │   ├── page.tsx     # → /trips
│   │   └── [tripId]/    # Dynamic segment
│   │       ├── page.tsx # → /trips/123
│   │       └── expenses/page.tsx # → /trips/123/expenses
```

#### Why Route Groups?

The `(auth)` and `(app)` folders are **route groups** - they organize code without affecting URLs:
- `(auth)` pages share an unauthenticated layout
- `(app)` pages share a sidebar layout with authentication

### Component Hierarchy

We follow an **Atomic Design** pattern:

```
components/
├── ui/              # Atoms - smallest, reusable, no business logic
│   ├── button.tsx   # Just renders a styled button
│   ├── input.tsx    # Just renders a styled input
│   └── card.tsx     # Just renders a container
│
├── patterns/        # Molecules - combine atoms, may have logic
│   ├── trip-card.tsx      # Combines card + image + buttons
│   ├── expense-form/      # Multi-component form
│   └── poll-widget.tsx    # Displays poll with voting
│
└── sections/        # Organisms - full page sections
    └── Hero.tsx     # Complete hero section
```

**Rules**:
- `ui/` NEVER imports from `patterns/` or `sections/`
- `patterns/` MAY import from `ui/`
- `sections/` MAY import from both

**Why?** Prevents circular dependencies, makes components predictable.

### The API Client

All API calls go through a centralized Axios client:

```typescript
// frontend/lib/api/client.ts
export const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  withCredentials: true,  // Sends cookies (for refresh token)
  timeout: 30000,
});
```

#### Automatic Token Refresh

When an API call gets a 401 (Unauthorized), the client automatically:

1. Pauses the failed request
2. Calls `/auth/refresh` to get a new token
3. Retries the original request with the new token
4. If refresh fails, logs out the user

```typescript
// Simplified token refresh logic
apiClient.interceptors.response.use(
  (response) => response,  // Success - pass through
  async (error) => {
    if (error.response?.status === 401) {
      // Get new token
      const newToken = await refreshToken();

      // Retry original request with new token
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    throw error;
  }
);
```

### Authentication Flow

1. **User logs in** → Backend returns access token (15 min) + refresh token (7 days)
2. **Access token** → Stored in Zustand (memory), sent with every API request
3. **Refresh token** → Stored in httpOnly cookie, only sent to `/auth/refresh`
4. **On page reload** → Zustand rehydrates from localStorage, token still valid
5. **On token expiry** → Axios interceptor automatically refreshes

#### Why Two Tokens?

| Token | Duration | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token** | 15 minutes | Memory/localStorage | Short-lived, limits damage if stolen |
| **Refresh Token** | 7 days | httpOnly cookie | Long-lived, used only to get new access tokens |

The httpOnly cookie can't be accessed by JavaScript, preventing XSS attacks from stealing it.

### Auth Guard

The `AuthGuard` component protects routes:

```typescript
function AuthGuard({ children }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const pathname = usePathname();

  // Wait for Zustand to load from localStorage
  if (!_hasHydrated) {
    return <LoadingSpinner />;
  }

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    redirect('/login');
  }

  return children;
}
```

#### Why Wait for Hydration?

**Problem**: Next.js renders on the server first (SSR). On the server, localStorage doesn't exist, so `isAuthenticated` is always `false` initially.

**Solution**: Wait for the client-side JavaScript to "hydrate" (load) and read from localStorage before making routing decisions.

---

## 5. Core Features Implementation

### 5.1 Group Management & Role-Based Permissions

#### The Role Hierarchy

```
OWNER (4)  →  Full control, cannot be removed
   ↓
ADMIN (3)  →  Can manage members, edit settings
   ↓
MEMBER (2) →  Can create content, vote, add expenses
   ↓
VIEWER (1) →  Read-only access
```

#### Permission Logic

```typescript
// backend/src/modules/groups/groups.middleware.ts

// Factory function - creates middleware for specific role requirements
function requireGroupRole(minimumRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER') {
  const ROLE_HIERARCHY = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };

  return (req, res, next) => {
    const userRole = req.groupMember.role;

    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minimumRole]) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}

// Usage: Only ADMIN or OWNER can edit group settings
router.put('/:groupId',
  authenticate,
  requireGroupMembership,
  requireGroupRole('ADMIN'),  // Blocks MEMBER and VIEWER
  groupController.updateGroup
);
```

#### Atomic Group Creation

When creating a group, we need to:
1. Create the group record
2. Add the creator as OWNER

Both must succeed or both must fail. We use a **database transaction**:

```typescript
async createGroup(userId: string, data: CreateGroupInput) {
  return db.transaction().execute(async (trx) => {
    // If either fails, both are rolled back
    const group = await trx.insertInto('groups').values({...}).execute();
    await trx.insertInto('group_members').values({
      groupId: group.id,
      userId: userId,
      role: 'OWNER'
    }).execute();

    return group;
  });
}
```

### 5.2 Polling System

#### Data Model

```
Poll
├── id, tripId, title, description
├── type: PLACE | ACTIVITY | DATE | CUSTOM
├── status: ACTIVE | CLOSED | ARCHIVED
├── allowMultiple: boolean
├── maxVotes: number | null
├── closesAt: Date | null
└── options: PollOption[]
         └── votes: Vote[]
```

#### Vote Aggregation Query

Getting poll results requires counting votes per option:

```typescript
const results = await db
  .selectFrom('poll_options as po')
  .leftJoin('votes as v', (join) =>
    join.onRef('v.optionId', '=', 'po.id')
  )
  .select([
    'po.id',
    'po.label',
    db.fn.count('v.id').as('voteCount')  // SQL COUNT()
  ])
  .where('po.pollId', '=', pollId)
  .groupBy('po.id')  // Group by option to count each
  .execute();
```

#### Why Real-Time for Polls?

Without real-time updates:
1. User A votes
2. User B is viewing the poll
3. User B sees stale vote counts
4. User B must manually refresh

With real-time (Socket.IO):
1. User A votes
2. Backend emits `poll:voted` event
3. All users viewing that trip receive the event
4. UI updates automatically

### 5.3 Expense Splitting

#### Three Split Strategies

**1. EQUAL Split**
```
$100 split among 3 people:
- Person 1: $33.33
- Person 2: $33.33
- Person 3: $33.34 (absorbs remainder)
```

**2. CUSTOM Split** (exact amounts)
```
$100 total:
- Person 1: $50.00
- Person 2: $30.00
- Person 3: $20.00
```

**3. PERCENTAGE Split**
```
$100 at 20%, 30%, 50%:
- Person 1: $20.00 (20%)
- Person 2: $30.00 (30%)
- Person 3: $50.00 (50%)
```

#### The Remainder Problem

When splitting $100 equally among 3 people:
- $100 / 3 = $33.333...
- If everyone pays $33.33, total is $99.99 (1 cent short!)

**Solution**: Last person absorbs the remainder:
```typescript
function calculateEqualSplits(total: number, userIds: string[]) {
  const count = userIds.length;
  const baseAmount = Math.floor((total * 100) / count) / 100;  // Round DOWN
  const remainder = total - (baseAmount * count);

  return userIds.map((userId, index) => ({
    userId,
    amount: index === count - 1
      ? baseAmount + remainder  // Last person gets extra
      : baseAmount
  }));
}
```

#### Settlement Optimization Algorithm

**Problem**: Given who owes what, calculate the minimum number of transactions to settle all debts.

**Example**:
```
Alice paid $100, owes $30  →  balance: +$70 (is owed $70)
Bob paid $50, owes $60     →  balance: -$10 (owes $10)
Carol paid $40, owes $60   →  balance: -$20 (owes $20)
Dave paid $0, owes $40     →  balance: -$40 (owes $40)
```

**Naive approach**: 6 transactions (everyone pays everyone they owe)

**Our approach** (Greedy algorithm):
```typescript
function calculateSettlements(balances: UserBalance[]) {
  // Separate into who's owed (creditors) and who owes (debtors)
  const creditors = balances.filter(b => b.balance > 0).sort(descending);
  const debtors = balances.filter(b => b.balance < 0).sort(descending);

  const settlements = [];

  // Match largest debtor with largest creditor
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: amount
    });

    // Update balances
    creditor.balance -= amount;
    debtor.balance += amount;

    // Remove settled parties
    if (creditor.balance < 0.01) creditors.shift();
    if (debtor.balance > -0.01) debtors.shift();
  }

  return settlements;
}
```

**Result**:
```
1. Dave pays Alice $40 (Dave settled, Alice still owed $30)
2. Carol pays Alice $20 (Carol settled, Alice still owed $10)
3. Bob pays Alice $10 (Bob settled, Alice settled)

Only 3 transactions instead of 6!
```

**Algorithm Complexity**:
- Time: O(n log n) for sorting
- Space: O(n) for creditors/debtors arrays

### 5.4 Itinerary with Conflict Detection

#### The Concurrent Edit Problem

1. Alice opens itinerary item "Lunch at Cafe"
2. Bob opens the same item
3. Alice changes time to 12:00pm, saves
4. Bob changes time to 1:00pm, saves
5. **Bob's change overwrites Alice's!** (Lost update)

#### Optimistic Locking Solution

Every record has an `updatedAt` timestamp. When editing:

```typescript
// When user FETCHES the item
const item = await getItineraryItem(itemId);
// item.updatedAt = "2024-01-15T10:00:00Z"

// When user SAVES changes, include the original timestamp
await updateItineraryItem(itemId, {
  title: "New Title",
  clientUpdatedAt: item.updatedAt  // "2024-01-15T10:00:00Z"
});

// Backend CHECKS if record was modified since fetch
if (item.updatedAt !== data.clientUpdatedAt) {
  throw new ConflictError('Modified by another user');
}
```

**Flow with conflict**:
1. Alice fetches item (updatedAt: 10:00)
2. Bob fetches item (updatedAt: 10:00)
3. Alice saves (updatedAt matches, success, now 10:05)
4. Bob saves (updatedAt is 10:05 ≠ 10:00, **CONFLICT!**)
5. Bob sees "Item was modified. Refresh and try again."

### 5.5 Interest Matching

#### Jaccard Similarity

We use **Jaccard similarity** to measure how similar two users' interests are:

```
Jaccard = |Intersection| / |Union|

Example:
Alice: [Hiking, Beach, Food]
Bob: [Beach, Food, Wine, Adventure]

Intersection: [Beach, Food] = 2
Union: [Hiking, Beach, Food, Wine, Adventure] = 5

Similarity: 2/5 = 40%
```

#### Group Interest Analysis

```typescript
async getGroupInterestAnalysis(groupId: string, requestingUserId: string) {
  const members = await fetchAllGroupMembers(groupId);
  const myInterests = new Set(members.find(m => m.id === requestingUserId)?.interests);

  // Calculate overlap with each member
  const overlaps = members
    .filter(m => m.id !== requestingUserId)
    .map(member => {
      const memberInterests = new Set(member.interests);

      // Intersection
      const common = [...memberInterests].filter(i => myInterests.has(i));

      // Union
      const union = new Set([...myInterests, ...memberInterests]);

      // Jaccard score as percentage
      const score = Math.round((common.length / union.size) * 100);

      return { member, commonInterests: common, score };
    })
    .sort((a, b) => b.score - a.score);  // Highest overlap first

  return overlaps;
}
```

---

## 6. Real-Time Collaboration

### Socket.IO Architecture

#### Why Socket.IO?

**WebSockets** provide persistent, bidirectional communication. Unlike HTTP (request-response), WebSockets allow:
- Server can push updates to clients anytime
- Lower latency than polling
- Reduced server load (no constant requests)

**Socket.IO** adds:
- Automatic reconnection
- Fallback to HTTP long-polling if WebSockets fail
- Room-based broadcasting (send to specific groups)
- Acknowledgments (confirm message received)

#### Connection Flow

```
1. User logs in
2. Frontend creates Socket.IO connection with JWT
3. Backend validates JWT in socket middleware
4. Connection established, userId attached to socket
5. User navigates to trip page
6. Frontend emits 'trip:join' with tripId
7. Backend adds socket to room 'trip:${tripId}'
8. User now receives all events for that trip
```

#### Event Types

```typescript
// 11 real-time events
interface ServerEvents {
  // Polls
  'poll:created': (event: PollCreatedData) => void;
  'poll:voted': (event: PollVotedData) => void;
  'poll:closed': (event: PollClosedData) => void;
  'poll:deleted': (event: PollDeletedData) => void;

  // Expenses
  'expense:created': (event: ExpenseCreatedData) => void;
  'expense:updated': (event: ExpenseUpdatedData) => void;
  'expense:deleted': (event: ExpenseDeletedData) => void;
  'expense:split:updated': (event: SplitUpdatedData) => void;

  // Itinerary
  'itinerary:created': (event: ItemCreatedData) => void;
  'itinerary:updated': (event: ItemUpdatedData) => void;
  'itinerary:deleted': (event: ItemDeletedData) => void;
}
```

#### Room-Based Broadcasting

```typescript
// Backend: After creating an expense
async createExpense(tripId: string, data: ExpenseInput) {
  // 1. Save to database
  const expense = await db.insertInto('expenses').values(data).execute();

  // 2. Broadcast to all users viewing this trip
  io.to(`trip:${tripId}`).emit('expense:created', {
    tripId,
    expenseId: expense.id,
    title: expense.title,
    amount: expense.amount
  });

  return expense;
}
```

#### Redis Adapter for Scaling

**Problem**: If we have multiple server instances, each has its own Socket.IO connections. Events emitted on Server A won't reach clients connected to Server B.

**Solution**: Redis Pub/Sub

```
Server A emits 'expense:created'
    ↓
Redis receives and broadcasts to all servers
    ↓
Server B and Server C receive event
    ↓
All connected clients get the update
```

```typescript
// Setup Redis adapter
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

#### Frontend Hook Pattern

```typescript
// Hook for subscribing to trip events
function useTripSocket(tripId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Join the trip room
    socket.emit('trip:join', tripId);

    // Listen for expense events
    const handleExpenseCreated = (event) => {
      // Invalidate cache - triggers refetch
      queryClient.invalidateQueries(['expenses', tripId]);
    };

    socket.on('expense:created', handleExpenseCreated);

    // Cleanup on unmount
    return () => {
      socket.emit('trip:leave', tripId);
      socket.off('expense:created', handleExpenseCreated);
    };
  }, [tripId]);
}
```

---

## 7. Security Implementation

### JWT Authentication

#### What is JWT?

**JSON Web Token** - A signed token containing user information:

```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiJ9.  // Header (algorithm)
eyJ1c2VySWQiOiIxMjMifQ. // Payload (data)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  // Signature
```

The signature proves the token wasn't tampered with. Only the server knows the secret key.

#### Why Two Tokens?

| Risk | Short Token (15 min) | Long Token (7 days) |
|------|---------------------|-------------------|
| Token stolen | Limited damage window | Longer exposure |
| Storage security | Can be in memory | Needs httpOnly cookie |
| Usage frequency | Every API request | Only for refresh |

#### Token Refresh Flow

```
1. Access token expires (401 from API)
    ↓
2. Client calls POST /auth/refresh (cookie sent automatically)
    ↓
3. Server validates refresh token:
   - Signature valid?
   - Not blacklisted?
   - Session exists in database?
    ↓
4. Server generates NEW token pair
    ↓
5. Old refresh token added to blacklist
    ↓
6. New tokens returned to client
    ↓
7. Original request retried with new access token
```

### Password Security

#### Bcrypt Hashing

Passwords are **never stored in plain text**. We use bcrypt:

```typescript
// Registration
const passwordHash = await bcrypt.hash(password, 12);  // 12 rounds
await db.insertInto('users').values({ email, passwordHash });

// Login
const user = await db.selectFrom('users').where('email', '=', email).execute();
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Why 12 rounds?** Each round doubles the computation time:
- 10 rounds: ~10ms per hash
- 12 rounds: ~40ms per hash (good balance of security vs. performance)
- 14 rounds: ~160ms per hash

### Rate Limiting

Prevents abuse by limiting requests:

```typescript
// Sliding window algorithm
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
const MAX_REQUESTS = 100;

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const now = Date.now();

  // Remove requests older than window
  await redis.zRemRangeByScore(key, 0, now - WINDOW_MS);

  // Count requests in window
  const count = await redis.zCard(key);

  if (count >= MAX_REQUESTS) {
    return false;  // Rate limited!
  }

  // Add current request
  await redis.zAdd(key, { score: now, value: String(now) });

  return true;
}
```

**Different limits for different endpoints**:
- Login: 5 attempts per 15 minutes (prevents brute force)
- General API: 100 requests per 15 minutes
- Password reset: 3 per hour

### CORS Configuration

**Cross-Origin Resource Sharing** controls which domains can call our API:

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'development') {
      // Allow any localhost in development
      if (!origin || /localhost|127\.0\.0\.1/.test(origin)) {
        return callback(null, true);
      }
    }

    // Production: whitelist only
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true  // Allow cookies
};
```

---

## 8. Database Design & Patterns

### Schema Overview

```
┌─────────────┐       ┌─────────────┐
│   User      │───┬───│   Group     │
└─────────────┘   │   └─────────────┘
       │          │          │
       │    ┌─────┴─────┐    │
       │    │GroupMember│    │
       │    └───────────┘    │
       │                     │
       │               ┌─────┴─────┐
       │               │   Trip    │
       │               └───────────┘
       │                     │
       ├──────────┬──────────┼──────────┐
       │          │          │          │
┌──────┴───┐ ┌────┴────┐ ┌───┴───┐ ┌────┴────┐
│ Expense  │ │  Poll   │ │ Vote  │ │Itinerary│
└──────────┘ └─────────┘ └───────┘ └─────────┘
       │          │
┌──────┴───┐ ┌────┴─────┐
│  Split   │ │PollOption│
└──────────┘ └──────────┘
```

### Key Relationships

| Relationship | Type | Why |
|--------------|------|-----|
| User → GroupMember | One-to-Many | User can be in many groups |
| Group → Trip | One-to-Many | Group can have many trips |
| Trip → Expense | One-to-Many | Trip has many expenses |
| Expense → Split | One-to-Many | Expense split among many users |
| Poll → PollOption | One-to-Many | Poll has many options |
| User ↔ PollOption (via Vote) | Many-to-Many | Users vote on options |

### Indexing Strategy

Indexes speed up queries by creating lookup tables:

```prisma
model Expense {
  id        String   @id
  tripId    String
  paidBy    String
  paidAt    DateTime

  // Indexes for common queries
  @@index([tripId, paidAt])  // "Show expenses for trip, sorted by date"
  @@index([paidBy])          // "Show what I paid for"
}

model GroupMember {
  id      String @id
  groupId String
  userId  String
  role    GroupRole

  // Composite index for permission checks
  @@index([groupId, role])  // "Find admins of group X"

  // Unique constraint - one membership per user per group
  @@unique([groupId, userId])
}
```

### Transaction Patterns

**ACID Transactions** ensure data consistency:

- **Atomicity**: All operations succeed or all fail
- **Consistency**: Data remains valid after transaction
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data survives crashes

```typescript
// Creating an expense with splits - must be atomic
await db.transaction().execute(async (trx) => {
  // Create expense
  const expense = await trx.insertInto('expenses')
    .values({ id: createId(), tripId, title, amount, paidBy })
    .executeTakeFirstOrThrow();

  // Create splits
  for (const split of splits) {
    await trx.insertInto('expense_splits')
      .values({ id: createId(), expenseId: expense.id, ...split })
      .execute();
  }

  // If any insert fails, ALL are rolled back
  return expense;
});
```

---

## 9. State Management Strategy

### Two-Tier Approach

We separate **server state** (data from API) from **client state** (UI state):

| State Type | Library | Examples |
|------------|---------|----------|
| **Server State** | React Query | Trips, expenses, polls, users |
| **Client State** | Zustand | Auth tokens, UI preferences |

#### Why Separate?

**Server state** has unique challenges:
- Needs caching (don't refetch on every render)
- Can become stale (someone else modified it)
- Requires loading/error states
- Needs background refetching

**React Query** handles all of this automatically:

```typescript
function TripsPage() {
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsService.getTrips(),
    staleTime: 5 * 60 * 1000,  // Fresh for 5 minutes
    refetchOnWindowFocus: true  // Refetch when user returns to tab
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;

  return <TripList trips={trips} />;
}
```

**Client state** is simpler - just local values:

```typescript
// Zustand store for auth
const useAuthStore = create(persist(
  (set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setTokens: (token) => set({
      accessToken: token,
      isAuthenticated: true
    }),

    logout: () => set({
      user: null,
      accessToken: null,
      isAuthenticated: false
    }),
  }),
  { name: 'wanderlust-auth' }  // localStorage key
));
```

### Query Key Structure

React Query uses **keys** to identify cached data:

```typescript
const tripsKeys = {
  all: ['trips'] as const,
  lists: () => [...tripsKeys.all, 'list'],
  list: (filters) => [...tripsKeys.lists(), filters],
  details: () => [...tripsKeys.all, 'detail'],
  detail: (id) => [...tripsKeys.details(), id],
};

// Usage
useQuery({ queryKey: tripsKeys.detail('trip-123') });

// Invalidate all trip lists (e.g., after creating a trip)
queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
```

### Optimistic Updates

Show changes immediately, before server confirms:

```typescript
const mutation = useMutation({
  mutationFn: (data) => createExpense(tripId, data),

  onMutate: async (newExpense) => {
    // Cancel pending refetches
    await queryClient.cancelQueries(['expenses', tripId]);

    // Snapshot previous value
    const previousExpenses = queryClient.getQueryData(['expenses', tripId]);

    // Optimistically add new expense
    queryClient.setQueryData(['expenses', tripId], (old) => [
      ...old,
      { ...newExpense, id: 'temp-id' }  // Temporary ID
    ]);

    // Return rollback function
    return { previousExpenses };
  },

  onError: (err, newExpense, context) => {
    // Rollback on error
    queryClient.setQueryData(['expenses', tripId], context.previousExpenses);
  },

  onSettled: () => {
    // Refetch to get real data
    queryClient.invalidateQueries(['expenses', tripId]);
  }
});
```

---

## 10. Testing Strategy

### E2E Tests (Playwright)

Test complete user flows across browser:

```typescript
// tests/auth.spec.ts
test('user can register and login', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### Layout Tests

Verify visual consistency:

```typescript
// tests/layout.spec.ts
test('sidebar is above hero section', async ({ page }) => {
  await page.goto('/dashboard');

  const sidebar = page.locator('[data-testid="sidebar"]');
  const hero = page.locator('[data-testid="hero"]');

  // Get z-index values
  const sidebarZ = await sidebar.evaluate(el =>
    getComputedStyle(el).zIndex
  );
  const heroZ = await hero.evaluate(el =>
    getComputedStyle(el).zIndex
  );

  expect(Number(sidebarZ)).toBeGreaterThan(Number(heroZ));
});
```

### Backend Unit Tests (Jest)

Test business logic in isolation:

```typescript
// backend/src/__tests__/expenses.test.ts
describe('calculateEqualSplits', () => {
  it('handles remainder correctly', () => {
    const result = calculateEqualSplits(100, ['user1', 'user2', 'user3']);

    expect(result[0].amount).toBe(33.33);
    expect(result[1].amount).toBe(33.33);
    expect(result[2].amount).toBe(33.34);  // Absorbs remainder

    // Total should equal original amount
    const total = result.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(100);
  });
});
```

---

## 11. Key Algorithms & Data Structures

### 1. Sliding Window Rate Limiting

**Data Structure**: Redis Sorted Set (ZSET)
- Score = timestamp
- Value = request ID

**Algorithm**:
1. Remove all entries with score < (now - window)
2. Count remaining entries
3. If count < limit, add new entry with score = now
4. Expire key after window duration

**Time Complexity**: O(log n + m) where m = expired entries

### 2. Greedy Settlement Optimization

**Problem**: Minimize transactions to settle debts

**Data Structure**: Two priority queues (creditors, debtors)

**Algorithm**:
1. Separate users into creditors (owed money) and debtors (owe money)
2. Sort both by amount (descending)
3. Match largest debtor with largest creditor
4. Create settlement for min(debt, credit)
5. Update balances, remove settled parties
6. Repeat until both queues empty

**Time Complexity**: O(n log n) for sorting, O(n) for matching

### 3. Jaccard Similarity

**Formula**: |A ∩ B| / |A ∪ B|

**Implementation**:
```typescript
function jaccard(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

**Time Complexity**: O(n + m) where n, m are set sizes

### 4. Optimistic Locking (Version Check)

**Data Structure**: Timestamp field on each record

**Algorithm**:
1. Client fetches record, stores `updatedAt`
2. Client sends update with `clientUpdatedAt`
3. Server compares `clientUpdatedAt` with current `updatedAt`
4. If equal: update and set new `updatedAt = now()`
5. If different: reject with 409 Conflict

**Time Complexity**: O(1) - single comparison

---

## 12. Interview Talking Points

### Architecture Decisions

**Q: Why did you choose to separate auth state from server state?**

"Server state and client state have fundamentally different requirements. Server state needs caching, background refetching, and staleness tracking - React Query handles all of that. Auth state is simpler but needs to persist across sessions - Zustand with localStorage persistence is perfect for that. Mixing them would add unnecessary complexity."

**Q: Why Kysely instead of Prisma?**

"We hit a known Prisma bug (P1010) with PostgreSQL 14. Rather than downgrade or wait for a fix, we used Kysely for queries while keeping Prisma for schema definition. This gave us type-safe queries without the permission issues. We use prisma-kysely to auto-generate Kysely types from our Prisma schema, eliminating manual sync."

### Feature Implementations

**Q: How does your expense splitting handle rounding errors?**

"When splitting $100 among 3 people, you get $33.333... We round down to $33.33 for each person, then give the last person the remainder ($33.34). This ensures the total always equals the original amount. For percentage splits, we assign the remainder to whoever has the largest percentage."

**Q: How do you handle concurrent edits?**

"We use optimistic locking. When you fetch an item, you receive its `updatedAt` timestamp. When you save, you send that timestamp back. The server compares it with the current value - if they don't match, someone else edited it first, and you get a 409 Conflict error. The UI shows a message asking you to refresh."

### Real-Time Collaboration

**Q: How do real-time updates work?**

"We use Socket.IO with a Redis adapter. When a user joins a trip page, they're added to a 'room' for that trip. Any changes - new expenses, votes, itinerary updates - emit events to that room. All connected users receive the event and invalidate their React Query cache, triggering a refetch. This ensures everyone sees the same data."

**Q: How does this scale across multiple servers?**

"The Redis adapter. Without it, events emitted on Server A only reach clients connected to Server A. With Redis Pub/Sub, the event is published to a channel that all servers subscribe to. Every server receives it and broadcasts to their local clients."

### Security

**Q: Why two different tokens?**

"Access tokens are short-lived (15 minutes) and stored in memory - if stolen, damage is limited. Refresh tokens are long-lived (7 days) and stored in httpOnly cookies - JavaScript can't access them, preventing XSS theft. When the access token expires, the refresh token gets a new one. If someone steals your access token, they have 15 minutes max."

**Q: How do you prevent brute force login attempts?**

"Rate limiting. We track requests in a Redis sorted set with timestamps. For each IP, we count requests within a sliding 15-minute window. Login attempts are limited to 5 per window. If exceeded, we return 429 Too Many Requests. The sliding window prevents burst attacks at window boundaries."

### Problem Solving

**Q: What was the most challenging bug you fixed?**

"The Prisma P1010 error was particularly challenging because everything *looked* correct - permissions were set, queries worked in psql, yet Prisma failed. After researching, I found it was a known issue with PostgreSQL 14's stricter public schema permissions. The solution was migrating to Kysely for queries while keeping Prisma for schema definition, which required setting up type generation to maintain type safety."

**Q: How would you add multi-currency support?**

"The schema already has a `currency` field on expenses. For full support, I'd:
1. Add an exchange rate service (like Open Exchange Rates API)
2. Store exchange rate at time of expense creation (historical accuracy)
3. Calculate balances in a 'base currency' for the trip
4. Display amounts in original currency with conversion tooltip
5. Settlement suggestions would show equivalent amounts in both currencies"

---

## Quick Reference: Command Cheat Sheet

```bash
# Development
cd frontend && npm run dev    # Start frontend (port 3000)
cd backend && npm run dev     # Start backend (port 4000)

# Database
npx prisma studio             # Visual database browser
npx prisma generate           # Regenerate types
npx prisma db push            # Push schema changes

# Testing
npm run test                  # Run Playwright E2E tests (from root)
cd backend && npm run test    # Run Jest unit tests

# Build
npm run build                 # Build all
cd frontend && npm run build  # Build frontend only
cd backend && npm run build   # Compile TypeScript
```

---

*This document was generated from the Wanderlust codebase analysis. Last updated: February 2026.*
