import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5201',out=process.env.EVIDENCE_DIR;
if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),rows=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
await context.addInitScript(()=>{const p=new URLSearchParams(location.search);p.set('test','1');p.set('profile','1');history.replaceState(null,'','?'+p+location.hash)});
const signature=()=>page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
const drive=()=>page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
const inspect=()=>page.evaluate(()=>window.__SIGNATURE?.inspect()??window.__EXPRESS?.inspect()??window.__HARBOR?.inspect()??window.__CREW?.inspect());
const action=(name,value)=>page.locator(`[data-action="${name}"]${value?'[data-value="'+value+'"]':''}`).first().click();
const idle=()=>page.waitForFunction(()=>!window.__SIGNATURE.inspect().pending);
const checkDrive=(s,id)=>{assert.equal(s.handlingProfile,id);assert.equal(s.profileContract.simulation,id);assert.equal(s.profileContract.input,id);assert.equal(s.profileContract.field,id);assert.equal(s.race.handlingProfileId,id);assert.equal(s.recipe.handlingProfile,id)};
try{
 await page.goto(base+'/?scene=signature&screen=build');await signature();const fresh=await inspect();assert.equal(fresh.recipe.handlingProfile,'slingmods-sport-v3');rows.push({phase:'fresh-showroom',state:fresh});
 await page.evaluate(()=>{localStorage.setItem('p09c-career-sentinel','keep exact bytes');sessionStorage.setItem('slingmods-signature-motion','reduced')});
 for(const route of ['harbor','express'])for(const mode of ['test','race']){await page.evaluate(()=>sessionStorage.removeItem('slingmods-signature-drive-v1'));await page.goto(base+`/?scene=express&route=${route}&mode=${mode}&play=preview`);await drive();const state=await inspect();checkDrive(state,'slingmods-sport-v3');assert.equal(state.free,mode==='test');rows.push({phase:'fresh-direct-'+route+'-'+mode,state});}
 for(const profile of ['slingmods-sport-v1','slingmods-sport-v2']){
  const old={...fresh.recipe,handlingProfile:profile,finish:'white-graphite',products:{'SM-7720':'brushed-silver','SM-3223':'silver'}};
  await page.goto(base+'/?scene=signature&screen=build#build='+encodeURIComponent(JSON.stringify(old)));await signature();assert.deepEqual((await inspect()).recipe,old);
  await action('category','Build Presets');await page.locator('#signature-recipe-name').fill('Original '+profile);await action('save');await idle();
  await action('compare');await idle();const compare=await inspect();assert.equal(compare.recipe.handlingProfile,profile);assert.equal(compare.simulationProfile,profile);await action('compare');await idle();
  await action('test-drive');await drive();checkDrive(await inspect(),profile);await page.locator('[data-action=bay]').click();await signature();assert.deepEqual((await inspect()).recipe,old);
  await action('category','Build Presets');await action('use-current-driving');await idle();const current=await inspect();assert.equal(current.recipe.handlingProfile,'slingmods-sport-v3');assert.deepEqual({...current.recipe,handlingProfile:profile},old);assert.deepEqual(current.saved.find(r=>r.name==='Original '+profile).recipe,old);rows.push({phase:'explicit-upgrade-'+profile,state:current});await page.screenshot({path:out+'/'+profile+'-current-copy.png'});
  await page.reload();await signature();assert.deepEqual((await inspect()).recipe,current.recipe);await action('test-drive');await drive();checkDrive(await inspect(),'slingmods-sport-v3');await page.locator('[data-action=bay]').click();await signature();assert.deepEqual((await inspect()).recipe,current.recipe);assert.equal(await page.evaluate(()=>localStorage.getItem('p09c-career-sentinel')),'keep exact bytes');
 }
 // Demo prepares Chapter01 access in its isolated namespace; no production career opening.
 await page.goto(base+'/?scene=harbor&play=demo');await page.waitForFunction(()=>window.__HARBOR?.ready,null,{timeout:120000});let state=await inspect();assert.equal(state.handlingProfile,'slingmods-sport-v3');assert.equal(state.profileContract.input,'slingmods-sport-v3');rows.push({phase:'prepared-demo-time-trial',state});
 for(const extra of ['&event=duel','']){await page.goto(base+'/?scene=crew&play=demo'+extra);await page.waitForFunction(()=>window.__CREW?.ready,null,{timeout:120000});state=await inspect();assert.equal(state.handlingProfile,'slingmods-sport-v3');assert.equal(state.profileContract.input,'slingmods-sport-v3');assert.equal(state.race.handlingProfileId,'slingmods-sport-v3');rows.push({phase:extra?'prepared-demo-duel':'prepared-demo-crew',state})}
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,method:'Isolated fresh browser, ordinary UI and actual scene creation; explicit historical recipes and one-action copies, reload, free drive return, route/profile/player/input/field consistency. No personal saves. No performance claim.',browser:browser.version(),rows,errors},null,2));
}catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:error.stack,rows,errors,state:await inspect().catch(()=>null)},null,2));throw error}finally{await context.close();await browser.close()}
