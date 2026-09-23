import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR||'assets/ryker/evidence/complete/hardware',base=process.env.BASE_URL||'http://127.0.0.1:5199';
await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const p=await b.newPage({viewport:{width:1600,height:1000}}),report={method:'Packaged game, controlled fixed simulation through ordinary keyboard inputs. Audio records the actual runtime graph in real wall time; this is not a native performance measurement.',errors:[],states:{},contacts:{}};
p.on('pageerror',e=>report.errors.push(e.message));
async function step(keys,frames){return p.evaluate(([keys,frames])=>{const h=window.__EXPRESS;h.setDeviceSample({keys,pads:[],focused:true});let s;for(let i=0;i<frames;i++){s=h.normalFrame(window.frameNow,i===frames-1);window.frameNow+=1000/60}return s},[keys,frames])}
async function shot(name,pos=[1.8,.85,-2.5],target=[0,.38,-.2]){const image=await p.evaluate(([pos,target])=>window.__EXPRESS.referenceCamera('player',pos,target),[pos,target]);await writeFile(`${out}/${name}.png`,Buffer.from(image.split(',')[1],'base64'))}
async function open(route){await p.goto(`${base}/?scene=express&route=${route}&mode=free&play=preview&visual=ryker&test=1&profile=1&clock=controlled&captureBuffer=1`);await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});await p.evaluate(()=>window.frameNow=0);await p.locator('#start-crew').click();await step([],180)}
try{
 await open('harbor');report.states.settled=await step([],60);
 report.contacts.settled=await p.evaluate(()=>window.__EXPRESS.contactEvidence());await shot('contacts-stock');
 report.states.accelerating=await step(['ArrowUp'],90);assert.ok(report.states.accelerating.telemetry.speed>5);
 report.states.steering=await step(['ArrowUp','ArrowLeft'],8);
 report.contacts.steering=await p.evaluate(()=>window.__EXPRESS.contactEvidence());await shot('contacts-steering');
 report.states.brakingTurn=await step(['ArrowDown','ArrowLeft'],20);await shot('braking-turn');
 report.states.stopped=await step(['ArrowDown'],180);assert.ok(Math.abs(report.states.stopped.telemetry.speed)<.4);
 await step(['KeyX'],2);await step([],2);report.states.reverse=await step(['ArrowUp'],100);assert.equal(report.states.reverse.telemetry.gear,-1);assert.ok(report.states.reverse.telemetry.speed<-.5);assert.equal(await p.locator('#race-gear').textContent(),'R');
 await shot('reverse');await p.evaluate(()=>window.__EXPRESS.clearContactEvidence?.());await step(['ArrowDown'],120);await step(['KeyX'],2);await step([],2);
 for(let i=0;i<3;i++){if((await step([],1)).camera.view==='cockpit')break;await step(['KeyC'],2);await step([],2)}
 report.states.cockpit=await step(['ArrowUp','ArrowRight'],15);await p.waitForTimeout(160);report.states.cockpit=await step([],1);await p.screenshot({path:out+'/cockpit.png'});
 assert.equal(report.states.cockpit.camera.view,'cockpit');assert.equal(report.states.cockpit.telemetry.powertrain,'cvt');
 for(const [name,c]of Object.entries(report.contacts))for(const wheel of c.errors)assert.ok(wheel.errorMetres<.001,`${name} ${wheel.wheel} contact alignment`);
 for(const [name,s]of Object.entries(report.states)){assert.equal(s.telemetry.powertrain,'cvt');assert.equal(s.telemetry.shifting,false);for(const arm of Object.values(s.visual.driver.arms))assert.ok(arm.gap<.02,`${name} rider grip ${arm.gap}`)}
 await p.locator('#enable-sound').click();await p.waitForFunction(()=>window.__EXPRESS.inspect().audio.enabled);await p.evaluate(()=>window.__EXPRESS.startAudioCapture());
 for(let i=0;i<30;i++){await step(i<6?[]:i<20?['ArrowUp']:['ArrowDown'],6);await p.waitForTimeout(100)}
 const audio=await p.evaluate(()=>window.__EXPRESS.stopAudioCapture());await writeFile(out+'/engine-runtime.webm',Buffer.from(audio.base64,'base64'));report.audio={...audio,base64:undefined};
 for(const route of ['express','ridge']){await open(route);report.states[route]=await step(['ArrowUp'],180);assert.ok(report.states[route].telemetry.speed>4);await shot(route+'-drive')}
 assert.deepEqual(report.errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await b.close()}
