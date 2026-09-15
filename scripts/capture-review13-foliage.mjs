import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir=process.env.EVIDENCE_DIR;if(!dir)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(dir,{recursive:false});
await build({configFile:false,logLevel:'silent',publicDir:false,build:{outDir:path.resolve(dir+'/fixture'),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/review12-scene.ts'),name:'ReviewScene',formats:['iife'],fileName:()=> 'scene.js'}}});
const source=await fs.readFile(dir+'/fixture/scene.js','utf8');
const prior=JSON.parse(await fs.readFile('director-kit/production/evidence/P06/baseline-stock720/run.json','utf8'));
const layout=JSON.parse(await fs.readFile('public/assets/showcase-quality/scene-layout.json','utf8'));
const palm=layout.instances.find(p=>p.position[0]===17&&p.position[2]===-62);
const cellKey=`${palm.module}:0:-2`,key=`showcase_chunk_${cellKey}__lod`;
const rows=[],errors=[],browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const assets=Object.fromEntries(await Promise.all(['kit.glb','foundation.glb','scene-layout.json','textures/p06c-frond.png'].map(async n=>[n,createHash('sha256').update(await fs.readFile('public/assets/showcase-quality/'+n)).digest('hex')])));
try{
 for(const width of [1280,1920])for(const preset of ['day','night']){
  const ctx=await browser.newContext({viewport:{width,height:width*9/16},deviceScaleFactor:1}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/assets/showcase-quality/**',async r=>{const rel=new URL(r.request().url()).pathname.slice(1);if(rel.includes('..'))throw Error('Bad path');await r.fulfill({body:await fs.readFile('public/'+rel)})});
  await p.route('**/__p06c_foliage?*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'}));
  await p.route('**/__review11_telemetry',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(prior.initial.telemetry)}));
  await p.goto('http://127.0.0.1:5187/__p06c_foliage?preset='+preset+'&showcase=full');await p.addScriptTag({content:source});await p.waitForFunction(()=>window.__VISUAL?.ready,null,{timeout:120000});
  const shoot=async(name,eye,target)=>{
   const state=await p.evaluate(a=>window.__VISUAL.diagnostic(a.eye,a.target,45),{eye,target});
   const m=state.showcase.materialBindings.find(m=>m.name==='P06C_Palm_Frond');
   if(!m||Math.abs(m.alphaTest-.35)>1e-6||m.transparent!==false||m.side!==2)throw Error('Actual runtime alpha mask differs: '+JSON.stringify(m));
   await p.screenshot({path:dir+'/'+name+'.png'});rows.push({name,width,preset,state});return state;
  };
  for(const backdrop of ['sky','building'])for(const distance of [15,40,80])await shoot(`${width}-${preset}-${backdrop}-${distance}m`,[17+(backdrop==='sky'?1:-1)*distance,6.6,-62],[17,7.3,-62]);
  const state=await p.evaluate(()=>window.__VISUAL.inspect());const group=state.showcase.geometryLOD.cells.find(g=>g.key===cellKey);if(!group)throw Error('Selected palm cell missing');
  const {center,radius}=group;
  for(const threshold of [45,100])for(const delta of [-1,1]){
   const d=radius+threshold+delta;const shot=await shoot(`${width}-${preset}-transition-${threshold}-${delta<0?'before':'after'}`,[center[0]-d,center[1],center[2]],[17,7.3,-62]);
   const visible=shot.showcase.groups.filter(g=>g.name.startsWith(key)&&g.visible).map(g=>g.lod);
   const expected=threshold===45?(delta<0?0:1):(delta<0?1:2);if(!visible.length||visible.some(n=>n!==expected))throw Error('LOD did not cross expected threshold '+JSON.stringify(visible));
  }
  await ctx.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile(dir+'/foliage.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),browser:browser.version(),method:'Actual full runtime stationary diagnostic, DPR1;15/40/80m viewpoints plus +/-1m at actual nearest-cell-bound45/100m LOD transitions. Not motion/performance or human approval.',assets,rows,errors},null,2));
}finally{await fs.writeFile(dir+'/capture-state.json',JSON.stringify({assets,rows,errors,complete:rows.length===40},null,2));await browser.close()}
