# Authentication Module Guide

## Table of Contents
1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [File-by-File Walkthrough](#file-by-file-walkthrough)
4. [TypeScript Features Explained](#typescript-features-explained)
5. [Design Patterns](#design-patterns)
6. [Security Deep Dive](#security-deep-dive)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing Guide](#testing-guide)
9. [Further Reading](#further-reading)

---

## Overview

The **Authentication Module** handles user registration, login, logout, and token refresh. It's the security foundation of your application - if this breaks, the whole app is compromised!

### What This Module Does
- ✅ **Register**: Create new user accounts with encrypted passwords
- ✅ **Login**: Verify credentials and issue JWT tokens
- ✅ **Logout**: Invalidate refresh tokens and blacklist them
- ✅ **Refresh**: Generate new access tokens when they expire
- ✅ **Get User**: Retrieve current authenticated user info

### Key Security Features
- **Password Hashing**: Passwords never stored in plain text (using bcrypt)
- **JWT Tokens**: Stateless authentication with signed tokens
- **Refresh Token Rotation**: Old refresh tokens invalidated after use
- **Token Blacklist**: Logged-out tokens can't be reused
- **Session Tracking**: Database tracks active user sessions

---

## Module Architecture

### File Structure
```
auth/
├── auth.types.ts       # Input validation schemas + TypeScript types
├── auth.service.ts     # Business logic (register, login, logout, etc.)
├── auth.controller.ts  # HTTP handlers (parse request, format response)
└── auth.routes.ts      # Route definitions (URL → Controller mapping)
```

### Data Flow Diagram

```
Client Request
    ↓
[auth.routes.ts]  ← Maps URL to handler
    ↓
[asyncHandler]    ← Wraps async functions (error handling)
    ↓
[auth.controller.ts]  ← Parse request, validate input
    ↓
[auth.service.ts]  ← Business logic + database operations
    ↓
[Prisma]  ← Database queries
    ↓
Response flows back up
```

**Example: User Login Flow**
```
POST /api/v1/auth/login
Body: { email: "user@example.com", password: "secret123" }
    ↓
routes.ts: router.post('/login', ...)
    ↓
controller.ts: Validate with loginSchema
    ↓
service.ts: Find user, compare password, generate tokens
    ↓
Response: { success: true, data: { user, tokens } }
```

---

## File-by-File Walkthrough

### File 1: `auth.types.ts` - Schemas and Types

This file defines **what data looks like** and **how to validate it**.

#### Complete Code
```typescript
import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  timezone: z.string().optional().default('UTC'),
  interests: z.array(z.string()).optional().default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

#### Explanation: What is Zod?

**Zod** is a **runtime validation** library. It checks data at runtime (when your app is running), not compile time.

**Why do we need it?**
```typescript
// Problem: TypeScript only checks at compile time
function register(data: { email: string }) {
  // TypeScript thinks data.email is a string
  // But what if a user sends: { email: 12345 }?
  // TypeScript can't catch this - it only checks your code, not user input!
}

// Solution: Zod validates at runtime
const schema = z.object({
  email: z.string().email()
});

const data = schema.parse(req.body);
// If invalid, throws ZodError
// If valid, TypeScript knows the shape!
```

#### Breaking Down the Schema

**Email Validation:**
```typescript
email: z.string().email('Invalid email address')
```
- `z.string()` - Must be a string
- `.email()` - Must match email format (has @ and domain)
- `'Invalid email address'` - Custom error message if validation fails

**Password Validation:**
```typescript
password: z.string().min(8, 'Password must be at least 8 characters')
```
- Requires minimum 8 characters
- Note: Additional password strength validation happens in the service layer (checks for numbers, special chars, etc.)

**Optional Fields:**
```typescript
timezone: z.string().optional().default('UTC')
```
- `.optional()` - Field is not required
- `.default('UTC')` - If not provided, use 'UTC'
- Result: `timezone` is always a string, never undefined

**Array Fields:**
```typescript
interests: z.array(z.string()).optional().default([])
```
- `z.array(z.string())` - Array where each item is a string
- If not provided, defaults to empty array `[]`

#### Type Inference Magic

This is where TypeScript becomes powerful:

```typescript
export type RegisterInput = z.infer<typeof registerSchema>;
```

**What does `z.infer` do?**
It **automatically generates** a TypeScript type from the Zod schema:

```typescript
// Zod schema (runtime validation)
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
});

// TypeScript type (compile-time checking)
// This is automatically generated!
type RegisterInput = {
  email: string;
  password: string;
  name: string;
  timezone: string;  // Has default, so always present
  interests: string[];  // Has default, so always present
};
```

**Why is this powerful?**
1. **Single source of truth**: Define validation rules once
2. **No duplication**: Don't write types separately
3. **Always in sync**: If schema changes, type changes automatically

#### Login Schema

```typescript
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

**Why is password validation different here?**
- Registration: `.min(8)` - Enforce strong password
- Login: `.min(1)` - Just check it's not empty
- Reason: Existing users might have passwords from before we added the 8-char rule

#### Refresh Token Schema

```typescript
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
```

Simple validation - just checks a token was provided.

#### Response Types (Interfaces)

```typescript
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    timezone: string;
    interests: string[];
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}
```

**Why use `interface` instead of Zod here?**
- This is a **response type** (data we send OUT)
- We don't need to validate our own responses
- Simpler to write as plain TypeScript interface

**TypeScript Feature: Union Type with `null`**
```typescript
avatarUrl: string | null
```
- `|` means "OR"
- `string | null` means "either a string OR null"
- TypeScript will force you to handle both cases:
```typescript
// ❌ Error: avatarUrl might be null
const length = user.avatarUrl.length;

// ✅ Correct: Check if null first
const length = user.avatarUrl?.length ?? 0;
```

---

### File 2: `auth.service.ts` - Business Logic

This is where the **real work happens**: database operations, password hashing, token generation.

#### Class-Based Service Pattern

```typescript
export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Implementation
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Implementation
  }
}

export const authService = new AuthService();
```

**Why a class?**
- **Encapsulation**: Related methods grouped together
- **Testability**: Easy to mock for testing
- **Singleton pattern**: Create one instance, export it

**TypeScript Feature: Async Methods**
```typescript
async register(input: RegisterInput): Promise<AuthResponse>
```
- `async` - Function returns a Promise
- `Promise<AuthResponse>` - Promise that resolves to AuthResponse
- Inside async functions, you can use `await`

#### Register Method Deep Dive

**Step 1: Password Strength Validation**
```typescript
const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.valid) {
  throw new ValidationError('Password does not meet requirements', {
    errors: passwordValidation.errors,
  });
}
```

**Why validate password strength separately?**
- Zod checks minimum length (8 chars)
- This checks complexity: uppercase, lowercase, numbers, special chars
- More detailed error messages possible

**Step 2: Check if Email Exists**
```typescript
const existingUser = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
});

if (existingUser) {
  throw new ConflictError('Email already registered');
}
```

**Prisma Pattern: `findUnique`**
- Searches for ONE record by unique field (email)
- Returns: `User | null` (either found or not)
- `where: { email }` - Find by this criteria

**Why toLowerCase()?**
- Emails are case-insensitive: `User@Example.com` = `user@example.com`
- Always store lowercase to prevent duplicates

**Custom Error Classes:**
```typescript
throw new ConflictError('Email already registered');
```
- `ConflictError` - Custom error class with statusCode 409
- Extends `AppError` base class
- Controller will catch this and send proper HTTP response

**Step 3: Hash Password**
```typescript
const passwordHash = await hashPassword(password);
```

**What is password hashing?**
```
Plain password: "secret123"
    ↓ (bcrypt.hash)
Hashed: "$2a$10$N9qo8uLOickgx2ZMRZoMye..."

// Cannot reverse! "secret123" ← ❌ Cannot get back
```

**Why hash?**
- If database is leaked, hackers can't see passwords
- One-way function: Can't reverse hash to get password
- Each hash is unique (due to salt)

**Step 4: Create User in Database**
```typescript
const user = await prisma.user.create({
  data: {
    email: email.toLowerCase(),
    passwordHash,
    name,
    timezone: timezone || 'UTC',
    interests: interests || [],
  },
  select: {
    id: true,
    email: true,
    name: true,
    avatarUrl: true,
    timezone: true,
    interests: true,
    createdAt: true,
  },
});
```

**Prisma Pattern: `create`**
- Creates a new database record
- `data: { ... }` - The data to insert
- `select: { ... }` - Which fields to return

**Why use `select`?**
```typescript
// ❌ Without select - returns EVERYTHING including passwordHash
const user = await prisma.user.create({ data });

// ✅ With select - only returns safe fields
const user = await prisma.user.create({
  data,
  select: { id: true, email: true }  // No password!
});
```

**TypeScript Feature: Object Shorthand**
```typescript
// When variable name = key name
const data = {
  email: email,      // Old way
  name: name,
  passwordHash: passwordHash
};

// Shorthand
const data = {
  email,             // Same as email: email
  name,
  passwordHash
};
```

**Step 5: Generate JWT Tokens**
```typescript
const tokens = generateTokenPair(user.id, user.email);
```

This creates TWO tokens:
1. **Access Token** (15 minutes) - Used for API requests
2. **Refresh Token** (7 days) - Used to get new access tokens

**Step 6: Create Session Record**
```typescript
await prisma.session.create({
  data: {
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
});
```

**Why store refresh tokens in database?**
- Allows logout (delete session)
- Track active sessions per user
- Can revoke all sessions if account compromised

**Date Calculation Breakdown:**
```typescript
7 * 24 * 60 * 60 * 1000
↑   ↑   ↑   ↑    ↑
7   24  60  60   1000
days hrs min sec  ms

7 days = 604,800,000 milliseconds
```

**Step 7: Logging**
```typescript
logAuth('register', user.id, true);
logEvent('user_registered', { userId: user.id, email: user.email });
```

**Why log?**
- Security audit trail
- Debug issues in production
- Monitor suspicious activity

**Step 8: Return Response**
```typescript
return {
  user,
  tokens,
};
```

Returns object matching `AuthResponse` type.

#### Login Method Deep Dive

**Step 1: Find User**
```typescript
const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
});

if (!user) {
  throw new UnauthorizedError('Invalid email or password');
}
```

**Security Note: Vague Error Messages**
- Don't say "Email not found" - reveals if email exists
- Don't say "Wrong password" - reveals email exists
- Say "Invalid email or password" - Ambiguous!

**Step 2: Verify Password**
```typescript
const isValidPassword = await comparePassword(password, user.passwordHash);

if (!isValidPassword) {
  throw new UnauthorizedError('Invalid email or password');
}
```

**How does bcrypt compare work?**
```typescript
// User enters: "secret123"
// Database has: "$2a$10$N9qo8uLOickgx2ZMRZoMye..."

await bcrypt.compare("secret123", "$2a$10$...");
// bcrypt hashes "secret123" with same salt
// Compares hashes
// Returns true if match, false otherwise
```

**Step 3-5: Generate Tokens, Create Session**
Same as registration.

**Step 6: Update Last Login**
```typescript
await prisma.user.update({
  where: { id: user.id },
  data: { lastLoginAt: new Date() },
});
```

Tracks when user last logged in (useful for analytics).

**Step 7: Remove Password from Response**
```typescript
const { passwordHash: _, ...userWithoutPassword } = user;

return {
  user: userWithoutPassword,
  tokens,
};
```

**TypeScript Feature: Destructuring with Rest**
```typescript
const { passwordHash: _, ...rest } = user;
//       ↑              ↑   ↑
//       Extract this   Rename to _   Everything else goes here
//                      (convention for "unused")
```

**Result:**
```typescript
// user object has:
{ id: '1', email: 'test@example.com', passwordHash: '$2a$...' }

// userWithoutPassword has:
{ id: '1', email: 'test@example.com' }
// No passwordHash!
```

**Why use `_` for variable name?**
- Convention: "I don't plan to use this variable"
- Linters won't complain about unused variables named `_`

#### Logout Method Deep Dive

**Step 1: Verify Token**
```typescript
const payload = verifyRefreshToken(refreshToken);
```

Decodes JWT and verifies signature. If invalid, throws error.

**Step 2: Delete Session**
```typescript
await prisma.session.deleteMany({
  where: {
    token: refreshToken,
    userId: payload.userId,
  },
});
```

**Prisma Pattern: `deleteMany`**
- Deletes all records matching criteria
- Why not `delete`? Because session table doesn't have token as unique/primary key

**Step 3: Blacklist Token in Redis**
```typescript
await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);
```

**Why blacklist?**
- JWT tokens are **stateless** - server doesn't track them
- Even if session deleted, token is still valid until expiration
- Blacklist in Redis: Fast lookup to check if token was revoked

**Redis TTL (Time To Live):**
- Token expires in 7 days anyway
- No need to keep in blacklist forever
- TTL = 7 days in seconds

**Step 4: Error Handling**
```typescript
catch (error) {
  // If token is invalid, still succeed (idempotent logout)
}
```

**What is idempotent?**
- Calling operation multiple times = same result as calling once
- Logout twice → Same outcome as logout once
- Even if token invalid, don't throw error (already logged out)

#### Refresh Tokens Method Deep Dive

**Step 1-3: Verify Token, Check Blacklist, Find Session**
```typescript
const payload = verifyRefreshToken(refreshToken);

const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
if (isBlacklisted) {
  throw new UnauthorizedError('Token has been revoked');
}

const session = await prisma.session.findFirst({
  where: {
    token: refreshToken,
    userId: payload.userId,
    expiresAt: { gt: new Date() },  // Greater than now
  },
});
```

**Prisma Feature: Query Operators**
```typescript
expiresAt: { gt: new Date() }
```
- `gt` = Greater Than
- Only find sessions that haven't expired yet
- Other operators: `lt` (less than), `gte` (≥), `lte` (≤), `not`, `in`, etc.

**Step 4: Generate New Tokens**
```typescript
const tokens = generateTokenPair(user.id, user.email);
```

**Step 5: Update Session with New Refresh Token**
```typescript
await prisma.session.update({
  where: { id: session.id },
  data: {
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsedAt: new Date(),
  },
});
```

**Refresh Token Rotation:**
- Old refresh token → Invalid
- New refresh token → Valid
- Security: If old token is reused, we know it's suspicious (token was stolen)

**Step 6: Blacklist Old Token**
```typescript
await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);
```

Prevents old refresh token from being used again.

---

### File 3: `auth.controller.ts` - HTTP Handlers

Controllers are the **glue** between HTTP requests and services.

#### Controller Class Pattern

```typescript
export class AuthController {
  async register(
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    // Implementation
  }
}

export const authController = new AuthController();
```

**TypeScript Feature: Generics in Response**
```typescript
res: Response<ApiResponse<AuthResponse>>
```

**Breaking it down:**
- `Response<T>` - Express response with type T
- `ApiResponse<T>` - Our API response wrapper
- `ApiResponse<AuthResponse>` - API response containing AuthResponse

**What does this look like?**
```typescript
// ApiResponse<T> structure
{
  success: boolean,
  data?: T,
  error?: { message: string }
}

// ApiResponse<AuthResponse> means:
{
  success: true,
  data: {
    user: { ... },
    tokens: { ... }
  }
}
```

**Why type the response?**
```typescript
// ✅ TypeScript knows what you can send
res.json({
  success: true,
  data: result  // Must match AuthResponse!
});

// ❌ TypeScript error
res.json({
  success: true,
  wrongField: result  // Error: wrongField not in ApiResponse
});
```

#### Register Controller Method

```typescript
async register(req, res, next) {
  try {
    // 1. Validate input
    const validatedData = registerSchema.parse(req.body);

    // 2. Call service
    const result = await authService.register(validatedData);

    // 3. Send response
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      next(new ValidationError('Invalid input', error));
    } else {
      next(error);
    }
  }
}
```

**Step 1: Zod Validation**
```typescript
const validatedData = registerSchema.parse(req.body);
```

**What `parse` does:**
- If valid: Returns typed data
- If invalid: Throws `ZodError`

**Type Safety After Parsing:**
```typescript
// Before parsing
req.body  // Type: any (could be anything!)

// After parsing
validatedData  // Type: RegisterInput (guaranteed shape!)
```

**Step 2: Call Service**
```typescript
const result = await authService.register(validatedData);
```

Simple delegation to service layer.

**Step 3: Send Response**
```typescript
res.status(201).json({
  success: true,
  data: result,
});
```

**HTTP Status Codes:**
- `200` - OK (general success)
- `201` - Created (resource created successfully)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

**Why 201 for register?**
- We created a new user resource
- Standard REST convention

**Step 4: Error Handling**
```typescript
catch (error) {
  if (error instanceof Error && error.name === 'ZodError') {
    next(new ValidationError('Invalid input', error));
  } else {
    next(error);
  }
}
```

**TypeScript Feature: `instanceof` Type Guard**
```typescript
if (error instanceof Error)
```
- Checks if error is an instance of Error class
- After this check, TypeScript knows `error.name` exists

**Error Flow:**
1. If Zod error → Wrap in ValidationError (400 status)
2. Otherwise → Pass to Express error handler
3. `next(error)` → Sends to `errorHandler` middleware

#### Me (Get Current User) Method

```typescript
async me(req, res, next) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { passwordHash: _, ...userWithoutPassword } = req.user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
}
```

**Where does `req.user` come from?**
- `authenticate` middleware runs before this controller
- Middleware verifies JWT and attaches user to request
- If JWT invalid, middleware returns 401 before reaching controller

**TypeScript Augmentation:**
```typescript
// In types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: User;  // Add user property to Request
    }
  }
}
```

This tells TypeScript that `req.user` can exist.

---

### File 4: `auth.routes.ts` - Route Definitions

Routes **map URLs to controller methods** and apply middleware.

#### Complete Code Walkthrough

```typescript
import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';

const router = Router();

router.post('/register', asyncHandler(authController.register.bind(authController)));
```

**Express Router:**
- Mini-app that handles routes
- Can be mounted at a path (e.g., `/api/v1/auth`)
- `router.post()` - Handle POST requests
- `router.get()` - Handle GET requests
- etc.

**asyncHandler Middleware:**
```typescript
asyncHandler(authController.register.bind(authController))
```

**What does asyncHandler do?**
```typescript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);  // Automatically pass errors to next()
  };
}
```

**Without asyncHandler:**
```typescript
router.post('/register', async (req, res, next) => {
  try {
    await authController.register(req, res, next);
  } catch (error) {
    next(error);  // Must manually catch
  }
});
```

**With asyncHandler:**
```typescript
router.post('/register', asyncHandler(authController.register));
// Automatically wraps in try-catch!
```

**TypeScript/JavaScript: `.bind()` Explained**
```typescript
authController.register.bind(authController)
```

**Why is this needed?**

JavaScript classes have `this` context issues:
```typescript
const method = authController.register;
method();  // ❌ Error: 'this' is undefined inside method
```

`.bind()` fixes this:
```typescript
const method = authController.register.bind(authController);
method();  // ✅ 'this' refers to authController
```

**Alternative without bind:**
```typescript
router.post('/register', asyncHandler((req, res, next) =>
  authController.register(req, res, next)
));
```

Arrow functions preserve `this` context.

#### Route Documentation

```typescript
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));
```

**JSDoc Comments:**
- Documenting routes for other developers
- Some tools can generate API docs from these comments

**Access Levels:**
- **Public** - Anyone can call (no authentication)
- **Private** - Must be authenticated (JWT required)
- **Admin** - Must be admin user

---

## TypeScript Features Explained

### 1. Type Inference with Zod

```typescript
const schema = z.object({ name: z.string() });
type Inferred = z.infer<typeof schema>;
// Automatically becomes: { name: string }
```

### 2. Generics

```typescript
Promise<AuthResponse>
Response<ApiResponse<AuthResponse>>
```

**What are generics?**
Think of them like **function parameters for types**:

```typescript
// Regular function with parameter
function wrap(value: string): { data: string } {
  return { data: value };
}

// Generic function - works with ANY type
function wrap<T>(value: T): { data: T } {
  return { data: value };
}

wrap<string>("hello");   // Returns { data: string }
wrap<number>(42);        // Returns { data: number }
```

### 3. Async/Await

```typescript
// Old way (Promises)
function login(data) {
  return prisma.user.findUnique({ where: { email: data.email } })
    .then(user => {
      return comparePassword(data.password, user.password);
    })
    .then(isValid => {
      if (isValid) {
        return generateTokens();
      }
    });
}

// New way (async/await)
async function login(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const isValid = await comparePassword(data.password, user.password);
  if (isValid) {
    return generateTokens();
  }
}
```

**Benefits:**
- Reads like synchronous code
- Easier error handling with try-catch
- No callback hell

### 4. Optional Chaining and Nullish Coalescing

```typescript
// Optional chaining (?.)
const length = user?.profile?.bio?.length;
// Only access if each level exists
// If any is null/undefined, returns undefined

// Nullish coalescing (??)
const name = user.name ?? 'Anonymous';
// Use left side unless it's null/undefined
// Then use right side
```

### 5. Destructuring

```typescript
// Object destructuring
const { email, password } = req.body;
// Instead of: req.body.email, req.body.password

// With rest operator
const { passwordHash, ...safeUser } = user;
// safeUser has everything EXCEPT passwordHash

// With renaming
const { passwordHash: _, ...safeUser } = user;
// Extract passwordHash, rename to _, rest goes to safeUser
```

### 6. Type Guards

```typescript
if (error instanceof ZodError) {
  // TypeScript knows error is ZodError here
  error.errors  // ✅ TypeScript knows this exists
}
```

---

## Design Patterns

### 1. Service Layer Pattern

**Separation of Concerns:**
- **Controller**: HTTP (parse request, format response)
- **Service**: Business logic (validation, database, auth)
- **Repository**: Database access (Prisma acts as this)

**Benefits:**
- Testable: Test service without HTTP
- Reusable: Multiple controllers can call same service
- Maintainable: Change business logic without touching controllers

### 2. Dependency Injection (Basic)

```typescript
// Service is injected via import
import { authService } from './auth.service';

// Controller uses injected service
authController.register = async (req, res) => {
  const result = await authService.register(data);
};
```

**Why?**
- Easy to mock in tests
- Loose coupling
- Can swap implementations

### 3. Repository Pattern (via Prisma)

```typescript
// Instead of writing SQL:
const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

// Prisma provides repository-like interface:
const user = await prisma.user.findUnique({ where: { id } });
```

### 4. DTO Pattern (Data Transfer Objects)

Our Zod schemas act as DTOs:
```typescript
// RegisterInput is a DTO
type RegisterInput = {
  email: string;
  password: string;
  // ...
}

// Transforms to database model (different shape)
prisma.user.create({
  data: {
    email,
    passwordHash,  // password → passwordHash
    // ...
  }
});
```

### 5. Error Handling Pattern

```typescript
// Service throws semantic errors
throw new UnauthorizedError('Invalid credentials');

// Controller catches and passes to middleware
catch (error) {
  next(error);
}

// Middleware handles error response
errorHandler(err, req, res, next) {
  res.status(err.statusCode).json({ error: err.message });
}
```

---

## Security Deep Dive

### 1. Password Security

**Hashing Algorithm: bcrypt**
```typescript
const hash = await bcrypt.hash(password, 10);
//                                         ↑
//                                         Salt rounds
```

**What is a salt?**
```
Password: "secret123"
Random salt: "x8F2n9Pk"
Combined: "secret123x8F2n9Pk"
Hash result: "$2a$10$N9qo8..."

// Same password, different salt = different hash!
Password: "secret123"
Random salt: "a1B2c3D4"
Combined: "secret123a1B2c3D4"
Hash result: "$2a$10$M8pz9..." ← Different!
```

**Why salt?**
- Prevents rainbow table attacks
- Same password = different hashes across users
- Attacker can't pre-compute hashes

**Salt Rounds (10):**
- 10 rounds = 2^10 = 1024 iterations
- More rounds = slower but more secure
- 10 is good balance for 2024

### 2. JWT Token Security

**Token Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  ← Header (algorithm)
eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MTYyMzl9.  ← Payload (data)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "123",
  "email": "user@example.com",
  "iat": 1616239022,
  "exp": 1616239922
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

**Security Properties:**
- **Tamper-proof**: Changing payload invalidates signature
- **Verifiable**: Server can verify signature with secret
- **Stateless**: No database lookup needed
- **NOT encrypted**: Don't put sensitive data in payload (it's base64, not encrypted!)

**Why two tokens? (Access + Refresh)**

**Problem with single long-lived token:**
- If stolen, attacker has access for weeks
- Can't revoke without database lookup (defeats stateless purpose)

**Solution: Dual token system:**
- **Access token**: Short-lived (15 min), used for every request
- **Refresh token**: Long-lived (7 days), stored in database, can be revoked

**Flow:**
```
1. Login → Get both tokens
2. API requests → Use access token
3. Access token expires (15 min later)
4. Use refresh token → Get new access token
5. Continue making requests
6. Refresh token expires (7 days later) → Must login again
```

**Benefits:**
- Access token stolen? Only works for 15 minutes
- Refresh token stolen? Can be revoked in database
- Logout? Delete refresh token from database

### 3. Token Blacklist (Redis)

**Why Redis?**
- In-memory → Extremely fast
- TTL support → Automatic cleanup
- Simple key-value → Perfect for "is token blacklisted?" checks

**Blacklist Flow:**
```typescript
// On logout
await redis.set(`blacklist:${token}`, true, 'EX', 7 * 24 * 60 * 60);

// On request
const isBlacklisted = await redis.get(`blacklist:${token}`);
if (isBlacklisted) {
  throw new UnauthorizedError('Token revoked');
}
```

### 4. SQL Injection Prevention

**How Prisma prevents SQL injection:**
```typescript
// ❌ Vulnerable (raw SQL concatenation)
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
// If email = "'; DROP TABLE users; --"
// Query becomes: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'

// ✅ Safe (Prisma parameterized queries)
const user = await prisma.user.findUnique({
  where: { email }
});
// Prisma escapes inputs automatically
```

Prisma uses **prepared statements** - inputs are never directly concatenated into SQL.

### 5. Rate Limiting (Not Implemented Yet)

**TODO: Add rate limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 requests per window
  message: 'Too many login attempts'
});

