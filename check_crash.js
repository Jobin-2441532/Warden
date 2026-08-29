const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE_ERROR:', error.message));

  console.log('Navigating to https://wardenagentic.vercel.app/agent');
  await page.goto('https://wardenagentic.vercel.app/agent');
  
  // Wait a few seconds to let hydration and errors happen
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
