import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GRAPHICS_KEY,GRAPHICS_ORDER,GRAPHICS_PRESETS,DynamicResolution,loadGraphicsQuality,saveGraphicsQuality} from '../src/presentation/graphics-settings';
import {SAVE_KEY,freshSave,decodeSave} from '../src/save';

const memory=(initial:Record<string,string>={})=>{const data=new Map(Object.entries(initial));return{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},data}};
test('graphics quality: High by default, remembered under its own key, never inside the game save',()=>{
 assert.equal(loadGraphicsQuality('',memory()),'high');const store=memory();assert.equal(saveGraphicsQuality('ultra',store),true);assert.equal(loadGraphicsQuality('',store),'ultra');assert.deepEqual([...store.data.keys()],[GRAPHICS_KEY]);assert.notEqual(GRAPHICS_KEY,SAVE_KEY);
 assert.equal(loadGraphicsQuality('?quality=medium',store),'medium','a link or benchmark can force a preset');assert.equal(loadGraphicsQuality('?quality=standard',memory()),'high','the pre-Phase 2 spelling still means High');assert.equal(loadGraphicsQuality('?quality=banana',memory({[GRAPHICS_KEY]:'nonsense'})),'high');
 assert.equal(loadGraphicsQuality('',{getItem(){throw Error('storage blocked')}}),'high');assert.equal(saveGraphicsQuality('low',{setItem(){throw Error('quota')}}),false);
 // Old saves are untouched by this work: same shape in, same shape out.
 assert.deepEqual(decodeSave(JSON.stringify(freshSave())),freshSave());assert.ok(!('graphics' in freshSave().settings));
});
test('presets step up monotonically; every preset uses the pipeline and Low keeps dynamic resolution',()=>{
 assert.deepEqual(GRAPHICS_ORDER,['low','medium','high','ultra']);const p=GRAPHICS_ORDER.map(q=>GRAPHICS_PRESETS[q]);
 assert.deepEqual(GRAPHICS_PRESETS.low,{label:'Low',post:true,samples:0,pixelRatioCap:1,bloomLevels:0,dynamicResolution:true,wetReflections:0,lighting:'low',waterSwell:false,vehicleEffects:.35,headlightFog:false,exhaustShimmer:false});assert.deepEqual(GRAPHICS_ORDER.map(q=>GRAPHICS_PRESETS[q].wetReflections),[0,0,2,1],'puddles mirror the sky only on Low/Medium; cars and lamps every other frame on High, every frame on Ultra');assert.ok(p.every(x=>x.post),'direct drawing measured slower than the pipeline, so it is only an automatic fallback');
 for(let i=1;i<p.length;i++){assert.ok(p[i].samples>=p[i-1].samples&&p[i].pixelRatioCap>=p[i-1].pixelRatioCap&&p[i].bloomLevels>=p[i-1].bloomLevels)}assert.equal(GRAPHICS_PRESETS.ultra.dynamicResolution,false,'Ultra never trades pixels');assert.equal(GRAPHICS_PRESETS.high.dynamicResolution,true);
});
test('dynamic resolution: drops under load, floors at 60%, climbs back, and does not bounce under vsync',()=>{
 const run=(d:DynamicResolution,ms:number,seconds:number)=>{for(let t=0;t<seconds*1000;t+=ms)d.update(ms)};
 const d=new DynamicResolution();run(d,16.7,3);assert.equal(d.scale,1,'a steady 60 Hz keeps full resolution');assert.ok(Math.abs(d.targetMs-16.7)<.3);
 run(d,33.3,20);assert.equal(d.scale,.6,'sustained long frames step down to the floor and never below');run(d,16.7,40);assert.equal(d.scale,1,'headroom brings it back');
 // A spike (tab switch, shader compile) is not rendering cost and must not move it.
 const calm=new DynamicResolution();run(calm,16.7,3);calm.update(900);calm.update(0);calm.update(NaN);assert.equal(calm.scale,1);
 // vsync trap: at scale s frames fit (16.7), one step higher they miss (33.3). It may probe once, then must hold.
 const v=new DynamicResolution();run(v,16.7,2);let changes=0,last=v.scale;for(let t=0;t<40000;){const ms=v.scale>.8?33.3:16.7;v.update(ms);t+=ms;if(v.scale!==last){changes++;last=v.scale}}assert.ok(v.scale<=.8&&v.scale>=.6);assert.ok(changes<=8,'settles instead of oscillating: '+changes+' changes in 40 s');
 const off=new DynamicResolution();run(off,33.3,1);for(let i=0;i<200;i++)off.update(33.3,false);assert.equal(off.scale,1,'presets without dynamic resolution stay at 100%');
 const fast=new DynamicResolution();run(fast,6.9,3);assert.ok(fast.targetMs<7.5,'a 144 Hz panel gets a 144 Hz target');
});
test('every view renders through the pipeline, and the pipeline can always fall back to direct drawing',()=>{
 const drive=readFileSync('src/express.ts','utf8'),showroom=readFileSync('src/signature/scene.ts','utf8'),pipeline=readFileSync('src/presentation/render-pipeline.ts','utf8');
 for(const[name,source]of[['drive',drive],['showroom',showroom]]as const){assert.ok(source.includes('new RenderPipeline(renderer,graphics)'),name);assert.ok(source.includes('pipeline.onViewTarget(target=>{mirrors.viewTarget=target})'),name+': mirrors follow the view target');assert.ok(/prepareRenderer\(renderer,scene,camera,\(\)=>\{?(renderWetRoad\((true)?\);)?pipeline\.render\(scene,camera\)/.test(source),name+': post shader variants are built under the loading veil');assert.ok(source.includes('pipeline.resize()'),name)}
 assert.ok(!/renderer\.render\(scene,camera\)/.test(drive),'no stray direct draw of the game scene in the drive');
 assert.ok(pipeline.includes('if(!target){renderer.setRenderTarget(null);renderer.render(scene,camera);return}')&&pipeline.includes('this.unsupported=true'),'a GPU that cannot provide the HDR target falls back to drawing directly');assert.ok(pipeline.includes('#include <tonemapping_fragment>')&&pipeline.includes('#include <colorspace_fragment>'),'same tone mapping and output colour as the direct path');
});
test('calibration and retained test pad use shared presets, post warmup and refreshed pixel ratio',()=>{
 for(const file of ['src/calibration.ts','src/workbench.ts']){
  const source=readFileSync(file,'utf8');
  assert.ok(source.includes('new RenderPipeline(renderer,graphics)'),file);
  assert.ok(source.includes('loadGraphicsQuality()'),file);
  assert.ok(source.includes('prepareRenderer(renderer,scene,camera,render)'),file+': warm the same post path as displayed frames');
  assert.ok(!source.includes('renderer.render(scene,camera)'),file+': no direct-only inspection frames');
  assert.ok(source.includes('GRAPHICS_PRESETS[pipeline.quality].pixelRatioCap'),file+': resize uses active preset');
 }
});
