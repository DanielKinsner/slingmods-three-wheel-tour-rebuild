import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {LOOKS,LOOK_ORDER,LOOK_KEY,DEFAULT_LOOK,resolveLook,rememberLook,lookSkyURLs} from '../src/presentation/time-of-day';
import {optionalDriveAssetURLs} from '../src/signature/drive-preparation';
import {recordKey,SAVE_KEY} from '../src/save';

const memory=(initial:Record<string,string>={})=>{const data=new Map(Object.entries(initial));return{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},data}};
const flat=(extra:Partial<Parameters<typeof resolveLook>[0]>={})=>resolveLook({route:'express',career:false,requested:'day',explicitLighting:false,search:'',storage:memory(),...extra});
test('Day and Night are the untouched validated looks; every look sits on one of the two validated bases',()=>{
 for(const id of['day','night']as const){const l=LOOKS[id];assert.equal(l.base,id);assert.equal(l.sky,null,'keeps the validated sky');assert.equal(l.sun,null);assert.equal(l.hemisphere,null);assert.equal(l.fog,null);assert.deepEqual(l.grade,{tint:[1,1,1],saturation:1,contrast:1})}
 assert.equal(LOOKS.day.exposure,.95);assert.equal(LOOKS.night.exposure,1.05);
 for(const id of LOOK_ORDER){const l=LOOKS[id];assert.ok(l.base==='day'||l.base==='night');assert.equal(l.lampsOn,l.base==='night','lamps follow the base, so lit streets and lit windows always agree');assert.ok(l.bloom.threshold>=.7&&l.grade.contrast>=.9&&l.grade.contrast<=1.2)}
 assert.deepEqual(LOOK_ORDER.filter(id=>LOOKS[id].wet),['after-rain','dusk-rain','night-rain']);
 // A wet variant is the same light with a wet road: same base, sky, rig, fog, exposure and grade as its dry look.
 for(const[wet,dry]of[['dusk-rain','dusk'],['night-rain','night']]as const){const{id:_a,label:_b,wet:_c,bloom:_d,...w}=LOOKS[wet],{id:_e,label:_f,wet:_g,bloom:_h,...d}=LOOKS[dry];assert.deepEqual(w,d)}
});
test('showcase defaults are wet (Dusk after rain on Express, After rain on Harbor); the owner can change and the choice is remembered per route',()=>{
 assert.deepEqual(DEFAULT_LOOK,{express:'dusk-rain',harbor:'after-rain'});assert.equal(flat().id,'dusk-rain');assert.equal(flat({route:'harbor'}).id,'after-rain');
 const store=memory();assert.equal(rememberLook('express','golden-hour',store),true);assert.equal(flat({storage:store}).id,'golden-hour');assert.equal(flat({route:'harbor',storage:store}).id,'after-rain','per route');assert.deepEqual([...store.data.keys()],[LOOK_KEY]);assert.notEqual(LOOK_KEY,SAVE_KEY,'not part of the game save');
 assert.equal(flat({search:'?look=after-rain',storage:store}).id,'after-rain','a link wins');assert.equal(flat({search:'?look=banana'}).id,'dusk-rain');assert.equal(flat({storage:memory({[LOOK_KEY]:'{broken'})}).id,'dusk-rain');assert.equal(flat({storage:{getItem(){throw Error('blocked')}}}).id,'dusk-rain');
 assert.equal(flat({requested:'night',explicitLighting:true}).id,'night','an explicit lighting=night request still means Night');
});
test('story lighting requirements and ridge atmospheres persist while ordinary career looks match free driving',()=>{
 for(const requested of['day','night']as const){assert.equal(resolveLook({route:'express',career:true,requested,explicitLighting:true,search:'?look=dusk',storage:memory()}).id,requested);assert.equal(resolveLook({route:'ridge',career:false,requested,explicitLighting:false,search:'?look=dusk',storage:memory()}).id,requested)}
 assert.equal(flat({career:true}).id,flat().id);assert.equal(flat({career:true,route:'harbor'}).id,flat({route:'harbor'}).id);
 const route={id:'harbor-express',version:'express-layout-v1'};for(const id of LOOK_ORDER)assert.ok([recordKey(route,'day'),recordKey(route,'night')].includes(recordKey(route,LOOKS[id].base)));
 const drive=readFileSync('src/express.ts','utf8');assert.ok(drive.includes('preset=look.base,'),'every existing system keeps keying on the validated base preset');
});
test('look skies are the 2K files, exist, are allowlisted for the hosted build and only warmed optionally',()=>{
 const allow=new Set((JSON.parse(readFileSync('demo-assets.json','utf8')).assets as string[]).map(a=>'/'+a));
 for(const url of lookSkyURLs()){assert.match(url,/-2k\.hdr$/,'never the 60-77 MB 8K masters');assert.ok(existsSync('public'+url),url);assert.ok(allow.has(url),url+' must ship on the hosted build')}
 assert.ok(optionalDriveAssetURLs('express').includes(LOOKS.dusk.sky!));assert.ok(optionalDriveAssetURLs('ridge').every(url=>!url.includes('/skies/')));
 assert.ok(readFileSync('src/express.ts','utf8').includes('Look sky unavailable; using the base sky.'),'a missing sky falls back to the base look instead of failing the drive');
});
test('wet road is visual only and its reflection pass draws only what belongs in a puddle',()=>{
 const road=readFileSync('src/presentation/race-asphalt.ts','utf8'),pass=readFileSync('src/presentation/wet-reflection.ts','utf8'),drive=readFileSync('src/express.ts','utf8');
 for(const file of['src/simulation/index.ts','src/course/environment.ts'])assert.ok(!/wet|puddle/i.test(readFileSync(file,'utf8')),file+': grip and physics know nothing about wet looks');
 assert.ok(road.includes("'-wet'"),'dry roads keep their own, unchanged shader');assert.ok(pass.includes('this.virtual.layers.set(WET_REFLECTION_LAYER)')&&pass.includes('scene.background=null'),'own layer, no sky: the road already mirrors the sky probe');
 assert.ok(drive.includes('[mirrors.group]'),'live mirror faces never appear in puddles');assert.ok(drive.includes("GRAPHICS_PRESETS[pipeline.quality].wetReflections"),'follows the quality preset live');assert.ok(/mirrors\.render\(renderer,scene,camera\);renderWetRoad\(\);pipeline\.render/.test(drive),'a top-level pass before the frame, like the mirrors');
});