router.post('/login', loginLimiter, authController.login);
```

Prevents brute-force attacks on login endpoint.

---

## Common Pitfalls

### 1. Forgetting to await

```typescript
// ❌ Bug: Doesn't wait for password comparison
async function login(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const isValid = comparePassword(data.password, user.passwordHash);
  // isValid is a Promise! Not true/false!
  if (isValid) {  // Always truthy (Promise object)
    // Always executes!
  }
}

// ✅ Correct: Await the comparison
const isValid = await comparePassword(data.password, user.passwordHash);
```

### 2. Exposing Password Hash

```typescript
// ❌ Sending password hash to client
return { user };

// ✅ Remove password hash
const { passwordHash: _, ...safeUser } = user;
return { user: safeUser };
```

### 3. Not Lowercasing Emails

```typescript
// ❌ Case-sensitive emails
const user = await prisma.user.findUnique({ where: { email } });
// User@Example.com ≠ user@example.com (both can register!)

// ✅ Always lowercase
const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() }
});
```

### 4. Vague vs. Specific Error Messages

```typescript
// ❌ Security risk: Reveals if email exists
if (!user) throw new Error('Email not found');
if (!isValidPassword) throw new Error('Invalid password');

// ✅ Secure: Vague error message
if (!user || !isValidPassword) {
  throw new UnauthorizedError('Invalid email or password');
}
```

### 5. Forgetting to Bind Controller Methods

```typescript
// ❌ 'this' will be undefined
router.post('/login', authController.login);

