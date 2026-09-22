import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.RYKER_URL??'http://127.0.0.1:5198',out='C:/Users/SM - Dan/Documents/GitHub/slingmods game/ryker-purchased/work/mods';
await mkdir(out,{recursive:true});const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']}),p=await b.newPage({viewport:{width:1440,height:1000}}),report={base,errors:[],parts:{}};
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
await p.addInitScript(()=>{const u=new URL(location.href);if(u.searchParams.get('scene')==='express'){u.searchParams.set('test','1');u.searchParams.set('profile','1');history.replaceState(null,'',u.href)}});
const ready=()=>p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
async function capture(name,pos,target){const data=await p.evaluate(([pos,target])=>{window.__SIGNATURE.referenceCamera(pos,target);return document.querySelector('canvas').toDataURL()},[pos,target]);await writeFile(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'))}
try{
 await p.goto(base+'/?scene=signature&visual=ryker&screen=build&test=1&profile=1');await ready();
 assert.equal(await p.locator('.vehicle-appearance-picker').isVisible(),true);assert.equal(await p.locator('[data-action=category][data-value=Storage]').count(),0);assert.equal(await p.locator('[data-action=category][data-value=Aero]').count(),0);
 await capture('stock-front',[1.7,1.05,-2.5],[0,.47,-.32]);
 for(const [category,id] of [['Body Kit','body'],['Suspension','shocks'],['Exhaust','exhaust'],['Lighting','underglow']]){
  await p.locator(`[data-action=category][data-value="${category}"]`).click();await p.locator(`[data-action=ryker-toggle][data-value=${id}]`).click();await p.waitForFunction(()=>document.querySelector('.signature-ui')?.getAttribute('aria-busy')==='false');
  await p.locator(`[data-action=view][data-value=ryker-${id}]`).click();await p.waitForTimeout(800);await p.screenshot({path:`${out}/${id}-ui.png`});report.parts[id]=await p.evaluate(()=>window.__SIGNATURE.inspect().products);
 }
 await capture('panther-front',[1.7,1.05,-2.5],[0,.47,-.32]);await capture('treal-rear',[1.1,.50,1.5],[.11,.27,.33]);await capture('elka-front',[-.95,.62,-1.58],[-.29,.30,-.85]);
 await p.locator('[data-action=advanced]').click();await p.locator('[data-action=lighting][data-value=lights]').first().click();await p.waitForTimeout(500);await capture('night-kit',[1.7,1.05,-2.5],[0,.47,-.32]);
 report.equipped=await p.evaluate(()=>window.__SIGNATURE.inspect());await p.screenshot({path:out+'/all-mods-ui.png'});
 await p.locator('[data-action=compare]').click();report.stock=await p.evaluate(()=>window.__SIGNATURE.inspect().products);assert.deepEqual(report.stock.ryker.selected,{});await p.locator('[data-action=compare]').click();
 await p.locator('[data-vehicle="2026"]').click();await ready();assert.equal(await p.locator('[data-action=category][data-value=Storage]').count(),1);assert.equal(await p.locator('[data-action=category][data-value="Body Kit"]').count(),0);
 await p.locator('[data-action=finish][data-value=white-graphite]').click();await p.waitForFunction(()=>document.querySelector('.signature-ui')?.getAttribute('aria-busy')==='false');await p.screenshot({path:out+'/slingshot-switch.png'});
 await p.locator('[data-vehicle=ryker]').click();await ready();assert.equal(await p.locator('[data-action=finish][data-value=blue-orange]').getAttribute('aria-pressed'),'true');report.returned=await p.evaluate(()=>window.__SIGNATURE.inspect());
 await p.locator('[data-action=category][data-value="Body Kit"]').click();assert.equal(await p.locator('[data-action=ryker-toggle][data-value=body]').innerText(),'Remove');
 await p.locator('.sig-navigation [data-action=shop]').click();assert.equal(await p.locator('.sig-shop-list article').count(),4);await p.screenshot({path:out+'/shop.png'});
 await p.locator('.sig-navigation [data-action=build]').click();await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:out+'/mobile.png'});assert.equal(await p.locator('[data-vehicle="2026"]').isVisible(),true);
 await p.setViewportSize({width:1440,height:1000});
 // Same per-vehicle equipment reaches the shared road runtime.
 await p.locator('.sig-test [data-action=quick-race]').click();await p.locator('[data-action=destination][data-value=harbor]').click();await p.locator('[data-action=test-drive]').first().click();await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});report.drive=await p.evaluate(()=>window.__EXPRESS.inspect());assert.deepEqual(report.drive.products.ryker.selected,{body:true,shocks:true,exhaust:true,underglow:true});await p.locator('#start-crew').click();await p.waitForTimeout(1000);await p.screenshot({path:out+'/drive.png'});

 assert.deepEqual(report.errors,[]);report.pass=true;
}catch(e){report.failure=e.stack;throw e}finally{await writeFile(out+'/browser.json',JSON.stringify(report,null,2));await b.close()}
