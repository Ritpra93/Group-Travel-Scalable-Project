# Critical Changes & Temporary Solutions

This document tracks major architectural decisions and temporary workarounds that need to be revisited before production.

---

## 🔴 CRITICAL: Database ORM Switch (Dec 24, 2025)

### Issue
Prisma Client has a persistent **P1010 permission error** that prevents runtime database queries, despite:
- ✅ All tables created successfully
- ✅ postgres user has SUPERUSER privileges
- ✅ Direct psql queries work perfectly
- ✅ Tested across Prisma versions 5.20.0, 5.22.0, and 6.8.0
- ✅ PostgreSQL 14 properly configured

**Error**: `User 'postgres' was denied access on the database 'group_travel.public'`

This is a known Prisma bug with PostgreSQL 14+ permission validation: https://github.com/prisma/prisma/issues/22452

### Temporary Solution
**Switched from Prisma Client to Kysely** for database queries while keeping Prisma schema as source of truth.

**Why Kysely:**
- Type-safe query builder
- Works with existing PostgreSQL setup
- Can generate types from Prisma schema via `prisma-kysely`
- Easy to migrate back to Prisma when bug is fixed
- Zero runtime permission checks - just SQL

### Migration Path Back to Prisma

When Prisma fixes the P1010 bug (likely in Prisma 8.x or newer PostgreSQL drivers):

1. **Test with new Prisma version**:
   ```bash
   npm install prisma@latest @prisma/client@latest
   npx prisma generate
   npm run dev
   # Try a simple query
   ```

2. **If it works**, migrate back:
   - Remove Kysely dependencies
   - Update all service files to use Prisma Client
   - Remove `src/config/kysely.ts`
   - Restore `src/config/database.ts` Prisma Client usage

3. **Affected files** (search for `import.*kysely`):
   - `src/config/kysely.ts` (new file - DELETE when migrating back)
   - `src/config/database.types.ts` (new file - DELETE when migrating back)
   - `src/modules/auth/auth.service.ts` (✅ MIGRATED - uses Kysely + cuid2 for ID generation)
   - `src/modules/groups/groups.service.ts` (✅ MIGRATED - uses Kysely + cuid2 for ID generation)
   - `src/modules/invitations/invitations.service.ts` (✅ BUILT WITH KYSELY - uses Kysely from the start)
   - `src/app.ts` (✅ MIGRATED - health check uses Kysely)
   - Any future service files created during Kysely period

### Current State
- **Prisma**: Used for schema definition and migrations only
- **Kysely**: Used for all runtime database queries
- **Schema source of truth**: `prisma/schema.prisma`
- **Type generation**: `prisma-kysely` generates Kysely types from Prisma

---

## 🟡 Database Migration Workaround (Dec 24, 2025)

### Issue
`prisma migrate dev` and `prisma db push` both fail with the same P1010 error during their pre-flight permission checks.

### Solution
**Manual SQL application** for schema changes:

```bash
# 1. Generate SQL from Prisma schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql

# 2. Apply directly to PostgreSQL
docker exec -i group-travel-postgres \
  psql -U postgres -d group_travel < migration.sql

# 3. Generate Kysely types
npx prisma generate
npm run kysely:generate  # Generates Kysely types from Prisma
```

### Production Migration Path

**Before production**, implement proper migration management:

1. **Option A**: Wait for Prisma fix, then use `prisma migrate`
2. **Option B**: Use dedicated migration tool (Flyway, Liquibase, Atlas)
3. **Option C**: Managed database service (AWS RDS, Cloud SQL) - different permission model

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed migration procedures.

---

## 🟢 Other Configuration Changes

### PostgreSQL Version
- **Changed**: From PostgreSQL 15 to PostgreSQL 14
- **Reason**: PostgreSQL 15 has more restrictive public schema permissions
- **Impact**: PostgreSQL 14 is still supported and production-ready
- **Revert when**: PostgreSQL 15 + Prisma compatibility is confirmed

### Environment Files
- **Created**: `.env` file (Prisma CLI requires it, even though app uses `.env.local`)
- **Purpose**: Prisma CLI tools only read `.env`, not `.env.local`
- **Contains**: Same values as `.env.local`
- **Keep in sync**: Update both files when changing DATABASE_URL

