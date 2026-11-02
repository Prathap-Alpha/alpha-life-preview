// Records a short scroll-through of the page (motion evidence): node tools/record.mjs <url> <out.webm> <width> <height>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [,, url, out, w = '1280', h = '800'] = process.argv;
const dir = fs.mkdtempSync('rec-');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{ width:+w, height:+h }, recordVideo:{ dir, size:{ width:+w, height:+h } } });
const p = await ctx.newPage();
await p.goto(url, { waitUntil:'load' });
await p.waitForTimeout(2500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
const steps = 28;
for (let i = 1; i <= steps; i++) { await p.evaluate(y => scrollTo({ top:y }), Math.round(total * i / steps * 0.62)); await p.waitForTimeout(450); }
await p.waitForTimeout(800);
const v = p.video(); await ctx.close(); await v.saveAs(out); await b.close();
fs.rmSync(dir, { recursive:true, force:true });
console.log('saved', out);
