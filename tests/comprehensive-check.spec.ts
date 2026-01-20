import { test } from '@playwright/test';

test.describe('Comprehensive Layout Check - All Pages', () => {

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

  test('Check all pages for layout issues @ 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const pages = [
      { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
      { name: 'Groups', url: 'http://localhost:3000/groups' },
      { name: 'Trips', url: 'http://localhost:3000/trips' },
    ];

    console.log('\n========================================');
    console.log('COMPREHENSIVE LAYOUT CHECK @ 1440x900');
    console.log('========================================\n');

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });

      const analysis = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        const main = document.querySelector('main');
        const h1 = document.querySelector('h1');

        const sidebarBox = sidebar?.getBoundingClientRect();
        const mainBox = main?.getBoundingClientRect();
        const h1Box = h1?.getBoundingClientRect();

        const mainStyle = main ? getComputedStyle(main) : null;

        return {
          sidebar: {
            width: sidebarBox?.width,
            position: sidebar ? getComputedStyle(sidebar).position : null,
          },
          main: {
            x: mainBox?.x,
            marginLeft: mainStyle?.marginLeft,
          },
          header: {
            text: h1?.textContent?.trim(),
            x: h1Box?.x,
            visible: h1Box ? (h1Box.x >= (sidebarBox?.width || 0)) : false,
          },
          issues: [] as string[],
        };
      });

      // Check for issues
      if (analysis.header.x !== undefined && analysis.sidebar.width !== undefined) {
        if (analysis.header.x < analysis.sidebar.width) {
          analysis.issues.push(`Header hidden behind sidebar (x=${analysis.header.x}, sidebar=${analysis.sidebar.width})`);
        }
      }

      if (analysis.main.marginLeft === '0px') {
        analysis.issues.push('Main element has no left margin');
      }

      console.log(`\n📄 ${pageInfo.name.toUpperCase()}`);
      console.log('  Sidebar width:', analysis.sidebar.width + 'px');
      console.log('  Main margin-left:', analysis.main.marginLeft);
      console.log('  Main x-position:', analysis.main.x + 'px');
      console.log('  Header text:', `"${analysis.header.text}"`);
      console.log('  Header x-position:', analysis.header.x + 'px');
      console.log('  Header visible?', analysis.header.visible ? '✅ YES' : '❌ NO');

      if (analysis.issues.length > 0) {
        console.log('  ⚠️  ISSUES FOUND:');
        analysis.issues.forEach(issue => console.log(`    - ${issue}`));
      } else {
        console.log('  ✅ No layout issues detected');
      }

      await page.screenshot({ path: `/tmp/${pageInfo.name.toLowerCase()}-comprehensive-1440x900.png` });
    }

    console.log('\n========================================');
    console.log('Screenshots saved to /tmp/');
    console.log('========================================\n');
  });
});
