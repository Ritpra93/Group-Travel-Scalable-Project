import { test } from '@playwright/test';

test.describe('CSS Investigation - Why is margin-left: 0px?', () => {

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

  test('Investigate main element margin-left computation', async ({ page }) => {
    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    // Inspect main element in detail
    const mainElement = await page.locator('main');

    const mainInspection = await mainElement.evaluate(el => {
      const computed = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Get all margin-related properties
      return {
        // Class attribute
        className: el.className,

        // Computed styles
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        marginTop: computed.marginTop,
        marginBottom: computed.marginBottom,

        // Position and display
        position: computed.position,
        display: computed.display,
        flex: computed.flex,

        // Bounding box
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,

        // Parent information
        parentElement: el.parentElement?.tagName,
        parentClass: el.parentElement?.className,

        // Check if Tailwind classes are applied
        hasFlexClass: el.classList.contains('flex-1'),
        hasMlClass: el.className.includes('ml-'),

        // Get all classes as array
        classList: Array.from(el.classList)
      };
    });

    console.log('\n========================================');
    console.log('MAIN ELEMENT INVESTIGATION');
    console.log('========================================\n');
    console.log('CLASS ATTRIBUTE:', mainInspection.className);
    console.log('\nCLASS LIST:', mainInspection.classList);
    console.log('\nTAILWIND CLASS DETECTION:');
    console.log('  Has flex-1:', mainInspection.hasFlexClass);
    console.log('  Has ml-* class:', mainInspection.hasMlClass);
    console.log('\nCOMPUTED MARGINS:');
    console.log('  margin-left:', mainInspection.marginLeft);
    console.log('  margin-right:', mainInspection.marginRight);
    console.log('  margin-top:', mainInspection.marginTop);
    console.log('  margin-bottom:', mainInspection.marginBottom);
    console.log('\nLAYOUT PROPERTIES:');
    console.log('  position:', mainInspection.position);
    console.log('  display:', mainInspection.display);
    console.log('  flex:', mainInspection.flex);
    console.log('\nBOUNDING BOX:');
    console.log('  x:', mainInspection.x);
    console.log('  y:', mainInspection.y);
    console.log('  width:', mainInspection.width);
    console.log('  height:', mainInspection.height);
    console.log('\nPARENT:');
    console.log('  tag:', mainInspection.parentElement);
    console.log('  class:', mainInspection.parentClass);

    // Now inspect the inner div (min-h-screen bg-white)
    const innerDiv = await page.locator('main > div.min-h-screen').first();

    const innerInspection = await innerDiv.evaluate(el => {
      const computed = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return {
        className: el.className,
        classList: Array.from(el.classList),

        // Margins
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,

        // Position
        x: rect.x,
        width: rect.width,

        // Parent check
        parentMarginLeft: getComputedStyle(el.parentElement!).marginLeft,

        // Check if mx-auto is applied
        hasMxAuto: el.classList.contains('mx-auto') || el.className.includes('mx-auto')
      };
    });

    console.log('\n========================================');
    console.log('INNER DIV (min-h-screen) INVESTIGATION');
    console.log('========================================\n');
    console.log('CLASS ATTRIBUTE:', innerInspection.className);
    console.log('\nCLASS LIST:', innerInspection.classList);
    console.log('\nHAS mx-auto:', innerInspection.hasMxAuto);
    console.log('\nCOMPUTED MARGINS:');
    console.log('  margin-left:', innerInspection.marginLeft);
    console.log('  margin-right:', innerInspection.marginRight);
    console.log('\nPOSITION:');
    console.log('  x:', innerInspection.x);
    console.log('  width:', innerInspection.width);
    console.log('\nPARENT margin-left:', innerInspection.parentMarginLeft);

    // Now inspect the content container (max-w-7xl)
    const contentDiv = await page.locator('main > div > div.max-w-7xl').first();

    const contentInspection = await contentDiv.evaluate(el => {
      const computed = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return {
        className: el.className,
        classList: Array.from(el.classList),

        // Margins
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,

        // Padding
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,

        // Position
        x: rect.x,
        width: rect.width,
        maxWidth: computed.maxWidth,

        // Check mx-auto
        hasMxAuto: el.classList.contains('mx-auto') || el.className.includes('mx-auto')
      };
    });

    console.log('\n========================================');
    console.log('CONTENT DIV (max-w-7xl) INVESTIGATION');
    console.log('========================================\n');
    console.log('CLASS ATTRIBUTE:', contentInspection.className);
    console.log('\nCLASS LIST:', contentInspection.classList);
    console.log('\nHAS mx-auto:', contentInspection.hasMxAuto);
    console.log('\nCOMPUTED MARGINS:');
    console.log('  margin-left:', contentInspection.marginLeft);
    console.log('  margin-right:', contentInspection.marginRight);
    console.log('\nCOMPUTED PADDING:');
    console.log('  padding-left:', contentInspection.paddingLeft);
    console.log('  padding-right:', contentInspection.paddingRight);
    console.log('\nPOSITION:');
    console.log('  x:', contentInspection.x);
    console.log('  width:', contentInspection.width);
    console.log('  max-width:', contentInspection.maxWidth);

    // Check viewport width to understand responsive breakpoint
    const viewportInfo = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    }));

    console.log('\n========================================');
    console.log('VIEWPORT INFORMATION');
    console.log('========================================\n');
    console.log('Width:', viewportInfo.width);
    console.log('Height:', viewportInfo.height);
    console.log('Device Pixel Ratio:', viewportInfo.devicePixelRatio);
    console.log('Expected Tailwind breakpoint: lg (>= 1024px)');
    console.log('Should use ml-64 (256px):', viewportInfo.width >= 1024);

    // Check what Tailwind CSS is actually generating
    const tailwindCheck = await page.evaluate(() => {
      // Find all style elements
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      const styleInfo = styles.map(s => {
        if (s.tagName === 'STYLE') {
          const content = (s as HTMLStyleElement).textContent || '';
          return {
            type: 'inline',
            hasMLClass: content.includes('.ml-\\[70px\\]') || content.includes('.ml-64'),
            hasFlexClass: content.includes('.flex-1'),
            length: content.length
          };
        } else {
          return {
            type: 'link',
            href: (s as HTMLLinkElement).href
          };
        }
      });

      return {
        totalStyles: styles.length,
        styles: styleInfo
      };
    });

    console.log('\n========================================');
    console.log('TAILWIND CSS LOADING CHECK');
    console.log('========================================\n');
    console.log('Total style elements:', tailwindCheck.totalStyles);
    console.log('Styles:', JSON.stringify(tailwindCheck.styles, null, 2));

    await page.screenshot({ path: '/tmp/css-investigation.png', fullPage: false });
    console.log('\n📸 Screenshot saved: /tmp/css-investigation.png');
  });
});
