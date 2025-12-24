# Groups Module Guide

## Table of Contents
1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [File Walkthrough: groups.types.ts](#file-walkthrough-groupstypests)
4. [File Walkthrough: groups.middleware.ts](#file-walkthrough-groupsmiddlewarets)
5. [Advanced TypeScript Features](#advanced-typescript-features)
6. [Middleware Patterns](#middleware-patterns)
7. [Validation Patterns](#validation-patterns)
8. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
9. [Common Pitfalls](#common-pitfalls)
10. [Testing Guide](#testing-guide)

---

## Overview

The **Groups Module** manages travel groups - collections of users planning trips together. Think of it as creating a workspace where friends can collaborate on trip planning.

### What This Module Does
- ✅ **Create Groups**: Set up new travel planning groups
- ✅ **Manage Members**: Add/remove users, assign roles
- ✅ **Control Access**: Role-based permissions (OWNER, ADMIN, MEMBER, VIEWER)
- ✅ **Update Groups**: Modify group details and settings
- ✅ **List Groups**: View all groups a user belongs to
- ✅ **Delete Groups**: Remove groups and all associated data

### Role Hierarchy
```
OWNER    ← Highest permissions (group creator, can't be changed)
  ↓
ADMIN    ← Can manage members and settings
  ↓
MEMBER   ← Can view and participate
  ↓
VIEWER   ← Read-only access (lowest permissions)
```

---

## Module Architecture

### File Structure
```
groups/
├── groups.types.ts       # ✅ DONE: Validation schemas + types
├── groups.middleware.ts  # ✅ DONE: Authorization checks
├── groups.service.ts     # ⏳ NEXT: Business logic
├── groups.controller.ts  # ⏳ NEXT: HTTP handlers
└── groups.routes.ts      # ⏳ NEXT: Route definitions
```

### Request Flow for Creating a Group

```
POST /api/v1/groups
Body: { name: "Europe 2025", description: "Summer trip", isPrivate: true }
    ↓
[auth middleware] ← Verify JWT, get user
    ↓
[validateRequest(createGroupSchema)] ← Validate input
    ↓
[groups.controller.ts] ← Parse request
    ↓
[groups.service.ts] ← Transaction: Create group + Add creator as OWNER
    ↓
[Prisma] ← Database operations
    ↓
Response: { success: true, data: { group } }
```

---

## File Walkthrough: groups.types.ts

This file defines **all data shapes and validation rules** for the Groups module.

### Part 1: Create Group Schema

```typescript
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  // ...
});
```

#### Breaking Down the Validation

**String Transformations:**
```typescript
.trim()
```
- **What it does**: Removes whitespace from start/end
- **Why**: Users might accidentally type " Europe 2025 " (with spaces)
- **Result**: Stored as "Europe 2025"

**Example:**
```typescript
// User input
{ name: "  My Group  " }

// After .trim()
{ name: "My Group" }
```

**Length Validation:**
```typescript
.min(3, 'Group name must be at least 3 characters')
.max(100, 'Group name must not exceed 100 characters')
```

**Why these limits?**
- **min(3)**: Prevents names like "ab" or "x" (too short to be meaningful)
- **max(100)**: Prevents database issues and ensures UI displays properly

**Optional Fields:**
```typescript
description: z
  .string()
  .max(500, 'Description must not exceed 500 characters')
  .trim()
  .optional(),
```

**What `.optional()` means:**
- Field doesn't have to be provided
- Can be omitted entirely from request body
- TypeScript type: `string | undefined`

**Example valid requests:**
```typescript
// With description
{ name: "Europe Trip", description: "Summer vacation" }

// Without description
{ name: "Europe Trip" }
```

**Default Values:**
```typescript
isPrivate: z
  .boolean()
  .optional()
  .default(true),
```

**How defaults work:**
```typescript
// User sends
{ name: "Europe Trip" }

// After parsing with default
{
  name: "Europe Trip",
  isPrivate: true  // ← Automatically added!
}
```

**Why default to `true`?**
- Safety: Groups are private by default
- User must explicitly make them public
- Prevents accidental data leaks

**JSON Settings Field:**
```typescript
settings: z
  .record(z.unknown())  // JSON object with any key-value pairs
  .optional(),
```

#### Understanding `z.record()`

**What is `record`?**
A `record` is TypeScript's way of saying "object with string keys and values of a specific type."

```typescript
// z.record(z.string()) means:
{
  [key: string]: string
}

// Example:
{
  "theme": "dark",
  "language": "en"
}

// z.record(z.unknown()) means:
{
  [key: string]: unknown  // Any value type!
}

// Example:
{
  "notifications": true,
  "maxMembers": 50,
  "tags": ["travel", "europe"]
}
```

**Why `unknown` instead of `any`?**
```typescript
// 'any' - disables type checking (dangerous!)
const value: any = settings.something;
value.anything.goes.here;  // No errors, but crashes at runtime!

// 'unknown' - forces you to check type first (safe!)
const value: unknown = settings.something;
value.toUpperCase();  // ❌ TypeScript error: unknown might not have toUpperCase
if (typeof value === 'string') {
  value.toUpperCase();  // ✅ OK, we checked it's a string
}
```

**Type Inference:**
```typescript
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
```

**What type is generated?**
```typescript
type CreateGroupInput = {
  name: string;
  description?: string;  // Optional
  imageUrl?: string;     // Optional
  isPrivate: boolean;    // Has default, always present after parsing
  settings?: Record<string, unknown>;  // Optional
}
```

### Part 2: Update Group Schema

```typescript
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(100)
    .trim()
    .optional(),  // ← All fields optional for partial updates
  description: z
    .string()
    .max(500)
    .trim()
    .nullable()   // ← Can be set to null to clear
    .optional(),  // ← Can be omitted
  // ...
});
```

#### Understanding `.nullable()` vs `.optional()`

This is a common source of confusion! Let's clarify:

**`.optional()` - Field can be omitted**
```typescript
description: z.string().optional()

// Valid:
{}                            // Field not sent
{ description: "Hello" }      // Field sent

// Invalid:
{ description: null }         // ❌ null not allowed
```

**`.nullable()` - Field can be null**
```typescript
description: z.string().nullable()

// Valid:
{ description: "Hello" }      // String value
{ description: null }         // Null value

// Invalid:
{}                            // ❌ Field is required
```

**`.nullable().optional()` - Field can be omitted OR null**
```typescript
description: z.string().nullable().optional()

// All valid:
{}                            // Omitted
{ description: "Hello" }      // String
{ description: null }         // Null
```

**Why is this useful for updates?**

Consider updating a group:

```typescript
// User wants to CLEAR the description
PATCH /api/v1/groups/123
{
  description: null  // ← Explicitly set to null
}

// vs. User doesn't want to change description
PATCH /api/v1/groups/123
{
  name: "New Name"  // ← description field omitted
}
```

**In code:**
```typescript
async updateGroup(id: string, data: UpdateGroupInput) {
  // Only update fields that were provided
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  // If description is null, it gets set to null in DB
  // If description is undefined, it's not updated

  return prisma.group.update({
    where: { id },
    data: updateData
  });
}
```

### Part 3: Enum Validation

```typescript
import { GroupRole } from '@prisma/client';

export const groupRoleSchema = z.nativeEnum(GroupRole, {
  errorMap: () => ({ message: 'Invalid role. Must be OWNER, ADMIN, MEMBER, or VIEWER' }),
});
```

#### What is `z.nativeEnum()`?

**Enums in Prisma:**
```prisma
// In schema.prisma
enum GroupRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

**Generates TypeScript enum:**
```typescript
// Generated by Prisma
enum GroupRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER"
}
```

**Zod validation:**
```typescript
const roleSchema = z.nativeEnum(GroupRole);

// Valid:
roleSchema.parse("OWNER");   // ✅
roleSchema.parse("ADMIN");   // ✅

// Invalid:
roleSchema.parse("SUPERUSER");  // ❌ ZodError
roleSchema.parse("owner");      // ❌ Case-sensitive!
roleSchema.parse(123);          // ❌ Not a string
```

**Custom Error Messages:**
```typescript
z.nativeEnum(GroupRole, {
  errorMap: () => ({ message: 'Custom error message' })
})
```

**Why custom errors?**
- Default error: "Invalid enum value. Expected 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER', received 'SUPERUSER'"
- Custom error: "Invalid role. Must be OWNER, ADMIN, MEMBER, or VIEWER"
- Cleaner, more user-friendly

### Part 4: Pagination Schema

```typescript
export const paginationSchema = z.object({
  page: z
    .string()              // 1. Comes in as string (query params)
    .optional()            // 2. Can be omitted
    .default('1')          // 3. Use '1' if omitted
    .transform(Number)     // 4. Convert to number
    .pipe(z.number().int().positive()),  // 5. Validate it's a positive integer
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().positive().max(100)),
  sortBy: z
    .string()
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});
```

#### Understanding `.transform()` and `.pipe()`

This is an advanced Zod pattern. Let's break it down step by step:

**Why transform from string?**

Query parameters are always strings:
```
GET /api/v1/groups?page=2&limit=10
         ↑                 ↑    ↑
         Query params are strings
```

**The Processing Pipeline:**

```typescript
z.string()              // Input: "2" (string)
  .optional()           // Input: "2" or undefined
  .default('1')         // Input: "2" or "1" (default)
  .transform(Number)    // Output: 2 (number)
  .pipe(               // Pass to next schema
    z.number()         // Input: 2 (number)
      .int()           // Must be integer (no 2.5)
      .positive()      // Must be > 0
  )
```

**Visual Example:**

```
User Request: GET /groups?page=2&limit=50

Step 1: Extract query params
  page = "2"      (string)
  limit = "50"    (string)

Step 2: Apply default if missing
  page = "2"      (not missing, keep it)
  limit = "50"    (not missing, keep it)

Step 3: Transform to number
  page = 2        (number)
  limit = 50      (number)

Step 4: Validate
  page → Is 2 an integer? ✅ Is it positive? ✅
  limit → Is 50 an integer? ✅ Is it positive? ✅ Is it ≤ 100? ✅

Result:
{
  page: 2,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}
```

**What happens with invalid input?**

```typescript
// Invalid: page is negative
GET /groups?page=-1

// Pipeline:
.transform(Number)  → -1 (number)
.pipe(z.number().int().positive())
                    ↑
                    ❌ Error: Number must be positive
```

```typescript
// Invalid: limit too high
GET /groups?limit=500

// Pipeline:
.transform(Number)  → 500 (number)
.pipe(z.number().int().positive().max(100))
                                      ↑
                                      ❌ Error: Number must be at most 100
```

**Why limit max to 100?**
- **Performance**: Fetching 10,000 records at once would slow down the server
- **UX**: No user wants to scroll through 10,000 items
- **Best practice**: Force pagination for large datasets

#### Understanding `z.enum()`

```typescript
sortOrder: z.enum(['asc', 'desc'])
```

**What is `enum`?**
A set of allowed values (like multiple choice):

```typescript
// Valid:
sortOrder.parse('asc');   // ✅
sortOrder.parse('desc');  // ✅

// Invalid:
sortOrder.parse('ASC');      // ❌ Case-sensitive
sortOrder.parse('ascending'); // ❌ Not in the list
sortOrder.parse('random');   // ❌ Not in the list
```

**TypeScript type:**
```typescript
type SortOrder = 'asc' | 'desc';
//              ↑ This is called a "literal type" or "union of literals"
```

### Part 5: Response Types (Interfaces)

```typescript
export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;      // Optional: Added for list views
  userRole?: GroupRole;      // Optional: User's role in this group
}
```

**Why interfaces instead of Zod?**
- These are **responses** (data we send OUT)
- We control this data, don't need runtime validation
- Simpler to write and read

**Optional fields with `?`:**
```typescript
memberCount?: number;
// Equivalent to:
memberCount: number | undefined;
```

**When to include optional fields:**
```typescript
// Listing groups
GET /api/v1/groups
Response: {
  data: [
    {
      id: '1',
      name: 'Europe Trip',
      memberCount: 5,      // ← Include for list view
      userRole: 'OWNER'    // ← User's role
      // ... other fields
    }
  ]
}

// Getting single group
GET /api/v1/groups/1
Response: {
  id: '1',
  name: 'Europe Trip',
  // memberCount and userRole might be omitted
  // Or included based on business logic
}
```

### Part 6: Generic Pagination Response

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

#### Understanding Generics

**What is `<T>`?**
Think of it as a **placeholder for a type**.

**Non-generic (bad):**
```typescript
// Have to define separate interfaces for each type
interface GroupPaginatedResponse {
  data: GroupResponse[];
  pagination: { ... };
}

interface UserPaginatedResponse {
  data: UserResponse[];
  pagination: { ... };
}

// Lots of duplication! 😞
```

**Generic (good):**
```typescript
interface PaginatedResponse<T> {
  data: T[];         // ← T is a placeholder
  pagination: { ... };
}

// Use it:
type GroupsPage = PaginatedResponse<GroupResponse>;
// Expands to:
// {
//   data: GroupResponse[];
//   pagination: { ... };
// }

type UsersPage = PaginatedResponse<UserResponse>;
// Expands to:
// {
//   data: UserResponse[];
//   pagination: { ... };
// }
```

**How to use in controller:**
```typescript
async listGroups(req, res): Promise<void> {
  const result: PaginatedResponse<GroupResponse> = {
    data: groups,
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasMore: true
    }
  };

  res.json(result);
}
```

**Why this structure?**
- **Standard**: Clients always know what to expect
- **Self-documenting**: Response includes pagination metadata
- **Type-safe**: TypeScript checks data matches `T`

### Part 7: Complex Query Schema

```typescript
export const groupListQuerySchema = paginationSchema.extend({
  search: z
    .string()
    .trim()
    .optional(),
  isPrivate: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true';
    })
    .pipe(z.boolean().optional()),
});
```

#### Understanding `.extend()`

**What does `extend` do?**
Adds new fields to an existing schema:

```typescript
// Base schema
const baseSchema = z.object({
  page: z.number(),
  limit: z.number()
});

// Extended schema (base + new fields)
const extendedSchema = baseSchema.extend({
  search: z.string().optional()
});

// Equivalent to:
z.object({
  page: z.number(),
  limit: z.number(),
  search: z.string().optional()
})
```

**Why extend instead of redefining?**
- **DRY** (Don't Repeat Yourself)
- **Consistency**: All paginated queries use same pagination logic
- **Maintainability**: Change pagination once, affects all extended schemas

#### Boolean Query Parameter Transformation

This is tricky! Let's understand why:

**The Problem:**
```typescript
// Query params are strings
GET /groups?isPrivate=true

// In Express:
req.query.isPrivate === "true"  // String, not boolean!
```

**The Solution:**
```typescript
isPrivate: z
  .string()                     // 1. It's a string
  .optional()                   // 2. Might not be provided
  .transform((val) => {         // 3. Convert string to boolean
    if (val === undefined) return undefined;
    return val === 'true';      // "true" → true, "false" → false
  })
  .pipe(z.boolean().optional()) // 4. Validate it's a boolean
```

**Examples:**
```typescript
// Query: ?isPrivate=true
"true" → true (boolean)

// Query: ?isPrivate=false
"false" → false (boolean)

// Query: ?isPrivate=yes
"yes" → false (because it's not the string "true")

// Query: (no isPrivate param)
undefined → undefined
```

**Why this specific logic?**
```typescript
return val === 'true';
```

- `val === 'true'` → `true` if string is exactly "true"
- `val === 'true'` → `false` for anything else ("false", "yes", "1", etc.)

**Alternative (more forgiving):**
```typescript
.transform((val) => {
  if (val === undefined) return undefined;
  return val.toLowerCase() === 'true' || val === '1';
})
// Accepts: "true", "True", "TRUE", "1" → true
```

---

## File Walkthrough: groups.middleware.ts

This file implements **authorization middleware** for group-based routes. It ensures users have proper permissions before accessing group resources.

### Part 1: Extended Request Interface

```typescript
export interface GroupRequest extends Request {
  groupMember?: {
    id: string;
    role: GroupRole;
    userId: string;
    groupId: string;
  };
  group?: {
    id: string;
    name: string;
    creatorId: string;
    isPrivate: boolean;
  };
}
```

#### Understanding Interface Extension

**What is `extends`?**
It means "take all properties from parent and add new ones."

```typescript
interface Request {
  // Express Request has: headers, body, params, query, etc.
}

interface GroupRequest extends Request {
  // Has ALL Request properties PLUS:
  groupMember?: { ... }
  group?: { ... }
}
```

**Why extend Request?**
- Middleware needs to attach custom data to the request object
- TypeScript needs to know these properties exist
- Controllers can access `req.groupMember` with full type safety

**Before extending:**
```typescript
req.groupMember = { ... };
// ❌ TypeScript error: Property 'groupMember' does not exist on type 'Request'
```

**After extending:**
```typescript
const req: GroupRequest = ...;
req.groupMember = { ... };
// ✅ TypeScript is happy!
```

**Why optional (`?`)?**
```typescript
groupMember?: { ... }
```

- Not all routes need membership checks
- Some middleware might not attach this data
- Optional = can be undefined

### Part 2: Role Hierarchy Map

```typescript
const ROLE_HIERARCHY: Record<GroupRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};
```

#### Understanding `Record<K, V>`

**What is `Record`?**
A TypeScript utility type that creates an object type with specific keys and value types.

```typescript
Record<GroupRole, number>
// Equivalent to:
{
  OWNER: number;
  ADMIN: number;
  MEMBER: number;
  VIEWER: number;
}
```

**Why use Record?**
- Type-safe: Can't accidentally add wrong keys
- Auto-complete: TypeScript knows all valid keys
- Exhaustive: Must define all enum values

**Example of type safety:**
```typescript
const hierarchy: Record<GroupRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  // ❌ Error: Missing VIEWER
};

