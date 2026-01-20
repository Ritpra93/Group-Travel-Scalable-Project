import { test } from '@playwright/test';

test.describe('CSS Loading Investigation', () => {

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

  test('Check if CSS file is loaded and contains rules', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    const cssInvestigation = await page.evaluate(() => {
      // Get all stylesheets
      const sheets = Array.from(document.styleSheets);

      const sheetInfo = sheets.map((sheet, idx) => {
        try {
          const href = sheet.href || '(inline)';
          let hasMl64 = false;
          let ml64Rule = null;

          // Try to access rules
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules);
            for (const rule of rules) {
              const text = rule.cssText;
              if (text.includes('lg\\:ml-64') || text.includes('.lg:ml-64')) {
                hasMl64 = true;
                ml64Rule = text.substring(0, 200); // First 200 chars
                break;
              }
            }
          }

          return {
            index: idx,
            href: href.substring(href.length - 50), // Last 50 chars of URL
            rulesCount: sheet.cssRules?.length || 0,
            hasM64: hasMl64,
            sampleRule: ml64Rule
          };
        } catch (e) {
          return {
            index: idx,
            error: 'CORS or access denied',
            href: sheet.href || '(inline)'
          };
        }
      });

      // Check computed style on main element
      const main = document.querySelector('main');
      const computed = main ? getComputedStyle(main) : null;

      return {
        totalSheets: sheets.length,
        sheets: sheetInfo,
        mainElementMargin: computed?.marginLeft,
        mainElementClasses: main?.className
      };
    });

    console.log('\n========================================');
    console.log('CSS LOADING & APPLICATION CHECK');
    console.log('========================================\n');
    console.log('Total stylesheets loaded:', cssInvestigation.totalSheets);
    console.log('\nSTYLESHEETS:');
    cssInvestigation.sheets.forEach(sheet => {
      console.log(`\n  [${sheet.index}]`, sheet.href);
      console.log('    Rules:', sheet.rulesCount);
      console.log('    Has lg:ml-64?', sheet.hasM64 || false);
      if (sheet.sampleRule) {
        console.log('    Sample:', sheet.sampleRule);
      }
      if (sheet.error) {
        console.log('    Error:', sheet.error);
      }
    });

    console.log('\n📐 MAIN ELEMENT:');
    console.log('  Classes:', cssInvestigation.mainElementClasses);
    console.log('  Computed margin-left:', cssInvestigation.mainElementMargin);

    const hasLgMl64InAnySheet = cssInvestigation.sheets.some(s => s.hasM64);
    console.log('\n🔍 CONCLUSION:');
    console.log('  lg:ml-64 rule found in CSS?', hasLgMl64InAnySheet ? 'YES ✅' : 'NO ❌');
    console.log('  Applied to main element?', cssInvestigation.mainElementMargin === '256px' ? 'YES ✅' : 'NO ❌');

    if (hasLgMl64InAnySheet && cssInvestigation.mainElementMargin !== '256px') {
      console.log('\n❌ CSS RULE EXISTS but IS NOT APPLIED');
      console.log('   Possible causes:');
      console.log('   - CSS specificity issue (another rule overriding)');
      console.log('   - Media query not matching');
      console.log('   - CSS file loaded after page render');
      console.log('   - Missing !important or conflicting styles');
    }
  });
});
