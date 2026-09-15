import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
if(!base||!out)throw Error('BASE_URL and fresh EVIDENCE_DIR required');
await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),c=await b.newContext({viewport:{width:1280,height:720}}),p=await c.newPage(),errors=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(base+'/?scene=crew&play=demo&test=1&profile=1');
 await p.waitForFunction(()=>window.__CREW?.ready,null,{timeout:120000});
 const ready=await p.evaluate(()=>window.__CREW.inspect());
 assert.equal(ready.participants,4);assert.equal(ready.race.phase,'ready');
 await p.locator('#start-crew').click();
 await p.waitForFunction(()=>window.__CREW.inspect().race.phase==='running');
 await p.keyboard.down('w');await p.waitForTimeout(2000);await p.keyboard.up('w');
 const moving=await p.evaluate(()=>window.__CREW.inspect());
 assert.ok(moving.ticks>ready.ticks);assert.ok(moving.telemetry.speed>1);
 await p.locator('#race-pause').click();await p.screenshot({path:out+'/prepared-demo.png'});
 const storage=await c.storageState({indexedDB:true});
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,browser:b.version(),ready,moving,storage,errors,method:'Fresh isolated browser, ordinary prepared-demo Start and keyboard acceleration/pause. No owner profile or save copied. This is a historical-demo smoke check, not a full race or performance claim.'},null,2));
}catch(e){await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors},null,2));throw e}finally{await c.close();await b.close()}
