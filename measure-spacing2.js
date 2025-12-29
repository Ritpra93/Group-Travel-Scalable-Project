const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const measurements = await page.evaluate(() => {
    const results = {};
    
    // Find hero section
    const hero = document.querySelector('h1');
    if (hero) {
      const heroParent = hero.closest('div[class*="absolute"]');
      if (heroParent) {
        const styles = window.getComputedStyle(heroParent);
        results.heroPadding = {
          top: styles.paddingTop,
          bottom: styles.paddingBottom,
          left: styles.paddingLeft,
          right: styles.paddingRight
        };
      }
    }
    
    // Find all grids
    const grids = document.querySelectorAll('[class*="grid"]');
    results.grids = Array.from(grids).map((grid, idx) => ({
      index: idx,
      gap: window.getComputedStyle(grid).gap,
      columns: window.getComputedStyle(grid).gridTemplateColumns
    }));
    
    // Find all cards
    const cards = document.querySelectorAll('[class*="rounded-xl"]');
    results.cards = Array.from(cards).slice(0, 5).map((card, idx) => ({
      index: idx,
      padding: window.getComputedStyle(card).padding
    }));
    
    // Find spacing between sections
    const spacedDivs = document.querySelectorAll('[class*="space-y"], [class*="mb-"]');
    results.verticalSpacing = Array.from(spacedDivs).slice(0, 10).map(el => ({
      classes: el.className.split(' ').filter(c => c.includes('space-y') || c.includes('mb-')).join(' '),
      marginBottom: window.getComputedStyle(el).marginBottom,
      gap: window.getComputedStyle(el).rowGap
    }));
    
    return results;
  });
  
  console.log('━━━ MEASURED SPACING VALUES ━━━\n');
  console.log('Hero Padding:', JSON.stringify(measurements.heroPadding, null, 2));
  console.log('\nGrids:', JSON.stringify(measurements.grids, null, 2));
  console.log('\nCards (first 5):', JSON.stringify(measurements.cards, null, 2));
  console.log('\nVertical Spacing:', JSON.stringify(measurements.verticalSpacing, null, 2));
  
  await browser.close();
})();
