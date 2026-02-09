# TEST AUDIT: Wanderlust Test Suite Evaluation

**Date**: 2026-02-01
**Purpose**: Evaluate test suite quality, identify low-value tests, and document recommendations for production readiness.

---

## Executive Summary

**Total Test Files Analyzed**: 14
**Total Test Cases**: ~160+
**Verdict**: Mixed quality - Backend tests are largely HIGH VALUE, Playwright tests include many debug/diagnostic files that should be DELETED

---

## BACKEND TESTS AUDIT

### 1. `backend/src/modules/auth/__tests__/auth.service.test.ts`

| Test Name | Value Rating | What It Actually Tests | Should It Exist? |
|-----------|--------------|------------------------|------------------|
| `register - new user successfully` | **High-value** | User creation flow with hashing, token generation | ✅ Keep |
| `register - weak password` | **High-value** | Password validation rejection | ✅ Keep |
| `register - email already exists` | **High-value** | Conflict detection for duplicate emails | ✅ Keep |
| `login - valid credentials` | **High-value** | Authentication success path | ✅ Keep |
| `login - non-existent user` | **High-value** | 401 for missing user | ✅ Keep |
| `login - wrong password` | **High-value** | 401 for bad password | ✅ Keep |
| `logout - blacklist token` | **High-value** | Token invalidation | ✅ Keep |
| `logout - invalid token idempotent` | **Medium-value** | Error tolerance | ✅ Keep |
| `refreshTokens - success` | **High-value** | Token refresh flow | ✅ Keep |
| `refreshTokens - blacklisted` | **High-value** | Blacklist enforcement | ✅ Keep |
| `Password Validation (Unit)` | **High-value** | Tests REAL password util without mocking | ✅ Keep |

**Assessment**: ✅ **GOOD TEST FILE** - Tests real security-critical behavior.

**Issues**:
- Heavy mocking of database (necessary for unit tests, but integration tests would add more confidence)
- Tests SERVICE layer, not integration with HTTP layer

---

### 2. `backend/src/modules/auth/__tests__/auth.controller.test.ts`

| Test Name | Value Rating | What It Actually Tests | Should It Exist? |
|-----------|--------------|------------------------|------------------|
| `register - 201 response` | **High-value** | HTTP response format for success | ✅ Keep |
| `register - ValidationError for invalid email` | **High-value** | Zod validation rejects bad email | ✅ Keep |
| `register - missing fields` | **High-value** | Required field enforcement | ✅ Keep |
| `register - short password` | **High-value** | Min length validation | ✅ Keep |
| `register - ConflictError on duplicate` | **High-value** | 409 response for duplicate email | ✅ Keep |
| `login - 200 with httpOnly cookie` | **High-value** | Cookie security settings | ✅ Keep |
| `login - invalid email format` | **High-value** | Input validation | ✅ Keep |
| `login - missing password` | **High-value** | Required field enforcement | ✅ Keep |
| `logout - clears cookie` | **High-value** | Session cleanup | ✅ Keep |
| `logout - backwards compatibility` | **Medium-value** | Body token support | ✅ Keep |
| `logout - prefers cookie over body` | **Medium-value** | Priority behavior | ✅ Keep |
| `refresh - updates cookie` | **High-value** | Token rotation | ✅ Keep |
| `refresh - no cookie returns 401` | **High-value** | Missing token rejection | ✅ Keep |
| `me - returns user without passwordHash` | **High-value** | Security: no password leak | ✅ Keep |

**Assessment**: ✅ **GOOD TEST FILE** - Tests controller/HTTP layer behavior correctly.

**Minor Issue**: Mocks `authService` entirely, so doesn't catch integration bugs between controller and service.

---

### 3. `backend/src/modules/expenses/__tests__/expenses.utils.test.ts`

| Test Category | Value Rating | What It Tests | Should It Exist? |
|---------------|--------------|---------------|------------------|
| `calculateEqualSplits` (10 tests) | **High-value behavioral** | Money splitting with remainders, edge cases | ✅ Keep ALL |
| `calculatePercentageSplits` (16 tests) | **High-value behavioral** | Percentage-based splits, rounding | ✅ Keep ALL |
| `calculateOptimalSettlements` (15 tests) | **High-value behavioral** | Greedy settlement algorithm | ✅ Keep ALL |

**Assessment**: ✅ **EXCELLENT TEST FILE** - Pure function tests with NO MOCKING.

**Why it's excellent**:
- Tests REAL calculation functions (no mocking)
- Covers edge cases: floating-point precision, IEEE 754 problems, penny splits
- Verifies sum invariants (money is conserved)
- Would catch real bugs if calculation logic changed

