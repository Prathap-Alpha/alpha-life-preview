// Measures a page at the five review sizes: full-page screenshot + layout numbers (no assets are copied).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [,, name, url, outDir = 'shots'] = process.argv;
const SIZES = [[1440,900],[1280,900],[768,1024],[390,844],[360,800]];
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
const report = {};
for (const [w,h] of SIZES) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1, reducedMotion:'no-preference' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil:'load', timeout:60000 }).catch(e=>console.log('goto',e.message));
  await p.waitForTimeout(2500);
  const total = await p.evaluate(()=>document.documentElement.scrollHeight);
  for (let y=0; y<total; y+=Math.round(h*0.6)) { await p.evaluate(y=>scrollTo(0,y), y); await p.waitForTimeout(350); }
  await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(1200);
  await p.screenshot({ path:`${outDir}/${name}-${w}.png`, fullPage:true });
  report[w] = await p.evaluate(()=>{
    const r = e=>{const b=e.getBoundingClientRect();return {top:Math.round(b.top+scrollY),h:Math.round(b.height),x:Math.round(b.left),w:Math.round(b.width)}};
    const h1 = document.querySelector('h1');
    const cs = h1 && getComputedStyle(h1);
    const kids = [...(document.querySelector('main')||document.body).children].filter(e=>e.getBoundingClientRect().height>20).map(e=>({tag:e.tagName.toLowerCase()+(e.id?'#'+e.id:''),cls:(e.className&&e.className.toString().slice(0,40))||'',...r(e)}));
    const canv=[...document.querySelectorAll('canvas')].map(r);
    return { pageH:document.documentElement.scrollHeight, h1: h1&&{...r(h1),font:cs.fontSize,lh:cs.lineHeight,fam:cs.fontFamily.slice(0,40),wt:cs.fontWeight}, canvases:canv, sections:kids.slice(0,24), header: (()=>{const e=document.querySelector('header');return e&&r(e)})() };
  });
  await ctx.close();
}
fs.writeFileSync(`${outDir}/${name}-measure.json`, JSON.stringify(report,null,1));
await b.close();
console.log('done', name);