hierarchy.SUPERUSER = 5;  // ❌ Error: SUPERUSER is not in GroupRole
```

**Why numbers for hierarchy?**
```typescript
function hasMinimumRole(userRole: GroupRole, requiredRole: GroupRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Example:
hasMinimumRole('ADMIN', 'MEMBER')
// ROLE_HIERARCHY['ADMIN'] = 3
// ROLE_HIERARCHY['MEMBER'] = 2
// 3 >= 2 → true ✅

hasMinimumRole('VIEWER', 'ADMIN')
// ROLE_HIERARCHY['VIEWER'] = 1
// ROLE_HIERARCHY['ADMIN'] = 3
// 1 >= 3 → false ❌
```

Simple numeric comparison instead of complex nested if-statements!

### Part 3: Require Group Membership Middleware

```typescript
export async function requireGroupMembership(
  req: GroupRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check authentication
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // 2. Extract group ID
    const groupId = req.params.groupId || req.params.id;

    // 3. Find group
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // 4. Find membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {  // Composite unique constraint
          groupId: group.id,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 5. Attach to request
    req.groupMember = { ... };
    req.group = group;

    next();  // Continue to next middleware/controller
  } catch (error) {
    next(error);  // Pass to error handler
  }
}
```

#### Step-by-Step Breakdown

**Step 1: Authentication Check**
```typescript
if (!req.user) {
  throw new UnauthorizedError('Authentication required');
}
```

- `req.user` is set by `authenticate` middleware (must run before this)
- If missing, user is not logged in → 401 Unauthorized
- This is a **prerequisite check** - ensures user is authenticated

**Step 2: Extract Group ID**
```typescript
const groupId = req.params.groupId || req.params.id;
```

**Why `||` (OR)?**
Different routes might use different parameter names:
```
/groups/:id              → req.params.id
/groups/:groupId/members → req.params.groupId
```

We support both conventions.

**TypeScript Feature: Logical OR**
```typescript
const value = a || b;
// If 'a' is truthy, use 'a'
// Otherwise, use 'b'

