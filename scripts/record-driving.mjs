import {chromium} from '@playwright/test';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='director-kit/production/evidence/G2';await mkdir(dir+'/video-temp',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:dir+'/video-temp',size:{width:1280,height:800}}});
try{
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5187/?scene=pad&cap=30');await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:60000});
 const stages=[],trace=[];let held=[];
 async function stage(name,keys,ms){for(const key of held)await page.keyboard.up(key);held=keys;for(const key of keys)await page.keyboard.down(key);const start=Date.now();while(Date.now()-start<ms){await page.waitForTimeout(250);trace.push({stage:name,wallMs:Date.now(),telemetry:await page.evaluate(()=>window.__TWT.telemetry())})}stages.push({name,keys,wallMs:Date.now()-start,telemetry:trace.at(-1).telemetry})}
 await stage('rest',[],1000);await stage('accelerate',['KeyW'],4000);await stage('left steering',['KeyW','KeyA'],1200);await stage('exit',['KeyW'],1500);await stage('brake',['KeyS'],3000);
 await page.keyboard.press('KeyX');await stage('reverse',['KeyW'],2500);await stage('stop',['KeyS'],2000);
 for(const key of held)await page.keyboard.up(key);
 const before=await page.evaluate(()=>window.__TWT.telemetry());await page.keyboard.press('Escape');await page.waitForTimeout(650);const after=await page.evaluate(()=>window.__TWT.telemetry());assert.equal(after.time,before.time);await page.keyboard.press('Escape');
 await page.keyboard.down('KeyR');await page.waitForTimeout(1200);await page.keyboard.up('KeyR');const reset=await page.evaluate(()=>window.__TWT.telemetry());assert.ok(Math.abs(reset.position.x)<.1&&Math.abs(reset.position.z-35)<.1);
 assert.ok(stages.find(s=>s.name==='accelerate').telemetry.speed>5);assert.ok(stages.find(s=>s.name==='reverse').telemetry.speed<-.5);assert.deepEqual(errors,[]);
 const video=page.video();await page.close();await context.close();await copyFile(await video.path(),dir+'/driving-keyboard.webm');
 await writeFile(dir+'/keyboard-motion.json',JSON.stringify({command:'node scripts/record-driving.mjs',outcome:'PASS isolated keyboard drive/brake/reverse/pause/held-reset checks',browser:await browser.version(),capture:'Actual Playwright browser video, 1280x800, software rendering; silent P02 prototype; no physical controller or performance claim',stages,trace,pause:{before,after},reset,errors},null,2));console.log('PASS real isolated keyboard motion, pause and held reset; video recorded.');
}finally{await browser.close()}
