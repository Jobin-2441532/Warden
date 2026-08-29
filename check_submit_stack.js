const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('PAGE_ERROR_STACK:', err.stack));
  
  await page.goto('https://wardenagentic.vercel.app/agent');
  
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  await page.type('input[placeholder="Ask for a product..."]', 'laptop');
  await page.press('input[placeholder="Ask for a product..."]', 'Enter');
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
