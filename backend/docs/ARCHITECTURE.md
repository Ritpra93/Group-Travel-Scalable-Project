# Backend Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Why This Architecture?](#why-this-architecture)
3. [Project Structure](#project-structure)
4. [Request Lifecycle](#request-lifecycle)
5. [Layer Responsibilities](#layer-responsibilities)
6. [Module Anatomy](#module-anatomy)
7. [TypeScript and Type Safety](#typescript-and-type-safety)
8. [Database Layer](#database-layer)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Security Patterns](#security-patterns)

---

## Overview

This backend is built using a **modular, layered architecture** that separates concerns and makes the codebase maintainable, testable, and scalable. Think of it like building with LEGO blocks - each piece has a specific purpose and connects in predictable ways.

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js (web server)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod (runtime type checking)
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis (future use)

---

## Why This Architecture?

### The Problem Without Structure
Imagine writing all your code in one giant file:
```typescript
// ❌ BAD: Everything in one file
app.post('/users', (req, res) => {
  // Validate data? Check auth? Save to DB? Handle errors?
  // All mixed together = nightmare to maintain!
});
```

### Our Solution: Separation of Concerns
We split code into layers, where each layer has ONE job:
```typescript
// ✅ GOOD: Separated responsibilities
Route → Middleware → Controller → Service → Database
```

**Benefits:**
1. **Easier to understand**: Each file does one thing
2. **Easier to test**: Test each layer independently
3. **Easier to change**: Modify one layer without breaking others
4. **Easier to reuse**: Services can be called from multiple controllers

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts                 # Entry point - starts the server
│   ├── app.ts                    # Express app setup - middleware & routes
│   ├── config/
│   │   └── env.ts                # Environment variables (validated)
│   ├── middleware/
│   │   ├── authenticate.ts       # JWT authentication check
│   │   ├── errorHandler.ts      # Catches and formats errors
│   │   └── validateRequest.ts   # Zod schema validation
│   ├── modules/                  # Feature modules (auth, groups, etc.)
│   │   ├── auth/
│   │   │   ├── auth.types.ts    # Zod schemas + TypeScript types
│   │   │   ├── auth.service.ts  # Business logic (register, login, etc.)
│   │   │   ├── auth.controller.ts # HTTP handlers (req/res)
│   │   │   └── auth.routes.ts   # Route definitions
│   │   ├── groups/              # Same structure for groups
│   │   └── invitations/         # Same structure for invitations
│   ├── utils/
│   │   ├── errors.ts            # Custom error classes
│   │   ├── jwt.ts               # Token generation/verification
│   │   └── logger.ts            # Logging utility
│   └── types/
│       └── express.d.ts         # TypeScript augmentations
├── prisma/
│   └── schema.prisma            # Database schema definition
└── package.json
```

**Why This Structure?**
- **modules/**: Each feature is self-contained (easy to add/remove)
- **middleware/**: Reusable request interceptors
- **utils/**: Shared helper functions
- **config/**: Centralized configuration

---

## Request Lifecycle

Let's trace what happens when a user makes a request:

```
1. Client Request
   ↓
2. Express Receives Request
   ↓
3. Global Middleware (app.ts)
   - Body parser (JSON)
   - CORS
   - Logging
   ↓
4. Route Matching (routes.ts)
   - Express finds matching route
   ↓
5. Route-Specific Middleware
   - authenticate (check JWT)
   - validateRequest (check schema)
   - custom middleware (check permissions)
   ↓
6. Controller (controller.ts)
   - Parses request
   - Calls service
   - Formats response
   ↓
7. Service (service.ts)
   - Business logic
   - Database operations
   - Error handling
   ↓
8. Database (Prisma)
   - SQL queries
   - Returns data
   ↓
9. Response flows back up
   ↓
10. Error Handler (if error occurred)
    - Formats error
    - Logs error
    ↓
11. Client Receives Response
```

### Example Flow: User Login

**Request:** `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Flow:**
1. **Route** (`auth.routes.ts`): Matches `/api/auth/login`
2. **Middleware** (`validateRequest`): Validates email/password format
3. **Controller** (`auth.controller.ts`): Extracts email/password from `req.body`
4. **Service** (`auth.service.ts`):
   - Finds user in database
   - Compares password hash
   - Generates JWT tokens
5. **Response**: Returns tokens to client

---

## Layer Responsibilities

### 1. Types Layer (`*.types.ts`)
**Purpose**: Define data shapes and validation schemas

**What it does:**
- Zod schemas for runtime validation
- TypeScript types for compile-time type safety
- Input/output type definitions

**Example:**
```typescript
// Zod schema (validates at runtime)
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// TypeScript type (validates at compile time)
type LoginInput = z.infer<typeof loginSchema>;
```

**Why both Zod AND TypeScript?**
- **TypeScript**: Catches errors while you code (compile time)
- **Zod**: Catches errors from user input (runtime)

### 2. Service Layer (`*.service.ts`)
**Purpose**: Business logic and data operations

**What it does:**
- Database queries (via Prisma)
- Business rules enforcement
- Data transformations
- Throws errors for invalid states

**Example:**
```typescript
async function registerUser(data: RegisterInput) {
  // Business rule: Check if email exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  // Business logic: Hash password before saving
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Database operation
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword
    }
  });
}
```

**Why separate services?**
- Reusable: Multiple controllers can call the same service
- Testable: Easy to test business logic without HTTP
- Clean: Controllers stay thin and focused

### 3. Controller Layer (`*.controller.ts`)
**Purpose**: HTTP request/response handling

**What it does:**
- Extract data from request (body, params, query)
- Call appropriate service method
- Format response with proper status codes
- Handle errors and pass to error handler

**Example:**
```typescript
async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Parse and validate input
    const input = loginSchema.parse(req.body);

    // 2. Call service
    const result = await authService.login(input);

    // 3. Send response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    // 4. Pass errors to error handler
    next(error);
  }
}
```

**Why separate controllers?**
- HTTP concerns (status codes, headers) separate from business logic
- Easy to change response format without touching business logic
- Controllers are thin - just glue between HTTP and services

### 4. Routes Layer (`*.routes.ts`)
**Purpose**: Define API endpoints and middleware chains

**What it does:**
- Maps URLs to controller functions
- Applies middleware in correct order
- Defines HTTP methods (GET, POST, etc.)

**Example:**
```typescript
const router = express.Router();

router.post(
  '/login',
  validateRequest(loginSchema),  // 1st: Validate input
  authController.login            // 2nd: Handle request
);

router.get(
  '/profile',
  authenticate,                   // 1st: Check JWT
  authController.getProfile       // 2nd: Get user data
);
```

**Understanding Middleware Order:**
Middleware runs LEFT to RIGHT, top to bottom:
```typescript
router.post('/protected',
  middleware1,  // Runs first
  middleware2,  // Runs second
  controller    // Runs last
);
```

### 5. Middleware (`middleware/`)
**Purpose**: Reusable request interceptors

**Common Middleware:**
- **authenticate**: Verify JWT token, attach user to `req`
- **validateRequest**: Check request body against Zod schema
- **errorHandler**: Catch errors and format response
- **requireRole**: Check if user has required permission

**Middleware Pattern:**
```typescript
function myMiddleware(req, res, next) {
  // Do something with request

  if (somethingWrong) {
    return next(new Error('Something wrong')); // Stop and error
  }

  next(); // Continue to next middleware/controller
}
```

---

## Module Anatomy

Every feature module follows the same structure. Let's use `auth` as an example:

### File Structure
```
auth/
├── auth.types.ts       # Schemas and types
├── auth.service.ts     # Business logic
├── auth.controller.ts  # HTTP handlers
├── auth.routes.ts      # Route definitions
└── GUIDE.md           # Learning documentation
```

### Data Flow Within a Module

**Registration Example:**

1. **Client Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure123",
  "name": "John Doe"
}
```

2. **routes.ts** - Route matches:
```typescript
router.post('/register',
  validateRequest(registerSchema),  // Validate first
  authController.register           // Then handle
);
```

3. **middleware/validateRequest.ts** - Validates:
```typescript
// If invalid, returns 400 error automatically
// If valid, continues to controller
```

4. **controller.ts** - Handles request:
```typescript
async register(req, res, next) {
  const input = registerSchema.parse(req.body); // Type-safe!
  const user = await authService.register(input);
  res.status(201).json({ success: true, data: user });
}
```

5. **service.ts** - Business logic:
```typescript
async register(data) {
  // Check if email exists
  // Hash password
  // Create user in database
  // Return user data
}
```

6. **Prisma** - Database:
```typescript
prisma.user.create({ data: { ... } })
```

---

## TypeScript and Type Safety

### Why TypeScript?

**JavaScript (No Types):**
```javascript
// ❌ JavaScript - Error only found at runtime
function greet(user) {
  return `Hello, ${user.name}`;
}

greet({ email: 'test@example.com' }); // Crashes! No 'name' property
```

**TypeScript (With Types):**
```typescript
// ✅ TypeScript - Error found while coding
interface User {
  name: string;
  email: string;
}

function greet(user: User) {
  return `Hello, ${user.name}`;
}

greet({ email: 'test@example.com' }); // ⛔ TypeScript error: missing 'name'
```

### Our Type Safety Strategy

We use **two layers** of type safety:

#### Layer 1: Compile-Time (TypeScript)
Catches errors while you write code in your editor.

```typescript
// TypeScript knows what fields exist
type User = {
  id: string;
  email: string;
  name: string;
};

const user: User = {
  email: 'test@example.com'
  // ⛔ TypeScript error: missing 'id' and 'name'
};
```

#### Layer 2: Runtime (Zod)
Catches errors from external data (API requests, environment variables).

```typescript
import { z } from 'zod';

// Define shape
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Parse untrusted data
const data = userSchema.parse(req.body);
// If invalid, throws error automatically
// If valid, TypeScript knows the shape!
```

### Type Inference Magic

Zod can generate TypeScript types automatically:

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// This type is automatically inferred!
type LoginInput = z.infer<typeof loginSchema>;
// Equivalent to:
// type LoginInput = {
//   email: string;
//   password: string;
// }
```

**Why this is powerful:**
1. Define schema once (Zod)
2. Get runtime validation automatically
3. Get TypeScript types automatically
4. No duplicate definitions!

---

## Database Layer

We use **Prisma** as our ORM (Object-Relational Mapping) tool.

### What is an ORM?

**Without ORM (Raw SQL):**
```javascript
// ❌ Hard to write, error-prone, no type safety
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
const user = result.rows[0]; // What fields does this have? 🤷
```

**With ORM (Prisma):**
```typescript
// ✅ Easy to write, type-safe, auto-complete
const user = await prisma.user.findUnique({
  where: { email }
});
// TypeScript knows: user.id, user.email, user.name, etc.
```

### Prisma Schema

We define our database in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())

  // Relations
  groups    GroupMember[]
}
```

**What this generates:**
1. SQL migration to create table
2. TypeScript types for all models
3. Query functions with auto-complete

### Common Prisma Patterns

#### 1. Find One
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});
// Returns: User | null
```

#### 2. Find Many
```typescript
const users = await prisma.user.findMany({
  where: { name: { contains: 'John' } },
  take: 10,  // Limit to 10 results
  skip: 20   // Offset for pagination
});
// Returns: User[]
```

#### 3. Create
```typescript
const user = await prisma.user.create({
  data: {
    email: 'new@example.com',
    name: 'New User',
    password: hashedPassword
  }
});
```

#### 4. Update
```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Updated Name' }
});
```

#### 5. Delete
```typescript
await prisma.user.delete({
  where: { id: userId }
});
```

#### 6. Transactions
For operations that must succeed or fail together:

```typescript
await prisma.$transaction(async (tx) => {
  // Create group
  const group = await tx.group.create({ data: { ... } });

  // Add owner as member
  await tx.groupMember.create({ data: { ... } });

  // If any fails, both are rolled back
});
```

**Why transactions?**
Imagine creating a group but failing to add the owner - you'd have an ownerless group! Transactions prevent partial updates.

---

## Error Handling Strategy

### Custom Error Classes

We extend a base `AppError` class for all application errors:

```typescript
// Base error
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Specific errors
class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, message);
  }
}
```

**Why custom errors?**
- **Status codes**: Automatically set correct HTTP status
- **Type safety**: TypeScript knows which errors can be thrown
- **Consistency**: All errors formatted the same way

### Error Flow

1. **Service throws error:**
```typescript
if (!user) {
  throw new NotFoundError('User not found');
}
```

2. **Controller catches and passes to Express:**
```typescript
try {
  const user = await service.getUser(id);
  res.json(user);
} catch (error) {
  next(error); // Pass to error handler
}
```

3. **Error Handler formats response:**
```typescript
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      ...(isDevelopment && { stack: err.stack })
    }
  });
}
```

### Validation Errors (Zod)

Zod throws `ZodError` when validation fails:

```typescript
try {
  const data = schema.parse(req.body);
} catch (error) {
  if (error instanceof ZodError) {
    // Format Zod errors nicely
    return res.status(400).json({
      success: false,
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }
}
```

---

## Security Patterns

### 1. Password Hashing (bcrypt)

**Never store plain-text passwords!**

```typescript
import bcrypt from 'bcryptjs';

// Registration
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { password: hashedPassword }
});

// Login
const isValid = await bcrypt.compare(password, user.password);
```

**How bcrypt works:**
- **Salt**: Random data added to password
- **Rounds**: Number of hashing iterations (10 = 2^10 = 1024 iterations)
- **One-way**: Cannot reverse hash to get original password

### 2. JWT Authentication

**How it works:**

1. **User logs in** → Server creates JWT token
2. **Client stores token** (localStorage or cookie)
3. **Client sends token** with each request (Authorization header)
4. **Server verifies token** → Knows who the user is

**Token Structure:**
```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Algorithm
.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MTYyMzkwMjJ9  ← Data
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature
```

**Creating JWT:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id },           // Payload (data)
  process.env.JWT_SECRET,        // Secret key
  { expiresIn: '15m' }           // Expiration
);
```

**Verifying JWT:**
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Returns: { userId: '123', iat: 1616239022 }
```

### 3. Refresh Token Pattern

**Problem:** Short-lived access tokens (15 min) = user logs out frequently

**Solution:** Refresh tokens

- **Access Token**: Short-lived (15 min), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

**Flow:**
1. Login → Get both access + refresh tokens
2. Access token expires → Use refresh token to get new access token
3. Refresh token expires → Must login again

### 4. Environment Variables

**Never hardcode secrets!**

```typescript
// ❌ BAD
const secret = 'my-secret-key-123';

// ✅ GOOD
const secret = process.env.JWT_SECRET;
```

**Validation with Zod:**
```typescript
const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number)
});

// Parse and validate
const env = envSchema.parse(process.env);
// Now TypeScript knows env.JWT_SECRET is a string!
```

---

## Key Takeaways

1. **Separation of Concerns**: Each layer has ONE job
2. **Type Safety**: TypeScript + Zod = runtime + compile-time safety
3. **Modular**: Features are self-contained and reusable
4. **Secure**: Password hashing, JWT, input validation
5. **Maintainable**: Consistent patterns across all modules
6. **Testable**: Each layer can be tested independently

## Next Steps

Now that you understand the architecture, dive into specific modules:
- [Auth Module Guide](src/modules/auth/GUIDE.md) - Learn authentication patterns
- [Groups Module Guide](src/modules/groups/GUIDE.md) - Learn resource management
- [Invitations Module Guide](src/modules/invitations/GUIDE.md) - Learn invitation flows

---

**Questions to think about:**
1. Why do we separate services from controllers?
2. What's the difference between TypeScript types and Zod schemas?
3. Why do we use transactions for some database operations?
4. How does middleware ordering affect request handling?

Understanding these concepts will make you a much stronger backend developer! 🚀
