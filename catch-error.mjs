import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`PAGE EXCEPTION: ${error.message}\n${error.stack}`);
  });

  await page.goto('http://localhost:5173/workspace/test-workspace-id'); // Adjust URL as needed
  
  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  // We can't easily click "Add Comment" without login, but let's see if we catch anything on load.
  await browser.close();
})();
