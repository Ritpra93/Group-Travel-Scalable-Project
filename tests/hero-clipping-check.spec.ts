import { test } from '@playwright/test';

test.describe('Hero Text Clipping - Multiple Viewports', () => {

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

  const viewports = [
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1366x768', width: 1366, height: 768 },
  ];

  for (const viewport of viewports) {
    test(`Check hero clipping @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

      const heroAnalysis = await page.evaluate(() => {
        const hero = document.querySelector('[data-testid="hero"]');
        const heroBox = hero?.getBoundingClientRect();
        const heroStyles = hero ? getComputedStyle(hero) : null;

        const title = hero?.querySelector('h1');
        const titleBox = title?.getBoundingClientRect();

        const button = hero?.querySelector('button');
        const buttonBox = button?.getBoundingClientRect();

        return {
          hero: {
            height: heroStyles?.height,
            overflow: heroStyles?.overflow,
            bottom: heroBox ? (heroBox.y + heroBox.height) : 0,
          },
          title: {
            text: title?.textContent?.trim(),
            bottom: titleBox ? (titleBox.y + titleBox.height) : 0,
            clipped: titleBox && heroBox ? (titleBox.y + titleBox.height) > (heroBox.y + heroBox.height) : false,
          },
          button: {
            text: button?.textContent?.trim(),
            bottom: buttonBox ? (buttonBox.y + buttonBox.height) : 0,
            clipped: buttonBox && heroBox ? (buttonBox.y + buttonBox.height) > (heroBox.y + heroBox.height) : false,
          },
        };
      });

      console.log(`\n========================================`);
      console.log(`HERO CLIPPING CHECK @ ${viewport.name}`);
      console.log(`========================================\n`);
      console.log('Viewport:', `${viewport.width}x${viewport.height}`);
      console.log('\nHERO:');
      console.log('  Height:', heroAnalysis.hero.height);
      console.log('  Overflow:', heroAnalysis.hero.overflow);
      console.log('  Bottom:', heroAnalysis.hero.bottom + 'px');
      console.log('\nTITLE:');
      console.log('  Text:', `"${heroAnalysis.title.text}"`);
      console.log('  Bottom:', heroAnalysis.title.bottom + 'px');
      console.log('  Clipped?', heroAnalysis.title.clipped ? '❌ YES' : '✅ NO');
      console.log('\nBUTTON:');
      console.log('  Text:', `"${heroAnalysis.button.text}"`);
      console.log('  Bottom:', heroAnalysis.button.bottom + 'px');
      console.log('  Clipped?', heroAnalysis.button.clipped ? '❌ YES' : '✅ NO');

      await page.screenshot({ path: `/tmp/hero-${viewport.name}.png` });
    });
  }
});
