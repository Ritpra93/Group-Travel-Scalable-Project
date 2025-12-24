# Database Setup Notes

## Current Setup (Development)

### ⚠️ Prisma Migrations Workaround

**Issue**: Prisma 5.x has a known bug (P1010 error) with PostgreSQL 14+ permission validation that prevents `prisma migrate dev` and `prisma db push` from working, even when the database user has all necessary permissions.

**Current Solution**: Manual SQL application
- Schema is generated using: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
- SQL is applied directly to PostgreSQL via Docker exec
- Prisma Client is generated normally with `npx prisma generate`

**Status**: ✅ Working for development
- Database: PostgreSQL 14 (Docker)
- All tables created successfully
- Prisma Client generated and functional

### Current Database Schema

Tables created:
- `users` - User accounts and profiles
- `sessions` - Refresh token sessions
- `groups` - Travel groups
- `group_members` - Group membership and roles (OWNER, ADMIN, MEMBER, VIEWER)
- `trips` - Trip planning within groups
- `polls` - Decision-making polls for trips
- `poll_options` - Poll options
- `votes` - User votes on polls
- `itinerary_items` - Trip itinerary planning
- `expenses` - Expense tracking
- `expense_splits` - Expense split calculations
- `invitations` - Group invitations
- `activity_logs` - Audit trail of actions

## TODO: Production Migration Strategy

When scaling to production, this manual approach needs to be replaced with proper migration management:

### Option 1: Fix Prisma Permissions Issue
1. Investigate if newer Prisma versions (6.x, 7.x) have fixed P1010 bug
2. Test with proper PostgreSQL role configuration
3. Implement proper `prisma migrate` workflow

### Option 2: Alternative Migration Tool
Consider using:
- **Postgres Migrations** (pg-migrate, node-pg-migrate)
- **Flyway** or **Liquibase** for enterprise setups
- **Atlas** (modern schema migration tool)

### Option 3: Managed Database Service
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- These often have different permission models that work with Prisma
- Built-in migration management and rollback capabilities

### Required Changes for Production

1. **Migration History**
   - Current setup has NO migration tracking
   - Need to establish baseline migration
   - Implement versioned migration files

2. **CI/CD Integration**
   - Automate schema changes in deployment pipeline
   - Add migration validation in CI
   - Implement rollback procedures

3. **Zero-Downtime Migrations**
   - Backward-compatible schema changes
   - Blue-green deployment strategy
   - Feature flags for breaking changes

4. **Schema Versioning**
   - Track which migration version is deployed
   - Document breaking changes
   - Maintain migration changelog

## Development Workflow (Current)

### Making Schema Changes

1. **Update Prisma Schema**
   ```bash
   # Edit backend/prisma/schema.prisma
   ```

2. **Generate SQL**
   ```bash
   cd backend
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma \
     --script > migration.sql
   ```

3. **Review SQL**
   ```bash
   cat migration.sql
   # Ensure changes are correct
   ```

4. **Apply to Database**
   ```bash
   docker exec -i group-travel-postgres psql -U postgres -d group_travel < migration.sql
   ```

5. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Test Changes**
   - Start the application
   - Verify database operations work
   - Run any affected tests

### Fresh Database Setup

If you need to reset the database:

```bash
# 1. Recreate Docker containers
cd docker
docker-compose down -v
docker-compose up -d

# Wait for PostgreSQL to be ready
sleep 10

# 2. Generate schema SQL
cd ../backend
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/schema.sql

# 3. Apply schema
docker exec -i group-travel-postgres psql -U postgres -d group_travel < /tmp/schema.sql

# 4. Generate Prisma Client
npx prisma generate
```

## Database Connection Info

**Development**:
- Host: localhost
- Port: 5432
- Database: group_travel
- User: postgres
- Password: postgres
- Connection string: `postgresql://postgres:postgres@localhost:5432/group_travel`

**Docker Container**: `group-travel-postgres`

## Related Documentation

- [Prisma Schema](../prisma/schema.prisma) - Full database schema definition
- [Architecture Overview](./ARCHITECTURE.md) - System architecture
- [API Testing](../API_TESTING.md) - How to test endpoints

## References

- [Prisma P1010 Error Discussion](https://github.com/prisma/prisma/issues/22452)
- [PostgreSQL 14 Public Schema Changes](https://www.postgresql.org/docs/14/ddl-schemas.html#DDL-SCHEMAS-PUBLIC)
- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/troubleshooting-migrate)
