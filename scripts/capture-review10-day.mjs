import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='director-kit/production/evidence/P05/day-verified';
await fs.mkdir(dir,{recursive:false});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__TWT?.ready);
 const manifest=await(await page.request.get('http://127.0.0.1:5187/review-build.json')).json();
 await page.locator('#chapter-time-trial').click();await page.locator('[data-preset="day"]').click();await page.locator('#start-shakedown').click();
 await page.waitForFunction(()=>window.__HARBOR?.ready);assert.equal(new URL(page.url()).searchParams.get('preset'),'day');
 await page.locator('#start-lap').click();await page.waitForTimeout(3400);await page.keyboard.down('w');await page.waitForTimeout(2200);
 await page.screenshot({path:dir+'/day-time-trial.png'});await page.keyboard.up('w');
 const state=await page.evaluate(()=>window.__HARBOR.inspect());assert.equal(state.commit,manifest.commit.slice(0,12));assert.equal(state.race.phase,'running');assert.deepEqual(errors,[]);
 await fs.writeFile(dir+'/capture.json',JSON.stringify({method:'Fresh isolated browser, native root Time trial / Day / Start buttons and browser W key. Native wallclock screenshot; not scored performance or complete lap proof.',manifest,url:page.url(),state,errors},null,2));
} finally {await browser.close()}
