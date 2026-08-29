const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://wardenagentic.vercel.app/agent');
  
  // Wait for the input to appear
  await page.waitForSelector('input[placeholder="Ask for a product..."]');
  
  const input = await page.$('input[placeholder="Ask for a product..."]');
  const isDisabled = await input.evaluate(el => el.disabled);
  const isReadonly = await input.evaluate(el => el.readOnly);
  
  console.log('Is Disabled:', isDisabled);
  console.log('Is Readonly:', isReadonly);
  
  try {
    await input.type('test message');
    const val = await input.evaluate(el => el.value);
    console.log('Input value after typing:', val);
  } catch (err) {
    console.error('Failed to type:', err.message);
  }
  
  await browser.close();
})();
