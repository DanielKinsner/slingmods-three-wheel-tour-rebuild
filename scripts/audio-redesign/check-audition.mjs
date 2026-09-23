import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5379',browser=await chromium.launch({headless:true,args:['--mute-audio']});
try{const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/assets/audio/tour-audition/index.html');assert.equal(await page.locator('article:not([hidden])').count(),3);
 await page.locator('article:not([hidden]) audio').first().evaluate(a=>a.play());await page.waitForTimeout(1300);assert.ok(await page.locator('article:not([hidden]) audio').first().evaluate(a=>a.currentTime>0));
 await page.locator('[data-filter="Vehicles"]').click();await page.locator('article:not([hidden]) audio').first().evaluate(a=>a.play());await page.waitForTimeout(1000);assert.equal(await page.locator('audio').evaluateAll(v=>v.filter(a=>!a.paused).length),1);
 await page.locator('#stop').click();assert.equal(await page.locator('audio').evaluateAll(v=>v.filter(a=>!a.paused).length),0);
 await page.locator('[data-filter="Score"]').click();await page.screenshot({path:'assets/audio-redesign/evidence/listening-room.png'});assert.deepEqual(errors,[]);
 await fs.writeFile('assets/audio-redesign/evidence/audition.json',JSON.stringify({status:'PASS',base,checks:['Three score previews','Packaged Ogg decodes and advances','Single audition voice','Stop playback','No page errors']},null,2));
}finally{await browser.close()}
