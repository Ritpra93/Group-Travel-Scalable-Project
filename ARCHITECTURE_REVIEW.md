# Wanderlust Codebase - Full Architectural Review

> **Note**: This file is in .gitignore and should not be committed. It serves as a working reference during the refactoring process.

## Executive Summary (TL;DR)

**Overall Assessment: 7.5/10 - Well-architected MVP, NOT production-ready**

- **Strong Foundation**: Clean 4-layer backend architecture, well-defined frontend component hierarchy, comprehensive real-time infrastructure with Socket.IO + Redis adapter
- **Critical Blocker**: Prisma P1010 workaround using Kysely creates dual-maintenance burden (schema.prisma + database.types.ts must stay in sync manually)
- **Testing Gap**: Only Playwright E2E tests exist; Jest configured but 0 unit tests written for backend business logic
- **Documentation Excellence**: CLAUDE.md files across the codebase are exceptional - detailed, accurate, and well-maintained
- **Security Gap**: Hardcoded database credentials in `kysely.ts` lines 13-20 are a deployment blocker

**Verdict**: Suitable for continued development and internal demos. Requires 3-4 weeks of stabilization before production deployment.

---

## What's Working Well

### 1. Backend Module Architecture (Excellent)

Consistent 4-layer pattern across all 8 modules:
```
backend/src/modules/{feature}/
├── {feature}.routes.ts      # Express router + middleware
├── {feature}.controller.ts  # Parse request, format response
├── {feature}.service.ts     # Business logic, DB queries
├── {feature}.middleware.ts  # Permission checks
└── {feature}.types.ts       # TypeScript + Zod schemas
```

**Evidence of quality**:
- `polls.service.ts` (840 LOC) - Complex voting logic with proper transaction boundaries
- `expenses.service.ts` (749 LOC) - Three split strategies (EQUAL, CUSTOM, PERCENTAGE) with proper validation
- Consistent use of AppError hierarchy for error handling

### 2. Real-Time Infrastructure (Production-Ready)

```
backend/src/websocket/
├── index.ts                 # Socket.IO with Redis adapter for horizontal scaling
├── socket.middleware.ts     # JWT authentication
├── handlers/                # Connection & room management
└── emitters/                # Event broadcast functions
```

- 11 typed events (poll, expense, itinerary)
- Emitters called after DB commits ensuring data consistency
- Redis adapter enables horizontal scaling

### 3. Frontend Component Hierarchy (Clean)

```
frontend/components/
├── ui/          # Atomic, stateless (button, card, input)
├── patterns/    # Composed, with hooks (expense-form, poll-form)
└── sections/    # Full-page sections (Hero)
```

Rules enforced: ui/ never imports from patterns/; patterns/ never imports from sections/

### 4. Authentication Flow (Solid)

- JWT with proper token refresh (`frontend/lib/api/client.ts:68-172`)
- Request queuing during token refresh prevents cascading 401s
- Zustand persistence with hydration handling
- AuthGuard waits for hydration before route protection

### 5. Conflict Detection (Already Implemented)

Optimistic locking for concurrent edits:
- Client sends `clientUpdatedAt` when editing
- Server compares with `updatedAt`, throws `ConflictError` (409) on mismatch
- Frontend shows conflict UI with refresh option

### 6. Documentation (Above Average)

- Root `CLAUDE.md`: Comprehensive build reference with MVP matrix
- `backend/CLAUDE.md`: Module patterns, auth details
- `frontend/CLAUDE.md`: Layout coupling warnings, component rules
- Layout coupling documented with exact line numbers

---

## Key Risks & Architectural Concerns

### HIGH Priority (Production Blockers)

| Risk | Location | Impact |
|------|----------|--------|
| **Prisma P1010 Workaround** | `backend/src/config/kysely.ts` | Dual-maintenance of schema.prisma and database.types.ts; manual migrations not production-safe |
| **Hardcoded DB Credentials** | `backend/src/config/kysely.ts:13-20` | Security vulnerability - credentials exposed in source code |
| **No Backend Unit Tests** | `backend/src/__tests__/` | Critical paths untested; refactoring is risky |
| **Manual SQL Migrations** | `backend/docs/CRITICAL_CHANGES.md` | Data integrity risk in production deployments |

### MEDIUM Priority (Technical Debt)

| Risk | Location | Impact |
|------|----------|--------|
| **Large Component Files** | `expense-form.tsx` (729 lines), `poll-form.tsx` (444 lines) | Hard to test, hard to maintain |
| **Layout Width Coupling** | 4 locations syncing sidebar width | Layout breaks if values drift (mitigated by Playwright tests) |
| **Singleton Services** | All services exported as singletons | Makes unit testing harder, no dependency injection |
| **No Shared Types Package** | Frontend/backend types maintained separately | Risk of type drift between systems |
| **Rate Limiting In-Memory** | Not using Redis-based limiter | Won't work in distributed deployment |

### LOW Priority (Nice to Fix)

