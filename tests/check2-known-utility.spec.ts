import { test } from '@playwright/test';

test.describe('Check 2 - Known Utility Test', () => {

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

  test('Test if lg:ml-64 works at 1280px viewport', async ({ page }) => {
    // Set viewport to 1280px (above lg breakpoint)
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    const mainElement = await page.locator('main');

    const inspection = await mainElement.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        className: el.className,
        marginLeft: computed.marginLeft,
        // Check if lg:ml-64 is in classList
        hasLgMl64: el.classList.contains('lg:ml-64'),
        // Check if ml-[70px] is in classList
        hasMl70px: el.className.includes('ml-[70px]'),
        // Get all classes
        classList: Array.from(el.classList)
      };
    });

    console.log('\n========================================');
    console.log('CHECK 2: KNOWN UTILITY TEST @ 1280px');
    console.log('========================================\n');
    console.log('VIEWPORT: 1280px x 720px (>= 1024px lg breakpoint)');
    console.log('\nCLASS ATTRIBUTE:', inspection.className);
    console.log('\nCLASS LIST:', inspection.classList);
    console.log('\nCLASS DETECTION:');
    console.log('  Has lg:ml-64 class:', inspection.hasLgMl64);
    console.log('  Has ml-[70px] class:', inspection.hasMl70px);
    console.log('\nCOMPUTED STYLE:');
    console.log('  margin-left:', inspection.marginLeft);
    console.log('\n🔍 EXPECTED:');
    console.log('  At 1280px width, lg:ml-64 SHOULD apply');
    console.log('  Expected margin-left: 256px (16rem = 0.25rem * 64)');
    console.log('\n🔍 ACTUAL:');
    console.log('  margin-left is:', inspection.marginLeft);
    console.log('  Match expected?', inspection.marginLeft === '256px' ? 'YES ✅' : 'NO ❌');

    if (inspection.marginLeft === '256px') {
      console.log('\n✅ CONCLUSION: lg:ml-64 CSS rule EXISTS and WORKS');
      console.log('   Problem is: ml-[70px] is MISSING for mobile/base styles');
    } else if (inspection.marginLeft === '0px') {
      console.log('\n❌ CONCLUSION: Even lg:ml-64 is not applying');
      console.log('   This suggests CSS bundle not loaded or media query issue');
    } else {
      console.log('\n⚠️  CONCLUSION: Unexpected margin-left value');
    }
  });

  test('Test at 375px viewport (mobile - should use ml-[70px])', async ({ page }) => {
    // Set viewport to 375px (below lg breakpoint)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    const mainElement = await page.locator('main');

    const inspection = await mainElement.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        className: el.className,
        marginLeft: computed.marginLeft,
        hasMl70px: el.className.includes('ml-[70px]')
      };
    });

    console.log('\n========================================');
    console.log('CHECK 2: MOBILE VIEWPORT TEST @ 375px');
    console.log('========================================\n');
    console.log('VIEWPORT: 375px x 667px (< 1024px, below lg breakpoint)');
    console.log('\nCLASS ATTRIBUTE:', inspection.className);
    console.log('  Has ml-[70px] class:', inspection.hasMl70px);
    console.log('\nCOMPUTED STYLE:');
    console.log('  margin-left:', inspection.marginLeft);
    console.log('\n🔍 EXPECTED:');
    console.log('  At 375px width, ml-[70px] SHOULD apply (base, non-responsive)');
    console.log('  Expected margin-left: 70px');
    console.log('\n🔍 ACTUAL:');
    console.log('  margin-left is:', inspection.marginLeft);
    console.log('  Match expected?', inspection.marginLeft === '70px' ? 'YES ✅' : 'NO ❌');

    if (inspection.marginLeft === '0px') {
      console.log('\n❌ CONCLUSION: ml-[70px] CSS rule DOES NOT EXIST');
      console.log('   Tailwind v4 did not generate arbitrary value utility');
    }
  });
});
