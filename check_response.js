const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('request', req => {
    if (req.url().includes('/api/chat')) {
      console.log('API POST DATA:', req.postData());
    }
  });
  
  page.on('response', async res => {
    if (res.url().includes('/api/chat')) {
      console.log('API RESP STATUS:', res.status());
      try {
        const text = await res.text();
        console.log('API RESP TEXT:', text);
      } catch (e) {
        console.log('Could not read response text');
      }
    }
  });
  
  await page.goto('https://wardenagentic.vercel.app/agent');
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  
  await page.fill('input[placeholder="Ask for a product..."]', 'hello');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for response...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
