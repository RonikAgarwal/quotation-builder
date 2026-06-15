import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // click "Add Custom Product" in the SelectedPanel
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('+ Add Custom Product'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // Fill the form
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[1]) inputs[1].value = 'Test Product'; // Name
    if (inputs[2]) inputs[2].value = 'Test Category'; // Category
    if (inputs[3]) inputs[3].value = '100'; // Price
    
    // dispatch event
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
    
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Add Product');
    if (saveBtn) saveBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click Custom filter
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.chip'));
    const customBtn = buttons.find(b => b.textContent === 'Custom');
    if (customBtn) customBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'custom_added.png' });
  
  await browser.close();
  console.log("Done");
})();
