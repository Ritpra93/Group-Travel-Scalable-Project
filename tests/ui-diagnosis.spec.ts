import { test, expect } from '@playwright/test';

test.describe('UI Layout Diagnosis - READ ONLY', () => {

  // Auth setup before each test
  test.beforeEach(async ({ page }) => {
    // Inject auth state into localStorage BEFORE page loads
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

  test('Issue #1: Sidebar overlap on Groups page', async ({ page }) => {
    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    // Measure sidebar
    const sidebar = await page.locator('[data-testid="sidebar"]');
    const sidebarBox = await sidebar.boundingBox();
    const sidebarStyles = await sidebar.evaluate(el => ({
      width: getComputedStyle(el).width,
      position: getComputedStyle(el).position,
      zIndex: getComputedStyle(el).zIndex
    }));

    // Measure main element
    const main = await page.locator('main');
    const mainBox = await main.boundingBox();
    const mainStyles = await main.evaluate(el => ({
      marginLeft: getComputedStyle(el).marginLeft,
      paddingLeft: getComputedStyle(el).paddingLeft,
      width: getComputedStyle(el).width
    }));

    // Measure inner container (min-h-screen bg-white)
    const innerContainer = await page.locator('main > div.min-h-screen').first();
    const innerContainerStyles = await innerContainer.evaluate(el => ({
      marginLeft: getComputedStyle(el).marginLeft,
      marginRight: getComputedStyle(el).marginRight,
      width: getComputedStyle(el).width
    }));

    // Measure max-w-7xl container
    const contentContainer = await page.locator('main > div > div.max-w-7xl').first();
    const contentContainerStyles = await contentContainer.evaluate(el => ({
      marginLeft: getComputedStyle(el).marginLeft,
      marginRight: getComputedStyle(el).marginRight,
      paddingLeft: getComputedStyle(el).paddingLeft,
      maxWidth: getComputedStyle(el).maxWidth
    }));

    // Measure header position
    const header = await page.locator('h1').first();
    const headerBox = await header.boundingBox();
    const headerText = await header.textContent();

    // Calculate overlap
    const overlapDetected = headerBox && sidebarBox && headerBox.x < sidebarBox.width;

    console.log('\n========================================');
    console.log('ISSUE #1: SIDEBAR OVERLAP DIAGNOSIS');
    console.log('========================================');
    console.log('\n📐 SIDEBAR MEASUREMENTS:');
    console.log('  Width (bounding):', sidebarBox?.width + 'px');
    console.log('  Width (computed):', sidebarStyles.width);
    console.log('  Position:', sidebarStyles.position);
    console.log('  Z-index:', sidebarStyles.zIndex);

    console.log('\n📐 MAIN ELEMENT MEASUREMENTS:');
    console.log('  X position:', mainBox?.x + 'px');
    console.log('  Margin-left (computed):', mainStyles.marginLeft);
    console.log('  Padding-left (computed):', mainStyles.paddingLeft);

    console.log('\n📐 INNER CONTAINER (min-h-screen) MEASUREMENTS:');
    console.log('  Margin-left:', innerContainerStyles.marginLeft);
    console.log('  Margin-right:', innerContainerStyles.marginRight);
    console.log('  Width:', innerContainerStyles.width);

    console.log('\n📐 CONTENT CONTAINER (max-w-7xl) MEASUREMENTS:');
    console.log('  Margin-left:', contentContainerStyles.marginLeft);
    console.log('  Margin-right:', contentContainerStyles.marginRight);
    console.log('  Padding-left:', contentContainerStyles.paddingLeft);
    console.log('  Max-width:', contentContainerStyles.maxWidth);

    console.log('\n📐 HEADER MEASUREMENTS:');
    console.log('  X position:', headerBox?.x + 'px');
    console.log('  Text content:', '"' + headerText + '"');

    console.log('\n🔍 OVERLAP ANALYSIS:');
    console.log('  Sidebar width:', sidebarBox?.width + 'px');
    console.log('  Header x-position:', headerBox?.x + 'px');
    console.log('  Overlap detected:', overlapDetected ? 'YES ❌' : 'NO ✅');
    console.log('  (Header is hidden behind sidebar:', headerBox && sidebarBox ? (headerBox.x < sidebarBox.width) : 'N/A', ')');

    // Take screenshot
    await page.screenshot({ path: '/tmp/groups-diagnosis-1440x900.png', fullPage: false });
    console.log('\n📸 Screenshot saved: /tmp/groups-diagnosis-1440x900.png');
  });

  test('Issue #1b: Sidebar overlap on Trips page', async ({ page }) => {
    await page.goto('http://localhost:3000/trips', { waitUntil: 'networkidle' });

    const sidebar = await page.locator('[data-testid="sidebar"]');
    const sidebarBox = await sidebar.boundingBox();

    const header = await page.locator('h1').first();
    const headerBox = await header.boundingBox();
    const headerText = await header.textContent();

    const overlapDetected = headerBox && sidebarBox && headerBox.x < sidebarBox.width;

    console.log('\n========================================');
    console.log('ISSUE #1b: TRIPS PAGE DIAGNOSIS');
    console.log('========================================');
    console.log('  Sidebar width:', sidebarBox?.width + 'px');
    console.log('  Header x-position:', headerBox?.x + 'px');
    console.log('  Header text:', '"' + headerText + '"');
    console.log('  Overlap detected:', overlapDetected ? 'YES ❌' : 'NO ✅');

    await page.screenshot({ path: '/tmp/trips-diagnosis-1440x900.png', fullPage: false });
    console.log('📸 Screenshot saved: /tmp/trips-diagnosis-1440x900.png');
  });

  test('Issue #2: Hero text clipping on Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Find hero section by data-testid
    const hero = await page.locator('[data-testid="hero"]');
    const heroBox = await hero.boundingBox();
    const heroStyles = await hero.evaluate(el => ({
      height: getComputedStyle(el).height,
      overflow: getComputedStyle(el).overflow,
      position: getComputedStyle(el).position
    }));

    // Find hero title
    const heroTitle = await page.locator('[data-testid="hero"] h1').first();
    const heroTitleBox = await heroTitle.boundingBox();
    const heroTitleText = await heroTitle.textContent();

    // Find hero button (View Map)
    const heroButton = await page.locator('[data-testid="hero"] button').first();
    const heroButtonBox = await heroButton.boundingBox();
    const heroButtonText = await heroButton.textContent();

    // Calculate clipping
    const titleClipped = heroTitleBox && heroBox && (heroTitleBox.y + heroTitleBox.height) > (heroBox.y + heroBox.height);
    const buttonClipped = heroButtonBox && heroBox && (heroButtonBox.y + heroButtonBox.height) > (heroBox.y + heroBox.height);

    console.log('\n========================================');
    console.log('ISSUE #2: HERO TEXT CLIPPING DIAGNOSIS');
    console.log('========================================');
    console.log('\n📐 HERO CONTAINER MEASUREMENTS:');
    console.log('  Height (computed):', heroStyles.height);
    console.log('  Overflow:', heroStyles.overflow);
    console.log('  Position:', heroStyles.position);
    console.log('  Y position:', heroBox?.y + 'px');
    console.log('  Bottom position:', heroBox ? (heroBox.y + heroBox.height) + 'px' : 'N/A');

    console.log('\n📐 HERO TITLE MEASUREMENTS:');
    console.log('  Text:', '"' + heroTitleText + '"');
    console.log('  Y position:', heroTitleBox?.y + 'px');
    console.log('  Height:', heroTitleBox?.height + 'px');
    console.log('  Bottom position:', heroTitleBox ? (heroTitleBox.y + heroTitleBox.height) + 'px' : 'N/A');

    console.log('\n📐 HERO BUTTON MEASUREMENTS:');
    console.log('  Text:', '"' + heroButtonText + '"');
    console.log('  Y position:', heroButtonBox?.y + 'px');
    console.log('  Height:', heroButtonBox?.height + 'px');
    console.log('  Bottom position:', heroButtonBox ? (heroButtonBox.y + heroButtonBox.height) + 'px' : 'N/A');

    console.log('\n🔍 CLIPPING ANALYSIS:');
    console.log('  Title clipped:', titleClipped ? 'YES ❌' : 'NO ✅');
    console.log('  Button clipped:', buttonClipped ? 'YES ❌' : 'NO ✅');

    await page.screenshot({ path: '/tmp/dashboard-diagnosis-1440x900.png', fullPage: false });
    console.log('\n📸 Screenshot saved: /tmp/dashboard-diagnosis-1440x900.png');
  });

  test('Issue #3: Button sizing on Groups page', async ({ page }) => {
    await page.goto('http://localhost:3000/groups', { waitUntil: 'networkidle' });

    const createButton = await page.getByRole('button', { name: /create group/i });
    const buttonBox = await createButton.boundingBox();
    const buttonText = await createButton.textContent();
    const buttonStyles = await createButton.evaluate(el => ({
      width: getComputedStyle(el).width,
      minWidth: getComputedStyle(el).minWidth,
      maxWidth: getComputedStyle(el).maxWidth,
      padding: getComputedStyle(el).padding,
      paddingLeft: getComputedStyle(el).paddingLeft,
      paddingRight: getComputedStyle(el).paddingRight,
      whiteSpace: getComputedStyle(el).whiteSpace,
      textOverflow: getComputedStyle(el).textOverflow,
      overflow: getComputedStyle(el).overflow,
      fontSize: getComputedStyle(el).fontSize,
      fontWeight: getComputedStyle(el).fontWeight
    }));

    // Measure text width inside button
    const textWidth = await createButton.evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();
      return rect.width;
    });

    const textConstraintDetected = textWidth && buttonBox && textWidth > (buttonBox.width - 40); // rough padding estimate

    console.log('\n========================================');
    console.log('ISSUE #3: BUTTON SIZING DIAGNOSIS');
    console.log('========================================');
    console.log('\n📐 BUTTON MEASUREMENTS:');
    console.log('  Text:', '"' + buttonText + '"');
    console.log('  Width (bounding):', buttonBox?.width + 'px');
    console.log('  Width (computed):', buttonStyles.width);
    console.log('  Min-width:', buttonStyles.minWidth);
    console.log('  Max-width:', buttonStyles.maxWidth);

    console.log('\n📐 BUTTON STYLING:');
    console.log('  Padding:', buttonStyles.padding);
    console.log('  Padding-left:', buttonStyles.paddingLeft);
    console.log('  Padding-right:', buttonStyles.paddingRight);
    console.log('  White-space:', buttonStyles.whiteSpace);
    console.log('  Text-overflow:', buttonStyles.textOverflow);
    console.log('  Overflow:', buttonStyles.overflow);
    console.log('  Font-size:', buttonStyles.fontSize);
    console.log('  Font-weight:', buttonStyles.fontWeight);

    console.log('\n📐 TEXT MEASUREMENTS:');
    console.log('  Text content width:', textWidth + 'px');
    console.log('  Button inner width (approx):', buttonBox ? (buttonBox.width - 40) + 'px (button width - padding estimate)' : 'N/A');

    console.log('\n🔍 CONSTRAINT ANALYSIS:');
    console.log('  Text constrained:', textConstraintDetected ? 'POSSIBLY ⚠️' : 'NO ✅');

    await page.screenshot({ path: '/tmp/button-diagnosis-1440x900.png', fullPage: false });
    console.log('\n📸 Screenshot saved: /tmp/button-diagnosis-1440x900.png');
  });
});
