import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5252',out=process.env.EVIDENCE_DIR??'handoff/worktree-integration/player-flow';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const errors=[],rows=[];
try{for(const visual of ['2026','ryker']){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto(`${base}/?scene=express&route=express&mode=test&play=preview&visual=${visual}&quality=medium`);
 await page.locator('#start-crew').waitFor({timeout:120000});await page.waitForFunction(()=>!document.querySelector('#start-crew').disabled);
 assert.equal(await page.evaluate(()=>typeof window.__EXPRESS),'undefined','ordinary visitor has no test hook');
 await page.locator('#enable-sound').click();await page.locator('#enable-sound').waitFor({state:'hidden',timeout:40000});
 await page.locator('#game-audio summary').click();await page.locator('#music-off').click();await page.locator('#game-audio summary').click();
 await page.locator('#start-crew').click();if(await page.locator('.film-skip').isVisible())await page.locator('.film-skip').click();
 await page.waitForTimeout(4000);await page.keyboard.down('ArrowUp');
 await page.waitForFunction(()=>Number(document.querySelector('#race-speed')?.textContent)>10,null,{timeout:15000});
 const mph=Number(await page.locator('#race-speed').textContent());await page.keyboard.up('ArrowUp');
 await page.locator('#race-pause').click();await page.locator('#race-menu').waitFor({state:'visible'});
 await page.screenshot({path:`${out}/${visual}-paused.png`});
 await page.locator('[data-action=bay]').click();await page.waitForURL('**/*scene=signature*',{timeout:30000});
 await page.locator('.sig-detail').waitFor({timeout:120000});
 assert.equal(await page.locator('#audio-music').inputValue(),'0');
 rows.push({visual,mph,keyboardDrive:true,pause:true,returnToBuild:true,musicOffRetained:true});await context.close();
}assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({pass:true,method:'Packaged visitor game without test hooks; actual keyboard events, native browser animation/audio clocks, visible pause and return controls. Headless Chromium, not physical device or performance certification.',rows,errors},null,2));console.log('PASS ordinary visitor keyboard drives, pause and return for both vehicles');
}finally{await browser.close()}
