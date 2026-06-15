import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // click "Custom" filter
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.chip'));
    const customBtn = buttons.find(b => b.textContent === 'Custom');
    if (customBtn) customBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'custom_filter.png' });
  
  // click "All" filter
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.chip'));
    const allBtn = buttons.find(b => b.textContent === 'All');
    if (allBtn) allBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'all_filter.png' });
  
  await browser.close();
  console.log("Done");
})();
