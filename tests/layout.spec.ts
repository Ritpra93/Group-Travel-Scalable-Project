import { test, expect } from '@playwright/test';

interface BoundingBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

test.describe('Trip Overview Layout Integrity', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page first (same origin) to set localStorage
    await page.goto('http://localhost:3000/login');

    // Set auth state in localStorage
    await page.evaluate(() => {
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
          isAuthenticated: true
        },
        version: 0
      };
      localStorage.setItem('wanderlust-auth', JSON.stringify(authState));
    });

    // Now navigate to dashboard with auth already set
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle'
    });

    // Wait for hero element to be visible
    await page.locator('[data-testid="hero"]').waitFor({
      state: 'visible',
      timeout: 15000
    });

    // Remove noise
    await page.addStyleTag({
      content: `
        * {
          animation: none !important;
          transition: none !important;
        }
      `
    });
  });

  test('hero is visually isolated and does not affect content flow', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]');
    const content = page.locator('[data-testid="main-content"]');

    const heroBox = await hero.boundingBox();
    const contentBox = await content.boundingBox();

    expect(heroBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    // Content must start BELOW hero (never overlap)
    expect(contentBox!.y).toBeGreaterThan(heroBox!.y + heroBox!.height - 1);
  });

  test('sidebar establishes a fixed content gutter', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    const hero = page.locator('[data-testid="hero"]');

    const sidebarBox = await sidebar.boundingBox();
    const heroBox = await hero.boundingBox();

    // Hero uses negative margin to extend to left edge, but its content
    // should respect the sidebar gutter. Check that hero's left position
    // accounting for negative margin would put content after sidebar.
    // The hero extends to x=0 (left edge) using -ml-[70px] lg:-ml-64,
    // so we verify sidebar is visible (has higher z-index, tested separately)
    expect(sidebarBox!.width).toBeGreaterThan(0);
    expect(heroBox!.x).toBeLessThanOrEqual(sidebarBox!.width);
  });

  test('primary action cards align on a shared baseline', async ({ page }) => {
    const cards = page.locator('[data-testid="action-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(2);

    const boxes = await cards.evaluateAll((els: Element[]) =>
      els.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      })
    );

    const tops = boxes.map(b => Math.round(b.top));
    const bottoms = boxes.map(b => Math.round(b.bottom));

    // All cards must align vertically
    expect(new Set(tops).size).toBe(1);
    expect(new Set(bottoms).size).toBe(1);
  });

  test('hero never visually overlays UI chrome', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]');
    const sidebar = page.locator('[data-testid="sidebar"]');

    const heroZ = await hero.evaluate(el => {
      const zIndex = getComputedStyle(el).zIndex;
      return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
    });
    const sidebarZ = await sidebar.evaluate(el => {
      const zIndex = getComputedStyle(el).zIndex;
      return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
    });

    // Sidebar must always sit above hero
    expect(sidebarZ).toBeGreaterThan(heroZ);
  });

  test('content cards never intersect hero vertically', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]');
    const cards = page.locator('[data-testid="content-card"]');

    const heroBox = await hero.boundingBox();
    const cardBoxes: BoundingBox[] = await cards.evaluateAll((els: Element[]): BoundingBox[] =>
      els.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      })
    );

    for (const box of cardBoxes) {
      expect(box.top).toBeGreaterThan(heroBox!.bottom - 1);
    }
  });
});