---

### 4. `backend/src/modules/expenses/__tests__/expenses.service.test.ts`

| Test Name | Value Rating | What It Tests | Should It Exist? |
|-----------|--------------|---------------|------------------|
| `calculateEqualSplits - 2 users` | **Low-value / Duplicate** | Same as utils.test.ts | ❌ Remove |
| `calculateEqualSplits - 3 users` | **Low-value / Duplicate** | Same as utils.test.ts | ❌ Remove |
| `calculatePercentageSplits - 50/50` | **Low-value / Duplicate** | Same as utils.test.ts | ❌ Remove |
| `calculatePercentageSplits - 70/30` | **Low-value / Duplicate** | Same as utils.test.ts | ❌ Remove |
| `Settlement Algorithm` | **Medium-value** | Tests service orchestration | ⚠️ Fragile (heavy mocking) |
| `getExpense - NotFoundError` | **High-value** | Error handling for missing expense | ✅ Keep |
| `getExpense - ForbiddenError` | **High-value** | Permission enforcement | ✅ Keep |
| `deleteExpense - NotFoundError` | **High-value** | Error handling | ✅ Keep |
| `updateSplit - NotFoundError expense` | **High-value** | Error handling | ✅ Keep |
| `updateSplit - NotFoundError split` | **High-value** | Error handling | ✅ Keep |
| `updateSplit - ForbiddenError` | **High-value** | Permission enforcement | ✅ Keep |
| `Validation - splitWith required` | **High-value** | Business rule enforcement | ✅ Keep |
| `Validation - customSplits required` | **High-value** | Business rule enforcement | ✅ Keep |
| `Validation - percentageSplits required` | **High-value** | Business rule enforcement | ✅ Keep |

**Assessment**: ⚠️ **MIXED QUALITY**

**Issues**:
1. First 4 tests are DUPLICATES of expenses.utils.test.ts - DELETE THEM
2. Settlement test has very complex mocking - fragile, hard to maintain
3. Error handling tests are good but could use integration tests

---

### 5. `backend/src/modules/expenses/__tests__/expenses.integration.test.ts`

| Test Category | Value Rating | What It Tests | Should It Exist? |
|---------------|--------------|---------------|------------------|
| `calculateBalance` (7 tests) | **High-value** | String-to-number conversion from DB | ✅ Keep |
| `buildSettlementResponse` (8 tests) | **High-value** | End-to-end settlement flow | ✅ Keep |
| `Money Conservation Invariant` (2 tests) | **High-value** | Sum of balances = 0 | ✅ Keep |

**Assessment**: ✅ **EXCELLENT TEST FILE**

**Why it's excellent**:
- Tests the INTEGRATION between balance calculation and settlement
- Verifies mathematical invariants (money conservation)
- Simulates real DB string types (Kysely Decimal)
- NO excessive mocking - uses helper functions that mirror real code

---

## PLAYWRIGHT E2E TESTS AUDIT

### 6. `tests/layout.spec.ts` - **KEEP**

| Test Name | Value Rating | What It Tests | Should It Exist? |
|-----------|--------------|---------------|------------------|
| `hero is visually isolated` | **High-value** | Hero doesn't overlap content | ✅ Keep |
| `sidebar establishes fixed gutter` | **High-value** | Layout integrity | ✅ Keep |
| `action cards align on baseline` | **High-value** | UI alignment | ✅ Keep |
| `hero never overlays UI chrome` | **High-value** | Z-index layering | ✅ Keep |
| `content cards never intersect hero` | **High-value** | Layout separation | ✅ Keep |

**Assessment**: ✅ **GOOD TEST FILE** - Catches real layout regressions.

---

### 7. `tests/example.spec.ts` - **DELETE**

| Test Name | Value Rating | What It Tests | Should It Exist? |
|-----------|--------------|---------------|------------------|
| `has title` | **Placebo** | Playwright.dev website | ❌ Delete |
| `get started link` | **Placebo** | Playwright.dev website | ❌ Delete |

**Assessment**: ❌ **DELETE ENTIRE FILE** - Tests external website, not your app.

---

### 8. `tests/ui-diagnosis.spec.ts` - **DELETE**

| Test Name | Value Rating | What It Tests |
|-----------|--------------|---------------|
| `Issue #1: Sidebar overlap` | **Debug tool** | Console.log diagnostics |
| `Issue #1b: Sidebar trips page` | **Debug tool** | Console.log diagnostics |
| `Issue #2: Hero text clipping` | **Debug tool** | Console.log diagnostics |
| `Issue #3: Button sizing` | **Debug tool** | Console.log diagnostics |

