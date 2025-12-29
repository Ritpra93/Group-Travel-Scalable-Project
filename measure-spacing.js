const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Measure hero padding
  const heroPadding = await page.evaluate(() => {
    const hero = document.querySelector('[class*="absolute bottom-0"]');
    if (!hero) return null;
    const styles = window.getComputedStyle(hero);
    return {
      paddingTop: styles.paddingTop,
      paddingBottom: styles.paddingBottom,
      paddingLeft: styles.paddingLeft,
      paddingRight: styles.paddingRight
    };
  });
  
  // Measure quick actions gap
  const quickActionsGap = await page.evaluate(() => {
    const grid = document.querySelector('[class*="grid"][class*="md:grid-cols-3"]');
    if (!grid) return null;
    return window.getComputedStyle(grid).gap;
  });
  
  // Measure stats grid gap
  const statsGap = await page.evaluate(() => {
    const grid = document.querySelector('[class*="grid"][class*="md:grid-cols-4"]');
    if (!grid) return null;
    return window.getComputedStyle(grid).gap;
  });
  
  // Measure main content grid gap
  const mainGridGap = await page.evaluate(() => {
    const grid = document.querySelector('[class*="grid"][class*="lg:grid-cols-3"]');
    if (!grid) return null;
    return window.getComputedStyle(grid).gap;
  });
  
  // Measure widget padding
  const widgetPadding = await page.evaluate(() => {
    const widget = document.querySelector('[class*="bg-white rounded-xl"]');
    if (!widget) return null;
    const styles = window.getComputedStyle(widget);
    return styles.padding;
  });
  
  // Measure section margins
  const sectionMargins = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('[class*="mb-"]'));
    return sections.slice(0, 5).map(el => ({
      classes: el.className,
      marginBottom: window.getComputedStyle(el).marginBottom
    }));
  });
  
  console.log('━━━ MEASURED SPACING VALUES ━━━');
  console.log('\nHero Padding:', heroPadding);
  console.log('Quick Actions Gap:', quickActionsGap);
  console.log('Stats Grid Gap:', statsGap);
  console.log('Main Content Grid Gap:', mainGridGap);
  console.log('Widget Padding:', widgetPadding);
  console.log('\nSection Margins:', sectionMargins);
  
  await browser.close();
})();
