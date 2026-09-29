/**
 * Graphics before/after captures (handoff/GRAPHICS-AUDIT.md). Drives every route with the controlled clock to the same
 * frame counts, then saves the game canvas only (no HUD), canvas metrics and the renderer census for each moment.
 *
 *   node scripts/graphics/capture-looks.mjs <label> [slot,slot]
 *
 * BASE_URL defaults to the dev server (http://127.0.0.1:5186). Output: .tools/graphics/<label>/ (local, ignored).
 * Same label twice refuses to overwrite. One GPU job at a time.
 */
import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const [label,only]=process.argv.slice(2);
assert.ok(label&&/^[\w.-]+$/.test(label),'usage: capture-looks.mjs <label> [slot,slot]');
const base=process.env.BASE_URL||'http://127.0.0.1:5186',out=path.resolve('.tools/graphics',label);
const SLOTS=[
 {id:'express-dusk-rain',query:'scene=express&route=express&visual=2026&mode=race&look=dusk-rain',frames:[900,1800]},
 {id:'harbor-after-rain',query:'scene=express&route=harbor&visual=spyder&mode=race&look=after-rain',frames:[900,1800]},
 {id:'ridge-day',query:'scene=express&route=ridge&visual=2026&mode=race&lighting=day',frames:[900,1800]},
 {id:'ridge-night',query:'scene=express&route=ridge&visual=2026&mode=race&lighting=night',frames:[900,1800]},
 {id:'rally-day',query:'scene=rally&route=rally&visual=ryker&mode=race&look=day',frames:[900,2520,4320],rally:true},
].filter(s=>!only||only.split(',').includes(s.id));
assert.ok(SLOTS.length,'no matching slot');
await fs.mkdir(out,{recursive:true});
if((await fs.readdir(out)).length)throw Error('Label already used: '+out);

async function bundle(entry,name){const r=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve(entry),name,formats:['iife']}}});return(Array.isArray(r)?r[0]:r).output.find(c=>c.type==='chunk').code}
const drivers={road:await bundle('scripts/story-parity-driver.ts','GraphicsRoad'),rally:await bundle('scripts/rally/evidence-driver.ts','GraphicsRally')};

// Full Chromium, not the headless shell: the shell can silently fall back to software rendering.
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=d3d11','--mute-audio']});
const summary={label,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain','--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean),base,viewport:[1600,900],quality:'high',slots:[]};
try{
 for(const slot of SLOTS){
  const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1});
  await context.addInitScript(()=>{localStorage.setItem('slingmods-race-films','off')});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`${base}/?${slot.query}&quality=high&test=1&profile=1&clock=controlled`,{timeout:120000});
  await page.waitForFunction(()=>window.__EXPRESS?.ready||document.querySelector('.preview-recovery'),null,{timeout:180000});
  assert.equal(await page.locator('.preview-recovery').count(),0,slot.id+' opened recovery');
  await page.addScriptTag({content:slot.rally?drivers.rally:drivers.road});
  const gpu=await page.evaluate(()=>window.__EXPRESS.inspect().renderer);assert.match(String(gpu),/NVIDIA|AMD|Intel|Apple/,'software renderer: '+gpu);
  await page.evaluate(rally=>{
   const h=window.__EXPRESS,D=rally?window.GraphicsRally:window.GraphicsRoad;window.__g={now:performance.now(),frames:0};
   h.setDeviceSample(D.toDevice());h.normalFrame(window.__g.now);document.querySelector('#start-crew')?.click();
   const driver=rally?new D.RallyDriver(h.route):new D.EvidenceDriver(h.route);
   window.__g.drive=target=>{while(window.__g.frames<target){const s=h.lightweight();h.setDeviceSample(s.race.phase==='running'?driver.sample(s.telemetry,s.field):D.toDevice());h.normalFrame(window.__g.now+=1000/60,window.__g.frames===target-1);window.__g.frames++}h.setDeviceSample(D.toDevice())};
   // Canvas pixels right after a render (the buffer is valid in the same task), plus the skill's canvas metrics.
   window.__g.grab=()=>{h.normalFrame(window.__g.now);const gl=document.querySelector('#viewport canvas')||document.querySelector('canvas'),c=document.createElement('canvas');c.width=gl.width;c.height=gl.height;const x=c.getContext('2d');x.drawImage(gl,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data,cols=160,rows=90,sx=Math.floor(c.width/cols),sy=Math.floor(c.height/rows),lum=new Float32Array(cols*rows),buckets=new Map();
    for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){const o=((gy*sy)*c.width+gx*sx)*4,r=d[o],g=d[o+1],b=d[o+2];lum[gy*cols+gx]=.2126*r+.7152*g+.0722*b;const k=(r>>4)+','+(g>>4)+','+(b>>4);buckets.set(k,(buckets.get(k)||0)+1)}
    const sorted=Array.from(lum).sort((a,b)=>a-b),n=sorted.length;let e=0,dom=0;for(const v of buckets.values()){const p=v/n;e-=p*Math.log2(p);dom=Math.max(dom,v)}
    let edges=0,checked=0;for(let gy=0;gy<rows-1;gy++)for(let gx=0;gx<cols-1;gx++){const i=gy*cols+gx;if(Math.max(Math.abs(lum[i]-lum[i+1]),Math.abs(lum[i]-lum[i+cols]))>12)edges++;checked++}
    const r2=v=>Math.round(v*100)/100;
    return{png:c.toDataURL('image/png'),metrics:{colorEntropyBits:r2(e),edgeDensity:r2(edges/checked*10)/10,luminance:{mean:r2(sorted.reduce((a,v)=>a+v,0)/n),p5:sorted[Math.floor(n*.05)],p95:sorted[Math.floor(n*.95)],contrast:r2(sorted[Math.floor(n*.95)]-sorted[Math.floor(n*.05)])},dominantColorShare:r2(dom/n*10)/10}}};
  },!!slot.rally);
  const shots=[];
  for(const frame of slot.frames){
   await page.evaluate(f=>window.__g.drive(f),frame);
   const {png,metrics}=await page.evaluate(()=>window.__g.grab());
   const file=`${slot.id}-${frame}.png`;await fs.writeFile(path.join(out,file),Buffer.from(png.split(',')[1],'base64'));
   // Renderer census needs renders to watch: hold the same frozen instant while it samples.
   const census=await page.evaluate(async()=>{const h=window.__EXPRESS,t=setInterval(()=>h.normalFrame(window.__g.now),30);try{return await Promise.race([h.drawCensus(6),new Promise((_,j)=>setTimeout(()=>j(Error('census timeout')),10000))])}finally{clearInterval(t)}}).catch(e=>({error:e.message}));
   const main=(census.passes??[]).filter(p=>p.target==='pipeline-scene');
   const state=await page.evaluate(()=>{const s=window.__EXPRESS.inspect(),l=window.__EXPRESS.lightweight();return{look:s.look,memory:s.memory,pixelRatio:s.pixelRatio,race:l.race.phase,speed:l.telemetry.speed,position:l.telemetry.position}});
   shots.push({frame,file,metrics,renderer:{calls:main.length?Math.max(...main.map(p=>p.calls)):null,triangles:main.length?Math.max(...main.map(p=>p.triangles)):null,passes:(census.passes??[]).length,error:census.error},state});
   console.log(slot.id,frame,JSON.stringify(metrics.luminance),'calls',shots.at(-1).renderer.calls);
  }
  summary.slots.push({id:slot.id,query:slot.query,gpu,errors,shots});
  await context.close();
 }
}finally{await browser.close();await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,1))}
console.log('wrote',out);