// ✅ Bind the context
router.post('/login', authController.login.bind(authController));

// ✅ Alternative: Arrow function
router.post('/login', (req, res, next) =>
  authController.login(req, res, next)
);
```

### 6. Not Validating Environment Variables

```typescript
// ❌ Crashes at runtime if JWT_SECRET missing
const secret = process.env.JWT_SECRET;

// ✅ Validate on startup with Zod
const envSchema = z.object({
  JWT_SECRET: z.string().min(32)
});

const env = envSchema.parse(process.env);
```

---

## Testing Guide

### Unit Testing Services

```typescript
import { authService } from './auth.service';
import { prismaMock } from '../../../test/prismaMock';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '1',
        email: input.email,
        name: input.name,
        // ...
      });

      const result = await authService.register(input);

      expect(result.user.email).toBe(input.email);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw ConflictError if email exists', async () => {
      const input = { email: 'existing@example.com', password: 'pass', name: 'Test' };

      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: input.email
      });

      await expect(authService.register(input))
        .rejects
        .toThrow(ConflictError);
    });
  });
});
```

### Integration Testing Routes

```typescript
import request from 'supertest';
import app from '../../../app';

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## Further Reading

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Node.js & Express
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Zod
- [Zod Documentation](https://zod.dev/)
- [Zod Tutorial](https://www.totaltypescript.com/tutorials/zod)

### Prisma
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [bcrypt Explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

---

## Summary

The Authentication module demonstrates:
1. **Type Safety**: Zod + TypeScript for bulletproof validation
2. **Separation of Concerns**: Types → Service → Controller → Routes
3. **Security**: Password hashing, JWT tokens, refresh token rotation
4. **Error Handling**: Custom errors with proper HTTP status codes
5. **Async Patterns**: Promises, async/await, error propagation
6. **Database**: Prisma ORM for type-safe queries
7. **Best Practices**: Logging, session tracking, token blacklisting

Master this module, and you'll understand the foundation of most modern backend applications! 🚀
