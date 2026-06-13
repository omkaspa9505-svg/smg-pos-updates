const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to dev server
  await page.goto('http://localhost:5173/inventory');
  
  // Wait for the inventory to load
  await page.waitForTimeout(2000);
  
  // Click the print button (first one)
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text === 'Print') {
      await btn.click();
      break;
    }
  }
  
  // Wait for modal
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
})();
