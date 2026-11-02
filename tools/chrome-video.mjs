// Plays both loops in real Chrome (H.264) and reports whether frames advance.
import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await p.goto(process.env.BASE_URL || 'http://localhost:8077/');
const out = [];
for (const sel of ['#updates video']) {
  const v = p.locator(sel); await v.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  out.push(await v.evaluate(e => ({ src: e.currentSrc.split('/').pop(), paused: e.paused, t: +e.currentTime.toFixed(2), ready: e.readyState, w: e.videoWidth, h: e.videoHeight, err: e.error && e.error.code })));
}
console.log(JSON.stringify(out)); await b.close();
