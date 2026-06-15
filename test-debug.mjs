import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // mock user being logged in by overriding firebase auth, or just manually test it by bypassing rules in a script
  // Wait, puppeteer can't easily bypass firebase auth without actual login.
  
  await browser.close();
})();
