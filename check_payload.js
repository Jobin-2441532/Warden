const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('request', req => {
    if (req.url().includes('/api/chat')) {
      console.log('API POST DATA:', req.postData());
    }
  });
  
  await page.goto('http://localhost:3000/test');
  await page.fill('#test-input', 'hello');
  
  console.log('-- clicking btn 3 --');
  await page.click('#test-btn-3');
  await page.waitForTimeout(500);
  
  await page.goto('http://localhost:3000/test');
  await page.fill('#test-input', 'hello');
  console.log('-- clicking btn 4 --');
  await page.click('#test-btn-4');
  await page.waitForTimeout(500);
  
  await browser.close();
})();
