# Claude Code Guide - Tests

This file provides context for AI assistants working on tests.

## Testing Stack

| Tool | Purpose | Config |
|------|---------|--------|
| Playwright | E2E/Integration tests | `playwright.config.ts` |
| Jest | Backend unit tests (configured, not yet used) | `backend/package.json` |

## Current Test Files

```
tests/
├── example.spec.ts     # Playwright example (external site)
└── layout.spec.ts      # Layout integrity tests (active)
```

## Layout Test Invariants

The `layout.spec.ts` file verifies critical layout properties that MUST hold:

### Invariant 1: Hero Visual Isolation

```typescript
// Content must start BELOW hero (never overlap)
expect(contentBox.y).toBeGreaterThan(heroBox.y + heroBox.height - 1);
```

**Why**: Hero extends full-width under sidebar. Content must not overlap.

### Invariant 2: Sidebar Gutter

```typescript
// Sidebar must have positive width
expect(sidebarBox.width).toBeGreaterThan(0);
// Hero extends to left edge
expect(heroBox.x).toBeLessThanOrEqual(sidebarBox.width);
```

**Why**: Sidebar creates content gutter. Hero uses negative margin to extend past it.

### Invariant 3: Action Card Alignment

```typescript
// All action cards must align on same baseline
const tops = boxes.map(b => Math.round(b.top));
expect(new Set(tops).size).toBe(1);
```

**Why**: Action cards must appear in a row, not staggered.

### Invariant 4: Z-Index Layering

```typescript
// Sidebar z-index must be greater than hero z-index
expect(sidebarZ).toBeGreaterThan(heroZ);
```

**Why**: Sidebar must overlay hero, not vice versa.

### Invariant 5: Content Card Separation

```typescript
// All content cards must be below hero bottom edge
expect(cardBox.top).toBeGreaterThan(heroBox.bottom - 1);
```

**Why**: Cards should never visually intersect hero.

## Data-TestId Selectors

Tests rely on these markers:

| Selector | Purpose | Required For |
|----------|---------|--------------|
| `[data-testid="sidebar"]` | Sidebar navigation | Gutter, z-index tests |
| `[data-testid="hero"]` | Hero section | Isolation, layering tests |
| `[data-testid="main-content"]` | Main content area | Content flow tests |
| `[data-testid="action-card"]` | Quick action cards | Alignment tests |
| `[data-testid="content-card"]` | Trip/content cards | Separation tests |

### Adding New Testable Elements

1. Add `data-testid="descriptive-name"` to the element
2. Document in the table above
3. Add corresponding test in `layout.spec.ts` if layout-critical

## Auth Mocking Pattern

Tests mock authentication via localStorage injection:

```typescript
test.beforeEach(async ({ page }) => {
  // Navigate to same-origin page first
  await page.goto('http://localhost:3000/login');

  // Inject auth state
  await page.evaluate(() => {
    const authState = {
      state: {
        user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
        accessToken: 'mock-token-for-testing',
        isAuthenticated: true
      },
      version: 0
    };
    localStorage.setItem('wanderlust-auth', JSON.stringify(authState));
  });

  // Navigate to protected page
  await page.goto('http://localhost:3000/dashboard');
});
```

**Key**: LocalStorage key is `wanderlust-auth` (matches Zustand persist config).

## Animation Removal

Tests disable animations for consistent screenshots:

```typescript
await page.addStyleTag({
  content: `
    * {
      animation: none !important;
      transition: none !important;
    }
  `
});
```

## Running Tests

```bash
# From project root
npm run test              # Run all Playwright tests
npx playwright test       # Same as above
npx playwright test --ui  # Interactive UI mode
npx playwright show-report # View HTML report after run
```

## CI/CD Integration

`.github/workflows/playwright.yml`:

- Runs on push to main/master and all PRs
- Uses ubuntu-latest with Node LTS
- Uploads `playwright-report/` artifact (30-day retention)
- Retries: 0 locally, 2 on CI

## When to Add Tests

### Add Layout Tests When:

- Adding new full-width sections (hero-like)
- Changing sidebar dimensions
- Adding new card layouts that must align
- Modifying z-index on fixed elements

### Skip Tests When:

- Minor text changes
- Color/style tweaks that don't affect layout
- Backend-only changes

## Test Naming Conventions

```typescript
test.describe('Feature Area', () => {
  test('specific behavior being verified', async ({ page }) => {
    // Arrange - set up state
    // Act - perform action
    // Assert - verify outcome
  });
});
```

Example:

```typescript
test.describe('Trip Overview Layout Integrity', () => {
  test('hero is visually isolated and does not affect content flow', ...);
  test('sidebar establishes a fixed content gutter', ...);
  test('primary action cards align on a shared baseline', ...);
});
```

## Backend Testing (Planned)

Jest is configured in `backend/package.json` but no test files exist yet.

Future tests would go in:

```
backend/src/modules/auth/__tests__/auth.service.test.ts
backend/src/modules/trips/__tests__/trips.controller.test.ts
```

## Before Adding New Tests

- [ ] Used data-testid selectors (not CSS classes)
- [ ] Mocked auth state properly
- [ ] Disabled animations for layout tests
- [ ] Documented new invariants in this file
- [ ] Test passes locally before committing
