import { chromium } from '@playwright/test';
const b=await chromium.launch();
for(const [n,w,h] of [['phone',390,844],['desktop',1440,900]]){
 const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();
 await p.goto(process.env.BASE_URL||'http://localhost:8077/');await p.waitForTimeout(1500);
 await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)});
 await p.waitForTimeout(500);await p.screenshot({path:`shots/final-${n}.png`,fullPage:true});
}
await b.close();
