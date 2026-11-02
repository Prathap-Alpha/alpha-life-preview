// Lists the top-level blocks of a page with their top/height at one viewport, for reference-vs-ours proportion checks.
import { chromium } from '@playwright/test';
const [,, url, w, h] = process.argv;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:+w,height:+h} })).newPage();
await p.goto(url,{waitUntil:'load',timeout:60000}).catch(()=>{});
await p.waitForTimeout(2000);
const total = await p.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0;y<total;y+=500){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(150);}
const rows = await p.evaluate(()=>{
  let root=document.querySelector('main')||document.body;
  while([...root.children].filter(e=>e.getBoundingClientRect().height>20).length<5 && root.children.length) root=[...root.children].sort((a,b)=>b.getBoundingClientRect().height-a.getBoundingClientRect().height)[0];
  return [...root.children].map(e=>{const r=e.getBoundingClientRect();return [e.tagName.toLowerCase()+(e.id?'#'+e.id:''),Math.round(r.top+scrollY),Math.round(r.height)]}).filter(x=>x[2]>20);
});
console.log(JSON.stringify(rows));
await b.close();
