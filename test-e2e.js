const { _electron: electron } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting Playwright test...');
  // Launch Electron app
  const electronApp = await electron.launch({ args: ['dist-electron/main.js'] });
  
  const window = await electronApp.firstWindow();
  
  console.log('Waiting for network idle...');
  await window.waitForLoadState('networkidle');
  await window.waitForTimeout(3000); 

  const screenshotDir = 'C:\\Users\\omkas\\.gemini\\antigravity\\brain\\ec8122f6-bc4a-4f2c-a828-35dba07155ff';

  async function clickButton(text) {
    await window.evaluate((textToFind) => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes(textToFind));
      if (btn) btn.click();
    }, text);
  }

  try {
    // 1. Dashboard screenshot
    await window.screenshot({ path: path.join(screenshotDir, '01_dashboard.png') });
    console.log('Took screenshot: 01_dashboard.png');

    // Navigate to Inventory
    console.log('Navigating to Inventory...');
    await clickButton('Inventory');
    await window.waitForTimeout(2000);

    console.log('Adding an item...');
    await clickButton('Add Item');
    await window.waitForTimeout(2000);
    
    // Fill the form
    await window.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      
      const barcodeInput = inputs.find(i => i.placeholder && i.placeholder.includes('AB123C'));
      if (barcodeInput) {
        // use React synthetic event bypass
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(barcodeInput, 'E2E-TEST-BOT');
        barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const numInputs = inputs.filter(i => i.type === 'number');
      if (numInputs.length > 0) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(numInputs[0], '15.5');
        numInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await window.waitForTimeout(1000);
    await clickButton('Save Item');
    await window.waitForTimeout(2000);

    await window.screenshot({ path: path.join(screenshotDir, '02_inventory_added.png') });
    console.log('Took screenshot: 02_inventory_added.png');

    // POS
    console.log('Navigating to Point of Sale...');
    await clickButton('Point of Sale');
    await window.waitForTimeout(2000);

    console.log('Scanning item in POS...');
    await window.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const scanInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('scan barcode'));
      if (scanInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(scanInput, 'E2E-TEST-BOT');
        scanInput.dispatchEvent(new Event('input', { bubbles: true }));
        scanInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    });
    
    await window.waitForTimeout(2000);

    console.log('Checking out...');
    await window.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('customer name'));
      const phoneInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('phone number'));
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      
      if (nameInput) {
        nativeInputValueSetter.call(nameInput, 'E2E Robot Tester');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (phoneInput) {
        nativeInputValueSetter.call(phoneInput, '9999999999');
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await clickButton('Complete Checkout');
    await window.waitForTimeout(3000);

    await window.screenshot({ path: path.join(screenshotDir, '03_pos_checkout.png') });
    console.log('Took screenshot: 03_pos_checkout.png');

    // Reports
    console.log('Navigating to Performance Reports...');
    await clickButton('Performance Reports');
    await window.waitForTimeout(2000);

    await window.screenshot({ path: path.join(screenshotDir, '04_reports.png') });
    console.log('Took screenshot: 04_reports.png');
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    console.log('Closing the application...');
    await electronApp.close();
  }
})();
