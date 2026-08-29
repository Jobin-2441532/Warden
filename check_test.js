const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  
  await page.goto('http://localhost:3000/test');
  await page.waitForTimeout(2000);
  await browser.close();
})();
