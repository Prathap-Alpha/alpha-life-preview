// Phone and desktop screenshots of the "simpler conversation" section and the top of the page.
import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [360, 800], [1280, 900]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(process.env.BASE_URL || 'http://localhost:8077/'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `evidence/top-${w}.png` });
  const how = p.locator('#how'); await how.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `evidence/how-${w}.png`, clip: undefined });
  await how.screenshot({ path: `evidence/how-section-${w}.png` });
}
await b.close();