// Examples:
"hello" || "world"  → "hello"
"" || "world"       → "world" (empty string is falsy)
undefined || "world" → "world"
```

**Step 3: Find Group**
```typescript
const group = await prisma.group.findUnique({
  where: { id: groupId },
  select: {
    id: true,
    name: true,
    creatorId: true,
    isPrivate: true,
  },
});
```

**Why `select`?**
- Only fetch fields we need (performance optimization)
- Don't fetch entire group with all relations
- Smaller payload, faster query

**What if group doesn't exist?**
```typescript
if (!group) {
  throw new NotFoundError('Group not found');
}
```

404 Not Found - group ID is invalid.

**Step 4: Find Membership (The Critical Check)**
```typescript
const membership = await prisma.groupMember.findUnique({
  where: {
    groupId_userId: {  // ← Composite unique key
      groupId: group.id,
      userId: req.user.id,
    },
  },
});
```

#### Understanding Composite Unique Constraints

**In Prisma schema:**
```prisma
model GroupMember {
  groupId  String
  userId   String
  role     GroupRole

  @@unique([groupId, userId])  // ← Composite unique constraint
}
```

**What this means:**
- Combination of `(groupId, userId)` must be unique
- A user can only be in a group once
- Prevents duplicate memberships

**Querying composite keys:**
```typescript
// ❌ Can't do this:
findUnique({ where: { groupId: '1', userId: '2' } })