### Prisma Shadow Database
- **Added**: `SHADOW_DATABASE_URL` environment variable
- **Database**: `group_travel_shadow` created
- **Purpose**: Attempted fix for P1010 error (didn't work, but kept for future Prisma usage)
- **Impact**: None currently (Kysely doesn't use it)

### Docker Init Script
- **File**: `docker/init-db.sql`
- **Purpose**: Grant public schema permissions on container initialization
- **Status**: Runs successfully but doesn't fix Prisma runtime issue
- **Keep**: Yes, good practice for PostgreSQL 14+ setups

### ID Generation
- **Issue**: Prisma schema uses `@default(cuid())` which generates IDs in the database layer
- **Problem**: PostgreSQL doesn't have CUID generation, so Prisma generates IDs before insert
- **Kysely Solution**: Must generate IDs in application code using `@paralleldrive/cuid2`
- **Pattern**: All insert operations must include `id: createId()` in values
- **Example**: `db.insertInto('users').values({ id: createId(), ... })`

### Connection String
- **Removed**: `connection_limit` and `pool_timeout` query parameters
- **Reason**: Suspected they might interfere with Prisma permission checks
- **Status**: Didn't fix the issue, but simpler connection string is fine for development
- **Production**: Re-add connection pooling parameters when using managed database

---

## 📋 Checklist Before Production

- [ ] Test latest Prisma version (check if P1010 is fixed)
- [ ] Migrate from Kysely back to Prisma Client (if Prisma is fixed)
- [ ] Implement proper migration strategy (not manual SQL)
- [ ] Set up migration tracking and versioning
- [ ] Add connection pooling parameters to DATABASE_URL
- [ ] Review PostgreSQL version choice (14 vs 15 vs 16)
- [ ] Test all database operations under production load
- [ ] Implement database backup strategy
- [ ] Set up monitoring for database connection pool
- [ ] Review and update all error handling for database errors

---

## 🔍 How to Identify Kysely Code

When migrating back to Prisma, search for:
- `import { db }` (Kysely database instance)
- `import.*kysely` (any Kysely imports)
- `.selectFrom()`, `.insertInto()`, `.updateTable()`, `.deleteFrom()` (Kysely query methods)
- `executeTakeFirst()`, `executeTakeFirstOrThrow()`, `execute()` (Kysely execution methods)

Prisma code uses:
- `import { prisma }` (Prisma client instance)
- `prisma.user.findUnique()`, `prisma.group.create()`, etc.

---

## 📝 Additional Notes

### Package Changes
- **Added**: `kysely`, `kysely-postgres`, `prisma-kysely`
- **Kept**: `prisma`, `@prisma/client` (for schema and type generation)
- **Using**: `@paralleldrive/cuid2` (for generating IDs in application code instead of database defaults)

### Development Workflow Impact
Schema changes now require:
1. Update `prisma/schema.prisma`
2. Generate SQL manually
3. Apply via Docker exec
4. Regenerate types with `prisma generate` and `kysely:generate`

More steps than `prisma migrate dev`, but necessary workaround.

---

## ✅ Migration Status (Updated: Dec 25, 2025 17:23 PST)

### Completed
- ✅ Environment files updated to port 5433
- ✅ Kysely database connection configured
- ✅ Database types generated from Prisma schema
- ✅ Health check endpoint migrated to Kysely
- ✅ Auth service fully migrated to Kysely (register, login, logout, refresh)
- ✅ All auth endpoints tested and working
- ✅ **Groups service migrated to Kysely**
  - Converted all Prisma queries to Kysely
  - Original backed up as groups.service.prisma.backup.ts
  - All endpoints tested successfully
- ✅ **Invitations module implemented with Kysely from the start**
  - invitations.types.ts (Zod schemas + TypeScript types)
  - invitations.utils.ts (Token generation, URL creation, validation helpers)
  - invitations.service.ts (Business logic with Kysely queries)
  - invitations.controller.ts (HTTP handlers)
  - invitations.routes.ts (Express routes with authentication)
  - Routes registered in app.ts
  - **All endpoints tested end-to-end successfully**

### Critical Fixes Applied
- ✅ Fixed invitations.controller.ts to use `req.user.id` instead of `req.user.userId`
  - Root cause: auth middleware sets `req.user` to the entire user object (which has `id` field)
  - Fixed in all 6 controller methods
- ✅ Fixed invitations.service.ts listInvitations query
  - Root cause: SQL GROUP BY error when adding count to query with non-aggregated columns
  - Solution: Build separate count query from base query
- ✅ Changed all Zod `.cuid()` validators to `.min(20)` in invitations.types.ts
  - Root cause: Kysely uses CUID2 format (via @paralleldrive/cuid2) incompatible with Zod's `.cuid()` validator
  - CUID2 IDs are 24-25 characters vs CUID1's 25 characters

### Pending
- ⏳ Future modules: Trips, Expenses, Itinerary, Polls (all will use Kysely)

### Testing Results
All authentication endpoints tested successfully with Kysely:
- ✅ POST `/api/v1/auth/register` - User registration with CUID generation
- ✅ POST `/api/v1/auth/login` - User login with session creation
- ✅ POST `/api/v1/auth/refresh` - Token refresh with session update
- ✅ POST `/api/v1/auth/logout` - Logout with session deletion

All groups endpoints tested successfully with Kysely:
- ✅ POST `/api/v1/groups` - Create group with automatic owner membership
- ✅ GET `/api/v1/groups/:id/members` - List group members with user details

All invitations endpoints tested successfully with Kysely:
- ✅ POST `/api/v1/invitations` - Send invitation (creates invitation with token)
- ✅ POST `/api/v1/invitations/respond` - Accept invitation (creates group membership) ✅ Decline invitation (updates status)
- ✅ GET `/api/v1/invitations/sent` - List sent invitations with group and sender details
- ✅ GET `/api/v1/invitations/received` - List received invitations by email or recipientId
- ✅ POST `/api/v1/invitations/:id/resend` - Resend invitation (generates new token, extends expiry)
- ✅ DELETE `/api/v1/invitations/:id` - Cancel invitation (soft delete by updating status)

---

**Last Updated**: December 25, 2025
**Review Date**: Before production deployment
**Owner**: Backend Team