| Risk | Location |
|------|----------|
| Mock data in layout | `frontend/app/(app)/layout.tsx:31-39` |
| Debug test files | `tests/` contains css-*.spec.ts files |
| No CI linting | GitHub Actions only runs Playwright |

---

## Detailed Findings

### 1. Context & Intent

**Business Goal**: Collaborative trip planning with:
- Group decision-making via polls
- Expense splitting with multiple strategies
- Real-time updates for all group members
- Role-based access (OWNER > ADMIN > MEMBER > VIEWER)

**Architecture supports goals well** - backend-first development, real-time as first-class concern, clear domain boundaries.

**Missing context**:
- Is "Activity Suggestions" (P11) still planned? No implementation started.
- Multi-currency scope? Schema has `currency` field but no exchange rate handling.

### 2. Architectural Design

**Layering**: Excellent separation
- Controllers never access database directly
- Services never import from controllers
- Middleware is pure and stateless

**Patterns Applied**:
- Repository-ish: Services as data access via Kysely
- Observer: WebSocket emitters called post-commit
- Strategy: Split calculation uses type-specific algorithms

**Coupling Concerns**:
- Sidebar width in 4 locations (documented, tested via Playwright)
- Frontend expects specific API response shape without shared types

### 3. Maintainability & Scalability

**Strengths**:
- Consistent naming conventions
- JSDoc on service methods
- TypeScript strict mode
- Pagination on all list endpoints
- Database indexes defined

**Concerns**:
- Poll results aggregated in-memory (may need caching for large polls)
- Balance calculation has multiple queries per user
- No request caching layer

### 4. System-Level Impact

**Performance**:
- 30-second API timeout configured
- No query timeouts on Kysely connections

**Edge Cases Not Handled**:
- Timezone differences in itinerary (stored as UTC, no conversion)
- Currency conversion between trips
- Auto-close for poll deadlines (no background job)

### 5. Security & Reliability

**Strengths**:
- Helmet.js security headers
- CORS whitelist
- JWT with separate access/refresh secrets
- Rate limiting via Redis
- httpOnly cookies for refresh tokens

**Gaps**:
- **Critical**: Hardcoded credentials in kysely.ts
- **Medium**: No CSRF protection
- **Low**: Activity logging not comprehensive

### 6. Testing & Quality Signals

**Current Coverage**:
- Playwright E2E: 2 active suites (layout, auth-layout)
- Jest: Configured, ~1 test file
- No API integration tests
- No frontend component tests

**Gaps**:
- No happy-path API tests
- No error scenario tests
- No WebSocket event tests

### 7. Engineering Maturity

**CI/CD**:
- GitHub Actions runs Playwright on PR/push
- No linting in CI
- No staging environment
- No deployment automation

**Production Readiness Checklist** (incomplete):
- [ ] Prisma P1010 resolution
- [ ] Proper migration strategy
- [ ] Connection pooling configuration
- [ ] Database backup strategy
- [ ] Monitoring/alerting setup

---

## Recommended Next Steps (Prioritized)

### Immediate (Week 1) - HIGH Risk / HIGH Impact

1. **Fix Hardcoded Credentials**
   - File: `backend/src/config/kysely.ts`
   - Action: Move credentials to environment variables
   - Effort: 1 hour
   - Status: [ ] Not Started

2. **Add CI Linting**
   - File: `.github/workflows/playwright.yml`
   - Action: Add `npm run lint` and `npm run type-check` steps
   - Effort: 2 hours
   - Status: [ ] Not Started

3. **Backend Test Infrastructure (All Modules)**
   - Create shared test setup with supertest + Jest
   - Build test infrastructure that covers all modules equally
   - Focus: auth, expenses, polls, groups, trips, itinerary
   - Effort: 3-4 days
   - Status: [ ] Not Started

### Short-Term (Weeks 2-3) - MEDIUM Risk / HIGH Impact

4. **Improve Kysely Type Sync (Long-term Solution)**
   - Decision: Keep Kysely as permanent solution
   - Action: Adopt `prisma-kysely` package for automated type generation
   - Eliminates manual sync between schema.prisma and database.types.ts
   - Effort: 1 day
   - Status: [ ] Not Started

5. **Implement Proper Migrations**
   - Evaluate: Atlas, Flyway, or golang-migrate
   - Create baseline migration for current schema
   - Document rollback procedures
   - Status: [ ] Not Started

6. **Refactor Large Frontend Components**
   - Decision: Refactor now before adding more features
   - expense-form.tsx (729 lines) → Extract step components
   - poll-form.tsx (444 lines) → Extract options/settings components
   - Effort: 2-3 days
   - Status: [ ] Not Started

### Medium-Term (Weeks 4-6) - LOW Risk / MEDIUM Impact

7. **Frontend Component Tests**
   - Set up React Testing Library + Vitest
   - Test refactored ExpenseForm, PollForm components
   - Test AuthGuard edge cases
   - Status: [ ] Not Started

8. **Add Request Caching**
   - Cache user profiles, group membership
   - Invalidate on mutations
   - Status: [ ] Not Started

