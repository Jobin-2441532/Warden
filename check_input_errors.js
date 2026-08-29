const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  
  await page.goto('https://wardenagentic.vercel.app/agent');
  
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  const input = await page.$('input[placeholder="Ask for a product..."]');
  
  console.log('Typing...');
  await input.type('test');
  
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
