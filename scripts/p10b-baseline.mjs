import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL||'http://127.0.0.1:5197';if(!out)throw Error('Fresh evidence directory required');await fs.mkdir(out,{recursive:false});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/p09c-career-driver.ts'),name:'Evidence',formats:['iife']}}}),source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),rows=[],errors=[];
try{
 for(const [width,height]of [[1280,720],[1920,1080]]){
  const c=await b.newContext({viewport:{width,height}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
  async function shot(name){await p.waitForTimeout(220);const state=await p.evaluate(()=>window.__SIGNATURE.inspect());await p.screenshot({path:out+'/'+width+'-'+name+'.png'});rows.push({name,width,height,state})}
  async function act(action,value){await p.locator(`[data-action="${action}"]${value?`[data-value="${value}"]`:''}`).first().click();await p.waitForFunction(()=>!window.__SIGNATURE.inspect().pending)}
  await p.goto(base+'/?scene=signature&test=1&profile=1');await ready();await shot('entry-blue');await act('build');await shot('paint-blue');await act('finish','black-red');await shot('paint-black');await act('finish','blue-orange');
  for(const category of ['Lighting','Suspension','Exhaust']){await act('category',category);await shot(category.toLowerCase())}
  await act('quick-race');await shot('destinations');await act('build');await act('shop');await shot('shop');
  await p.goto(base+'/?scene=career&play=career&test=1&profile=1');await p.waitForFunction(()=>window.__CAREER_HUB?.ready);await p.screenshot({path:out+'/'+width+'-career.png'});
  await c.close();
 }
 for(const route of ['harbor','express','ridge']){
  const c=await b.newContext({viewport:{width:1920,height:1080}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/?scene=express&route='+route+'&mode=race&test=1&profile=1&clock=controlled');await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});await p.addScriptTag({content:source});await p.evaluate(()=>{window.__driver=new window.Evidence.EvidenceDriver(window.__EXPRESS.route);window.__clock=0;window.__EXPRESS.setDeviceSample(window.Evidence.toDevice())});await p.locator('#start-crew').click();let captured=false;
  for(let n=0;n<220;n++){const s=await p.evaluate(()=>{const h=window.__EXPRESS;for(let i=0;i<60;i++){const t=h.lightweight();h.setDeviceSample(t.race.phase==='running'?window.__driver.sample(t.telemetry,t.field,1/60):window.Evidence.toDevice());h.normalFrame(window.__clock+=1000/60,i===59)}return h.inspect()});
   if(!captured&&s.telemetry.speed>20){await p.screenshot({path:out+'/'+route+'-hud.png'});rows.push({name:route+'-hud',state:s});captured=true}
   if(s.race.playerResult){await p.waitForTimeout(350);await p.screenshot({path:out+'/'+route+'-result.png'});rows.push({name:route+'-result',state:s});break}
  }await c.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,base,rows,errors,browser:b.version(),method:'Actual UI and control-only full laps at the recorded base/build. Controlled-clock race images are visual evidence, not performance.'},null,2));
}catch(e){await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,rows,errors},null,2));throw e}finally{await b.close()}
