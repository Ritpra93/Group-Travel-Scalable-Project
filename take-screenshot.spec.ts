import { test } from '@playwright/test';

test('capture dashboard screenshot', async ({ page }) => {
  // Set up auth like in layout tests
  await page.addInitScript(() => {
    (window as any).playwrightTest = true;
    const authState = {
      state: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        accessToken: 'mock-token-for-testing',
        isAuthenticated: true,
        isLoading: false
      },
      version: 0
    };
    localStorage.setItem('wanderlust-auth', JSON.stringify(authState));
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  
  // Wait for loading to complete
  const loadingIndicator = page.locator('[data-testid="auth-loading"]');
  await loadingIndicator.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  
  await page.locator('[data-testid="hero"]').waitFor({ state: 'visible', timeout: 15000 });
  
  // Take full page screenshot
  await page.screenshot({ path: 'dashboard-current.png', fullPage: true });
  
  console.log('Screenshot saved to dashboard-current.png');
});