9. **Monitoring Integration**
   - Integrate Sentry (DSN already in env schema)
   - Add source maps for production
   - Status: [ ] Not Started

---

## Phased Refactoring Plan

### Phase A: Security Hardening (2 PRs)

**PR 1: Environment Variable Cleanup**
- File: `backend/src/config/kysely.ts`
- Change: Parse DATABASE_URL from env instead of hardcoded values
- Risk: Low
- Status: [ ] Not Started

**PR 2: CI Pipeline Enhancement**
- File: `.github/workflows/playwright.yml`
- Change: Add lint + type-check steps
- Risk: Low (may surface existing errors)
- Status: [ ] Not Started

### Phase B: Test Infrastructure (3 PRs)

**PR 3: Backend Test Setup + All Modules**
- Files: `backend/src/__tests__/setup.ts`, `backend/jest.config.js`
- Change: Configure Jest with proper DB mocking
- Create test files for all 8 modules with consistent patterns
- Status: [ ] Not Started

**PR 4: API Integration Tests**
- Files: `backend/src/__tests__/integration/`
- Change: Add supertest-based endpoint tests for all modules
- Priority: auth, expenses, polls (most complex)
- Status: [ ] Not Started

**PR 5: Kysely Type Automation**
- Files: `backend/package.json`, `backend/src/config/database.types.ts`
- Change: Add prisma-kysely for automated type generation
- Eliminates manual type sync burden
- Status: [ ] Not Started

### Phase C: Frontend Refactoring (3 PRs) - PRIORITY

**PR 6: ExpenseForm Decomposition**
- File: `frontend/components/patterns/expense-form.tsx`
- Extract: `ExpenseFormBasicInfo.tsx`, `ExpenseFormSplitConfig.tsx`, `ExpenseFormReview.tsx`
- Risk: Medium - requires visual review
- Status: [ ] Not Started

**PR 7: PollForm Decomposition**
- File: `frontend/components/patterns/poll-form.tsx`
- Extract: `PollFormOptions.tsx`, `PollFormSettings.tsx`
- Risk: Medium - requires visual review
- Status: [ ] Not Started

**PR 8: Component Tests (After Refactoring)**
- Files: `frontend/__tests__/`
- Change: Add React Testing Library tests for refactored components
- Easier to test smaller, focused components
- Status: [ ] Not Started

### Phase D: Production Readiness (3 PRs)

**PR 9: Migration System**
- Files: `backend/migrations/`, new tooling
- Change: Adopt migration framework
- Status: [ ] Not Started

**PR 10: Monitoring Integration**
- Files: Error boundaries, Sentry config
- Change: Add error tracking
- Status: [ ] Not Started

**PR 11: Production Configuration**
- Files: Docker configs, env templates
- Change: Connection pooling, secrets management
- Status: [ ] Not Started

---

## Critical Files Reference

| Purpose | Path |
|---------|------|
| Hardcoded credentials (FIX) | `backend/src/config/kysely.ts:13-20` |
| Prisma/Kysely documentation | `backend/docs/CRITICAL_CHANGES.md` |
| Largest backend service | `backend/src/modules/polls/polls.service.ts` (840 LOC) |
| Largest frontend component | `frontend/components/patterns/expense-form.tsx` (729 LOC) |
| Auth flow + error handling | `frontend/lib/api/client.ts` |
| Layout coupling reference | `CLAUDE.md` (section 8) |
| CI/CD workflow | `.github/workflows/playwright.yml` |

---

## Decisions Made

Based on user input:

1. **Prisma/Kysely**: Keep Kysely as the long-term solution. Will adopt `prisma-kysely` for automated type generation.

2. **Testing Priority**: Build test infrastructure covering all modules equally (auth, expenses, polls, groups, trips, itinerary).

3. **Frontend Refactoring**: Refactor large components NOW before adding more features. expense-form.tsx and poll-form.tsx will be decomposed into smaller components.

---

## Verification Plan

After implementation, verify changes work correctly:

1. **Security Fix**: Run backend with production env vars, confirm no hardcoded credentials used
2. **CI Pipeline**: Push a PR and verify lint + type-check steps run
3. **Tests**: Run `npm test` in backend, verify all modules have passing tests
4. **Type Sync**: Modify schema.prisma, run prisma-kysely, confirm database.types.ts auto-updates
5. **Component Refactoring**: Visual regression testing via Playwright screenshots
6. **Integration**: Run full E2E test suite (`npm run test` from root)

---

## Progress Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-01-30 | Architectural Review Complete | Done | Plan approved |
| 2026-01-30 | Fix hardcoded DB credentials | Done | kysely.ts now parses DATABASE_URL from env |
| 2026-01-30 | Add CI linting | Done | Added lint job with continue-on-error (pre-existing issues) |
| 2026-01-30 | Backend test infrastructure | Done | 103 tests passing, mocks for Kysely + fixtures |
| 2026-01-30 | prisma-kysely automation | Done | Types auto-generated from schema.prisma |
| | | | |