// ✅ Must wrap in composite key name:
findUnique({
  where: {
    groupId_userId: {  // Name from @@unique([groupId, userId])
      groupId: '1',
      userId: '2'
    }
  }
})
```

**Prisma naming convention:**
- `@@unique([a, b])` → Query with `a_b: { a: ..., b: ... }`
- `@@unique([groupId, userId])` → `groupId_userId: { groupId, userId }`

**Step 5: Check Membership**
```typescript
if (!membership) {
  throw new ForbiddenError('You are not a member of this group');
}
```

403 Forbidden - group exists but user doesn't have access.

**Error Code Distinction:**
- **401 Unauthorized**: Not logged in
- **403 Forbidden**: Logged in, but don't have permission
- **404 Not Found**: Resource doesn't exist

**Step 6: Attach to Request**
```typescript
req.groupMember = {
  id: membership.id,
  role: membership.role,
  userId: membership.userId,
  groupId: membership.groupId,
};

req.group = group;
```

**Why attach to request?**
- Downstream middleware/controllers need this info
- Avoid redundant database queries
- Controllers can access user's role without another DB call

**Example usage in controller:**
```typescript
async updateGroup(req: GroupRequest, res, next) {
  // req.groupMember is already populated!
  console.log(`User ${req.groupMember.userId} has role ${req.groupMember.role}`);

  // No need to query database again
}
```

### Part 4: Middleware Factory Pattern

```typescript
export function requireGroupRole(minimumRole: GroupRole) {
  return async (
    req: GroupRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.groupMember) {
        throw new ForbiddenError('Group membership not verified');
      }

      if (!hasMinimumRole(req.groupMember.role, minimumRole)) {
        throw new ForbiddenError(
          `This action requires ${minimumRole} role or higher`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
```

#### Understanding Middleware Factories

**What is a factory function?**
A function that **returns another function**.

```typescript
// Not a factory - just a middleware function
function myMiddleware(req, res, next) {
  // Do something
  next();
}

// Factory - function that creates middleware
function createMiddleware(config) {
  return function(req, res, next) {
    // Use config here
    next();
  };
}
```

**Why use a factory for requireGroupRole?**

Without factory (repetitive):
```typescript
function requireAdmin(req, res, next) {
  if (!hasMinimumRole(req.groupMember.role, 'ADMIN')) {
    throw new Error('Need ADMIN role');
  }
  next();
}

function requireMember(req, res, next) {
  if (!hasMinimumRole(req.groupMember.role, 'MEMBER')) {
    throw new Error('Need MEMBER role');
  }
  next();
}

// ... repeat for each role
```

With factory (DRY):
```typescript
const requireAdmin = requireGroupRole('ADMIN');
const requireMember = requireGroupRole('MEMBER');
const requireOwner = requireGroupRole('OWNER');
```

**How it works:**

```typescript
// Call the factory
const middleware = requireGroupRole('ADMIN');

// Factory returns a function
//               ↓↓↓ This function
middleware = async (req, res, next) => {
  // 'ADMIN' is captured in closure!
  if (!hasMinimumRole(req.groupMember.role, 'ADMIN')) {
    // ...
  }
}
```

**Closures Explained:**
```typescript
function requireGroupRole(minimumRole) {
  // minimumRole = 'ADMIN'

  return async function(req, res, next) {
    // This function "closes over" minimumRole
    // It remembers the value even after requireGroupRole returns!
    console.log(minimumRole);  // Still accessible!
  };
}

const middleware = requireGroupRole('ADMIN');
// requireGroupRole has finished executing
// But the returned function still remembers minimumRole = 'ADMIN'

middleware(req, res, next);  // Logs: 'ADMIN'
```

**Usage in routes:**
```typescript
router.patch(
  '/groups/:id',
  authenticate,              // 1st: Verify JWT
  requireGroupMembership,    // 2nd: Check membership
  requireGroupRole('ADMIN'), // 3rd: Check role
  groupController.update     // 4th: Handle request
);
```

### Part 5: Helper Functions

```typescript
export function canModifyMemberRole(
  currentUserRole: GroupRole,
  targetCurrentRole: GroupRole,
  targetNewRole: GroupRole
): boolean {
  // Cannot change OWNER role
  if (targetCurrentRole === GroupRole.OWNER) {
    return false;
  }

  // Cannot promote to OWNER
  if (targetNewRole === GroupRole.OWNER) {
    return false;
  }

  // OWNER can change any non-OWNER role
  if (currentUserRole === GroupRole.OWNER) {
    return true;
  }

  // ADMIN can only change MEMBER and VIEWER roles
  if (currentUserRole === GroupRole.ADMIN) {
    return (
      targetCurrentRole !== GroupRole.ADMIN &&
      targetNewRole !== GroupRole.ADMIN
    );
  }

  // Other roles cannot modify roles
  return false;
}
```

#### Business Logic Helpers

**Why separate helper functions?**
- **Testable**: Easy to unit test without HTTP/database
- **Reusable**: Can be used in service layer, middleware, or controllers
- **Readable**: Complex logic has a clear function name
- **Single Responsibility**: Each function does ONE thing

**Example usage in service:**
```typescript
async updateMemberRole(groupId, userId, newRole, requestingUserId) {
  const requestingMember = await getGroupMember(groupId, requestingUserId);
  const targetMember = await getGroupMember(groupId, userId);

  // Use helper to check permission
  if (!canModifyMemberRole(
    requestingMember.role,
    targetMember.role,
    newRole
  )) {
    throw new ForbiddenError('Cannot modify this member\'s role');
  }

  // Proceed with update
  // ...
}
```

**Testing helpers:**
```typescript
describe('canModifyMemberRole', () => {
  it('allows OWNER to change ADMIN to MEMBER', () => {
    expect(canModifyMemberRole('OWNER', 'ADMIN', 'MEMBER')).toBe(true);
  });

  it('prevents ADMIN from promoting to OWNER', () => {
    expect(canModifyMemberRole('ADMIN', 'MEMBER', 'OWNER')).toBe(false);
  });

  it('prevents changing OWNER role', () => {
    expect(canModifyMemberRole('OWNER', 'OWNER', 'ADMIN')).toBe(false);
  });
});
```

### Part 6: Optional Group Membership

```typescript
export async function optionalGroupMembership(req, res, next) {
  try {
    // ... find group

    // For private groups, membership is required
    if (group.isPrivate) {
      const membership = await findMembership(...);

      if (!membership) {
        throw new ForbiddenError('This is a private group');
      }

      req.groupMember = membership;
    } else {
      // For public groups, try to find membership but don't require it
      const membership = await findMembership(...);

      if (membership) {
        req.groupMember = membership;
      }
      // If no membership, continue anyway
    }

    next();
  } catch (error) {
    next(error);
  }
}
```

**Use case: Public vs Private Groups**

**Private Group (default):**
- Must be a member to view
- 403 Forbidden if not a member

**Public Group:**
- Anyone can view (browsing, discovery)
- Members have additional permissions
- Non-members can view but can't edit/participate

**Example:**
```typescript
router.get('/groups/:id',
  authenticate,
  optionalGroupMembership,  // Doesn't fail for public groups
  groupController.get
);

// In controller:
async get(req: GroupRequest, res) {
  if (req.groupMember) {
    // User is a member - show full details
    return { ...fullDetails };
  } else {
    // User is not a member (public group) - show limited details
    return { ...publicDetails };
  }
}
```

---

## Middleware Patterns

### 1. Middleware Chain Pattern

Middleware execute in order, passing control via `next()`:

```typescript
router.post('/groups/:id/members',
  authenticate,              // 1st: Check auth
  requireGroupMembership,    // 2nd: Check membership
  requireGroupRole('ADMIN'), // 3rd: Check role
  groupController.addMember  // 4th: Execute action
);
```

**Execution flow:**
```
Request
  ↓
authenticate → next() →
  ↓
requireGroupMembership → next() →
  ↓
requireGroupRole('ADMIN') → next() →
  ↓
groupController.addMember
  ↓
Response
```

**If any middleware throws:**
```
Request
  ↓
authenticate → OK → next() →
  ↓
requireGroupMembership → OK → next() →
  ↓
requireGroupRole('ADMIN') → throw ForbiddenError() →
  ↓
SKIP controller →
  ↓
errorHandler middleware catches error →
  ↓
Response: { success: false, error: { ... } }
```

### 2. Request Augmentation Pattern

Middleware can attach data to `req` for downstream use:

```typescript
// Middleware 1: Attach user
authenticate(req, res, next) {
  req.user = { id: '123', email: '...' };
  next();
}

// Middleware 2: Use req.user, attach group
requireGroupMembership(req, res, next) {
  const userId = req.user.id;  // ← From previous middleware
  req.groupMember = { ... };
  next();
}

// Controller: Use both
controller(req, res) {
  const userId = req.user.id;
  const role = req.groupMember.role;
  // Both available!
}
```

### 3. Factory Pattern for Configurable Middleware

Instead of writing separate middleware for each case:

```typescript
// ❌ Repetitive
export function requireAdmin(req, res, next) { ... }
export function requireMember(req, res, next) { ... }
export function requireOwner(req, res, next) { ... }

// ✅ Factory
export function requireGroupRole(role) {
  return (req, res, next) => { ... };
}

// Usage:
const requireAdmin = requireGroupRole('ADMIN');
const requireMember = requireGroupRole('MEMBER');
```

### 4. Early Return Pattern

Check prerequisites early and fail fast:

```typescript
async function middleware(req, res, next) {
  // Early returns for error cases
  if (!req.user) {
    throw new UnauthorizedError('...');
    // Function exits here
  }

  if (!groupId) {
    throw new NotFoundError('...');
    // Function exits here
  }

  // Happy path continues
  const group = await findGroup(groupId);
  next();
}
```

**Benefits:**
- Avoid nested if-else
- Easier to read
- "Guard clauses" protect the happy path

### 5. Error Forwarding Pattern

Always pass errors to Express error handler:

```typescript
async function middleware(req, res, next) {
  try {
    // Do work
    next();
  } catch (error) {
    next(error);  // ← Pass to error handler
  }
}
```

**Why not throw directly?**
```typescript
// ❌ Bad: Unhandled promise rejection
async function middleware(req, res, next) {
  throw new Error('Something failed');
  // If this is async, error won't be caught by Express!
}

// ✅ Good: Caught and passed to error handler
async function middleware(req, res, next) {
  try {
    throw new Error('Something failed');
  } catch (error) {
    next(error);  // Express error handler receives it
  }
}
```

---

## Advanced TypeScript Features

### 1. Literal Types

```typescript
sortOrder: z.enum(['asc', 'desc'])

// TypeScript type:
type SortOrder = 'asc' | 'desc';
//               ↑ Literal type (specific string values)
```

**Not just any string:**
```typescript
let order: SortOrder;

order = 'asc';      // ✅
order = 'desc';     // ✅
order = 'random';   // ❌ Error: Type '"random"' is not assignable to type 'asc' | 'desc'
```

### 2. Union Types with `|`

```typescript
description: string | null
//           ↑ Union type (can be string OR null)

memberCount?: number
//            ↑ Equivalent to: number | undefined
```

### 3. Type Inference with `z.infer<>`

```typescript
const schema = z.object({ name: z.string() });
type Inferred = z.infer<typeof schema>;
// Automatically becomes: { name: string }
```

**Why `typeof`?**
```typescript
z.infer<schema>        // ❌ Error: 'schema' is a value, not a type
z.infer<typeof schema> // ✅ Correct: Get the type of the value
```

### 4. Generics

```typescript
PaginatedResponse<T>
//                ↑ Type parameter

// Use it:
PaginatedResponse<GroupResponse>
// T is replaced with GroupResponse everywhere in the interface
```

### 5. Record Type

```typescript
Record<string, unknown>
// Equivalent to:
{ [key: string]: unknown }

// Means: Object with string keys, unknown values
```

### 6. Utility Types

**Partial:**
```typescript
type UpdateGroupInput = Partial<CreateGroupInput>;
// Makes all fields optional

// Original:
{ name: string; description?: string }

// After Partial:
{ name?: string; description?: string }
```

**Pick:**
```typescript
type GroupBasicInfo = Pick<GroupResponse, 'id' | 'name'>;
// Picks only specific fields

// Result:
{ id: string; name: string }
```

**Omit:**
```typescript
type GroupWithoutDates = Omit<GroupResponse, 'createdAt' | 'updatedAt'>;
// Removes specific fields

// Result: GroupResponse but without createdAt and updatedAt
```

---

## Validation Patterns

### 1. String Sanitization

```typescript
.trim()  // Remove whitespace from ends
.toLowerCase()  // Convert to lowercase
.toUpperCase()  // Convert to uppercase
```

**Example:**
```typescript
const emailSchema = z.string().email().toLowerCase().trim();

emailSchema.parse("  User@Example.COM  ");
// Result: "user@example.com"
```

### 2. String Length Constraints

```typescript
z.string()
  .min(3)      // At least 3 characters
  .max(100)    // At most 100 characters
  .length(10)  // Exactly 10 characters
```

### 3. Number Constraints

```typescript
z.number()
  .int()         // Must be integer
  .positive()    // > 0
  .nonnegative() // >= 0
  .min(1)        // >= 1
  .max(100)      // <= 100
```

### 4. Optional vs Required

```typescript
// Required (default)
name: z.string()

// Optional (can be omitted)
description: z.string().optional()

// Nullable (can be null)
imageUrl: z.string().nullable()

// Optional AND nullable
settings: z.object({}).nullable().optional()
```

### 5. Defaults

```typescript
// If field is omitted, use default
isPrivate: z.boolean().default(true)

// After parsing:
{}  → { isPrivate: true }
```

### 6. Transformations

```typescript
// Transform during validation
page: z.string().transform(Number)

// Input: "10"
// Output: 10
```

### 7. Refinements (Custom Validation)

```typescript
z.string().refine((val) => val.length > 0, {
  message: "String cannot be empty"
})

// Or multiple conditions:
z.number().refine((val) => val % 2 === 0, {
  message: "Must be even number"
})
```

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
OWNER (4)    ← Can do EVERYTHING
  ↓
ADMIN (3)    ← Can manage members, update group
  ↓
MEMBER (2)   ← Can view, participate in trips
  ↓
VIEWER (1)   ← Read-only access
```

### Permission Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|--------|-------|-------|--------|--------|
| View group | ✅ | ✅ | ✅ | ✅ |
| Update group | ✅ | ✅ | ❌ | ❌ |
| Delete group | ✅ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅* | ❌ | ❌ |
| Create trips | ✅ | ✅ | ✅ | ❌ |
| Edit trips | ✅ | ✅ | ✅ | ❌ |

*ADMIN can change roles but can't change OWNER role or create new OWNERs

### Implementing Role Checks

```typescript
function hasMinimumRole(userRole: GroupRole, requiredRole: GroupRole): boolean {
  const roleHierarchy = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    VIEWER: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Usage:
if (hasMinimumRole(user.role, 'ADMIN')) {
  // User is ADMIN or OWNER
  allowedToManageMembers();
}
```

---

## Common Pitfalls

### 1. Forgetting .trim() on Strings

```typescript
// ❌ Bad: User can create "  " (spaces only)
name: z.string().min(3)

// ✅ Good: Trim first, then validate
name: z.string().trim().min(3)
```

### 2. Query Params Are Always Strings

```typescript
// ❌ Bad: Expects number, gets string
page: z.number()

// ✅ Good: Transform string to number
page: z.string().transform(Number).pipe(z.number())
```

### 3. Optional vs Nullable Confusion

```typescript
// ❌ Bad: Can't set to null to clear field
description: z.string().optional()

// ✅ Good: Can omit OR set to null
description: z.string().nullable().optional()
```

### 4. Not Validating Max Length

```typescript
// ❌ Bad: User can send 10MB description
description: z.string()

// ✅ Good: Limit to reasonable size
description: z.string().max(500)
```

### 5. Not Setting Max Pagination Limit

```typescript
// ❌ Bad: User can request 1 million records
limit: z.number().positive()

// ✅ Good: Cap at reasonable number
limit: z.number().positive().max(100)
```

### 6. Using `any` Instead of `unknown`

```typescript
// ❌ Bad: No type safety
settings: z.record(z.any())

// ✅ Good: Forces type checking
settings: z.record(z.unknown())
```

---

## Testing Guide

### Testing Zod Schemas

```typescript
import { describe, it, expect } from 'vitest';
import { createGroupSchema } from './groups.types';

describe('createGroupSchema', () => {
  it('should accept valid group data', () => {
    const validData = {
      name: 'Europe Trip',
      description: 'Summer 2025',
      isPrivate: true,
    };

    const result = createGroupSchema.parse(validData);

    expect(result.name).toBe('Europe Trip');
    expect(result.isPrivate).toBe(true);
  });

  it('should apply defaults', () => {
    const minimalData = { name: 'Trip' };

    const result = createGroupSchema.parse(minimalData);

    expect(result.isPrivate).toBe(true);  // Default applied
  });

  it('should trim whitespace', () => {
    const data = { name: '  Spaced Name  ' };

    const result = createGroupSchema.parse(data);

    expect(result.name).toBe('Spaced Name');
  });

  it('should reject name too short', () => {
    const data = { name: 'ab' };  // Only 2 chars

    expect(() => createGroupSchema.parse(data)).toThrow('at least 3 characters');
  });

  it('should reject name too long', () => {
    const data = { name: 'a'.repeat(101) };  // 101 chars

    expect(() => createGroupSchema.parse(data)).toThrow('not exceed 100 characters');
  });

  it('should reject invalid URL', () => {
    const data = {
      name: 'Trip',
      imageUrl: 'not-a-url'
    };

    expect(() => createGroupSchema.parse(data)).toThrow('valid URL');
  });
});
```

### Testing Pagination Schema

```typescript
describe('paginationSchema', () => {
  it('should transform string to number', () => {
    const query = { page: '2', limit: '50' };

    const result = paginationSchema.parse(query);

    expect(result.page).toBe(2);  // Number, not string
    expect(result.limit).toBe(50);
  });

  it('should apply defaults', () => {
    const result = paginationSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe('desc');
  });

  it('should reject negative page', () => {
    const query = { page: '-1' };

    expect(() => paginationSchema.parse(query)).toThrow('positive');
  });

  it('should reject limit > 100', () => {
    const query = { limit: '500' };

    expect(() => paginationSchema.parse(query)).toThrow('at most 100');
  });
});
```

---

## Summary

The Groups Types module demonstrates:

1. **Validation**: Zod schemas for all inputs
2. **Type Safety**: TypeScript types inferred from schemas
3. **Transformations**: String trimming, number conversion
4. **Advanced Patterns**: Generics, optional/nullable, pipelines
5. **RBAC**: Role-based permission system
6. **Pagination**: Reusable pagination schema
7. **Best Practices**: Max lengths, defaults, sanitization

**Next:** We'll implement the middleware layer for authorization checks! 🔐
