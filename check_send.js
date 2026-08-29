const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  
  await page.goto('http://localhost:3000/test');
  await page.fill('#test-input', 'hello');
  
  console.log('--- Clicking btn 1 ---');
  await page.click('#test-btn-1');
  await page.waitForTimeout(500);
  console.log('Status:', await page.textContent('#status'));
  
  // Refresh to clear state
  await page.goto('http://localhost:3000/test');
  await page.fill('#test-input', 'hello');
  
  console.log('--- Clicking btn 2 ---');
  await page.click('#test-btn-2');
  await page.waitForTimeout(500);
  console.log('Status:', await page.textContent('#status'));
  
  await browser.close();
})();
