const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  
  // We will intercept network to see if it even tries to send
  page.on('request', request => {
    if (request.url().includes('/api/chat')) {
      console.log('API_REQUEST:', request.postData());
    }
  });

  await page.goto('https://wardenagentic.vercel.app/agent');
  
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  
  // Try calling append via exposing a global function from the page
  // Wait, I can't easily inject into React scope.
  
  await browser.close();
})();
