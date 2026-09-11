import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir=process.env.EVIDENCE_DIR;assert.ok(dir);await mkdir(dir,{recursive:false});
const asset=process.env.ASSET??'p03a1',diagnostic=process.env.DIAGNOSTIC??'',base=process.env.TWT_URL??'http://127.0.0.1:5187';
const cameras={front:[[0,1.3,-5.6],[0,.7,-.20],30],threequarter:[[-4.15282,.83004,-3.97128],[0,.5658,-.51932],30],side:[[6.5,1.4,0],[0,.65,0],38],rearquarter:[[4.6,2.8,6],[0,.65,0],38],wheel:[[-2.1,.8,-2.1],[-.8,.32,-1.2],36],cockpit:[[-.65,1.9,1.1],[-.27,.65,-.5],43],cabin:[[2.1,1.9,-1.0],[0,.7,.4],42]};
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={created:new Date().toISOString(),asset,diagnostic,cameras,sourceHashes:{},images:[],errors:[],method:'Isolated runtime screenshots. Matched before/after camera and rig; front/photo perspective approximate, not a metric survey.'};
for(const f of ['src/workbench.ts','src/presentation/inspection.ts','scripts/capture-p03a1-stills.mjs',`public/assets/vehicles/slingshot-${asset}.glb`])report.sourceHashes[f]=sha(await readFile(f));
if(process.env.VERIFY_BUILD==='1'){report.build=JSON.parse(await readFile('dist/review-build.json','utf8'));for(const [path,digest]of Object.entries(report.build.inputs))assert.equal(sha(await readFile(path)),digest,path);report.served={};for(const path of ['dist/review-build.json','dist/index.html',...(await readdir('dist/assets')).filter(f=>/\.(js|css)$/.test(f)).map(f=>'dist/assets/'+f),`public/assets/vehicles/slingshot-${asset}.glb`,'public/assets/inspection-bay-p03a1.glb','public/assets/test-pad.glb']){const digest=sha(await readFile(path));const response=await fetch(base+'/'+path.replace(/^(dist|public)\//,''));assert.equal(response.status,200,path);assert.equal(sha(Buffer.from(await response.arrayBuffer())),digest,path);report.served[path]=digest}}
const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=b.version();
try{const p=await b.newPage({viewport:{width:1440,height:960}});p.on('pageerror',e=>report.errors.push(e.message));const c=await p.context().newCDPSession(p);
async function shot(name){const bytes=Buffer.from((await c.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64');await writeFile(dir+'/'+name+'.png',bytes);report.images.push({name,sha256:sha(bytes),inspection:await p.evaluate(()=>window.__TWT.inspect()),passes:await p.evaluate(()=>window.__TWT.measurePasses())});}
await p.goto(base+'/?scene=vehicle&test=1&asset='+asset+(diagnostic?'&diagnostic='+diagnostic:''));await p.waitForFunction(()=>window.__TWT?.ready,null,{timeout:90000});
for(const [name,cam]of Object.entries(cameras)){if(process.env.VIEWS&&!process.env.VIEWS.split(',').includes(name))continue;await p.evaluate(cam=>window.__TWT.referenceCamera(...cam),cam);await shot(name)}
if(diagnostic&&!process.env.VIEWS){await p.evaluate(cam=>window.__TWT.referenceCamera(...cam),cameras.threequarter);for(let i=0;i<3;i++){await p.evaluate(a=>window.__TWT.lightSweep(a),i*2*Math.PI/3);await shot('sweep-'+i)}}
else if(!process.env.VIEWS){await p.goto(base+'/?test=1'+(asset==='p03a1'?'':'&asset='+asset));await p.waitForFunction(()=>window.__TWT?.ready,null,{timeout:90000});await shot('bay');for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const frame=await p.evaluate(a=>window.__TWT.reviewOrbit(a),a);assert.ok(frame.allInFront);assert.ok(Math.max(...['minX','maxX','minY','maxY'].map(k=>Math.abs(frame[k])))<.8001)}}
assert.deepEqual(report.errors,[]);if(report.build)for(const [path,digest]of Object.entries(report.build.inputs))assert.equal(sha(await readFile(path)),digest,path);await writeFile(dir+'/stills.json',JSON.stringify(report,null,2));console.log('Captured '+report.images.length+' runtime images: '+dir);
}finally{await b.close()}
