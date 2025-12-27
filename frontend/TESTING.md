# Testing Guide for Wanderlust Frontend

## Overview

This document outlines the testing strategy and setup for the Wanderlust frontend application.

## Testing Stack

- **Test Framework**: Jest
- **React Testing**: React Testing Library
- **E2E Testing**: Playwright (recommended)
- **API Mocking**: MSW (Mock Service Worker)

## Setup

### Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

### Jest Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

### Update package.json

Add test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Test Examples

### 1. Component Tests

#### Button Component Test (`components/ui/__tests__/button.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toContainHTML('svg'); // Loading spinner
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(button).toHaveClass('bg-secondary');
  });
});
```

### 2. Hook Tests

#### useTrips Hook Test (`lib/api/hooks/__tests__/use-trips.test.tsx`)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrips } from '../use-trips';
import { tripsService } from '../../services/trips.service';

jest.mock('../../services/trips.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTrips', () => {
  it('fetches trips successfully', async () => {
    const mockTrips = [
      { id: '1', name: 'Test Trip', destination: 'Paris' },
    ];

    (tripsService.getTrips as jest.Mock).mockResolvedValue({
      data: mockTrips,
      meta: { total: 1 },
    });

    const { result } = renderHook(() => useTrips(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      data: mockTrips,
      meta: { total: 1 },
    });
  });

  it('handles error states', async () => {
    (tripsService.getTrips as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useTrips(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
```

### 3. Page Tests

#### Trips Page Test (`app/(app)/trips/__tests__/page.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TripsPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TripsPage', () => {
  it('renders the page title', () => {
    render(<TripsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/trips/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<TripsPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

- **Components**: 80%+ coverage
- **Hooks**: 90%+ coverage
- **Services**: 85%+ coverage
- **Pages**: 70%+ coverage

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText, etc.)
3. **Mock external dependencies** (API calls, next/navigation, etc.)
4. **Test error states and edge cases**
5. **Keep tests focused and isolated**
6. **Use data-testid sparingly** (prefer semantic queries)

## E2E Testing with Playwright

### Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Example E2E Test (`e2e/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
  });

  test('user can login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
  });
});
```

## Next Steps

1. Install testing dependencies
2. Create jest.config.js and jest.setup.js
3. Write tests for critical components
4. Set up CI/CD to run tests automatically
5. Add test coverage reporting
