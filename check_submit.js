const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQ_FAIL:', request.url(), request.failure().errorText));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP_ERROR:', response.url(), response.status());
    }
  });

  await page.goto('https://wardenagentic.vercel.app/agent');
  
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  const input = await page.$('input[placeholder="Ask for a product..."]');
  
  console.log('Typing...');
  await input.type('laptop');
  
  console.log('Pressing Enter...');
  await input.press('Enter');
  
  console.log('Waiting for network...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