**Assessment**: ❌ **DELETE ENTIRE FILE** - These are diagnostic scripts, not tests. They:
- Have NO assertions that would fail
- Only output to console
- Were used for debugging, not regression prevention

---

### 9. `tests/css-investigation.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - Pure debugging script with console.log, no assertions.

---

### 10. `tests/check2-known-utility.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - Debug script for CSS utility investigation, not a test.

---

### 11. `tests/css-loading-check.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - One-off CSS loading debug script.

---

### 12. `tests/verify-fix.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - One-off verification script with console.log.

---

### 13. `tests/comprehensive-check.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - Debug comprehensive check.

---

### 14. `tests/hero-clipping-check.spec.ts` - **DELETE**

**Assessment**: ❌ **DELETE ENTIRE FILE** - One-off debug script.

---

## SUMMARY TABLE

| File | Action | Reason |
|------|--------|--------|
| `auth.service.test.ts` | ✅ Keep | High-value security tests |
| `auth.controller.test.ts` | ✅ Keep | High-value HTTP layer tests |
| `expenses.utils.test.ts` | ✅ Keep | Excellent pure function tests |
| `expenses.service.test.ts` | ⚠️ Partial | Delete duplicate tests (lines 59-105) |
| `expenses.integration.test.ts` | ✅ Keep | Excellent integration tests |
| `layout.spec.ts` | ✅ Keep | Catches real layout bugs |
| `example.spec.ts` | ❌ Delete | Tests wrong website |
| `ui-diagnosis.spec.ts` | ❌ Delete | Debug script, no assertions |
| `css-investigation.spec.ts` | ❌ Delete | Debug script, no assertions |
| `check2-known-utility.spec.ts` | ❌ Delete | Debug script |
| `css-loading-check.spec.ts` | ❌ Delete | Debug script |
| `verify-fix.spec.ts` | ❌ Delete | Debug script |
| `comprehensive-check.spec.ts` | ❌ Delete | Debug script |
| `hero-clipping-check.spec.ts` | ❌ Delete | Debug script |

---

## CLEANUP CHECKLIST

### Files to Delete

```
tests/example.spec.ts
tests/ui-diagnosis.spec.ts
tests/css-investigation.spec.ts
tests/check2-known-utility.spec.ts
tests/css-loading-check.spec.ts
tests/verify-fix.spec.ts
tests/comprehensive-check.spec.ts
tests/hero-clipping-check.spec.ts
take-screenshot.spec.ts (if exists in root)
```

### Code to Remove

**File**: `backend/src/modules/expenses/__tests__/expenses.service.test.ts`

Remove the "Split Calculations (via utils)" describe block (lines 59-105) - these are duplicates of `expenses.utils.test.ts`.

---

## WHAT MAKES A TEST HIGH-VALUE

Tests that remain are high-value because they:

1. **Test real behavior** - Not implementation details
2. **Would fail if production broke** - Assertions verify actual outcomes
3. **Don't over-mock** - Pure function tests have zero mocking
4. **Cover edge cases** - Floating-point precision, empty arrays, boundary conditions
5. **Verify security properties** - Password not leaked, tokens blacklisted
6. **Test mathematical invariants** - Money conservation, sum checks

---

## PRODUCTION READINESS: TEST GAPS

### Missing Tests (Should Add Before Production)

1. **API Integration Tests** - Test actual HTTP endpoints with supertest
2. **WebSocket Event Tests** - Verify real-time events emit correctly
3. **Group Permission Tests** - Test role-based access control
4. **Poll Business Logic Tests** - Test voting, deadline handling
5. **Itinerary CRUD Tests** - Test conflict detection with optimistic locking

### Test Infrastructure Improvements

1. **Shared Test Setup** - Create `backend/src/__tests__/setup.ts` with common mocks
2. **Test Database** - Use test database or proper mocking strategy
3. **CI Integration** - Add `npm test` to GitHub Actions workflow

---

## VERIFICATION AFTER CLEANUP

After implementing cleanup:

1. Run `npm test` in `backend/` - all remaining tests should pass
2. Run `npx playwright test tests/layout.spec.ts` - layout tests should pass
3. Verify CI pipeline still works
4. Total test count will decrease but test VALUE will increase

---

## FUTURE REVIEW CHECKLIST

When adding new features, evaluate each test against these criteria:

- [ ] Does this test verify user-visible behavior?
- [ ] Would this test fail if the feature broke?
- [ ] Is the test independent of implementation details?
- [ ] Is mocking limited to network/auth boundaries?
- [ ] Are assertions on outcomes, not on internal state?

If any answer is "no", reconsider the test approach.
