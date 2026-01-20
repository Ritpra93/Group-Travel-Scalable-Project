import { test } from '@playwright/test';

test.describe('Verify Sidebar Fix', () => {

  test.beforeEach(async ({ page }) => {
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
  });

  test('Check if custom class is applied and working', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    const mainElement = await page.locator('main');

    const inspection = await mainElement.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        className: el.className,
        classList: Array.from(el.classList),
        hasCustomClass: el.classList.contains('main-with-sidebar-offset'),
        marginLeft: computed.marginLeft,
        // Check CSS variable value
        sidebarWidthDesktop: computed.getPropertyValue('--sidebar-width-desktop').trim(),
        sidebarWidthMobile: computed.getPropertyValue('--sidebar-width-mobile').trim(),
      };
    });

    console.log('\n========================================');
    console.log('VERIFY SIDEBAR FIX');
    console.log('========================================\n');
    console.log('CLASS ATTRIBUTE:', inspection.className);
    console.log('CLASS LIST:', inspection.classList);
    console.log('Has custom class?', inspection.hasCustomClass);
    console.log('\nCSS VARIABLES:');
    console.log('  --sidebar-width-mobile:', inspection.sidebarWidthMobile);
    console.log('  --sidebar-width-desktop:', inspection.sidebarWidthDesktop);
    console.log('\nCOMPUTED MARGIN:');
    console.log('  margin-left:', inspection.marginLeft);
    console.log('\nEXPECTED: 256px (at 1280px viewport)');
    console.log('RESULT:', inspection.marginLeft === '256px' ? '✅ FIXED' : '❌ STILL BROKEN');
  });
});
