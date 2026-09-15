import test from 'node:test';
import assert from 'node:assert/strict';
import {DemoCareerStore,freshDemo} from '../src/demo/store';
import {DEMO_CAREER_KEY,DEMO_SETTINGS_KEY,profileFrom,profileHref,resetDemo,visitorSearch,transferTarget} from '../src/demo/profile';
import {freshCareer} from '../src/career/store';
import {browserStorage,freshSave,SAVE_KEY,writeSave,loadSave} from '../src/save';
const storage=()=>{const values=new Map<string,string>();return {values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}}};
test('explicit demo identity keeps normal career and profiler flags independent',()=>{
 assert.equal(transferTarget(new URL('https://local.example/?scene=harbor&preset=night&play=demo'),true),'/?scene=harbor&play=demo&preset=night');assert.equal(profileFrom('?profile=1'),'career');assert.equal(profileFrom('?play=demo&profile=1'),'demo');assert.equal(profileFrom('?play=unknown'),'career');
 assert.equal(profileHref('?scene=crew&profile=1','demo','https://local.example/game/'),'/game/?scene=crew&profile=1&play=demo');
 assert.equal(profileHref('https://www.slingmods.com/product','demo','https://local.example/game/'),'https://www.slingmods.com/product');
});
test('visitor allowlist rejects historical selectors and permits only paired isolated evidence',()=>{
 assert.equal(visitorSearch('?scene=vehicle&asset=p01&neutral=1&test=1&profile=1&play=demo'), 'play=demo&test=1&profile=1');
 assert.equal(visitorSearch('?scene=crew&test=1&clock=controlled&play=demo'), 'scene=crew&play=demo');
 assert.equal(visitorSearch('?scene=crew&test=1&profile=1&clock=controlled&captureBuffer=1&seed=2'),'scene=crew&test=1&profile=1&clock=controlled&captureBuffer=1&seed=2');
});
test('demo preset declares availability without manufacturing rewards; original transition still validates results',async()=>{
 const data=storage(),store=new DemoCareerStore(data);const state=await store.read();assert.equal(state.owned,true);assert.equal(state.equipped,true);assert.equal(state.credits,0);assert.deepEqual(state.receipts,{});assert.equal(state.chapters.firstCompletion,true);
 await assert.rejects(store.execute({type:'crew-award',result:{} as never}),/verified competition/);
 await store.execute({type:'equip',equipped:false});const reload=new DemoCareerStore(data);assert.equal((await reload.read()).equipped,false);assert.equal(data.values.size,1);assert.ok(data.values.has(DEMO_CAREER_KEY));
 assert.deepEqual(freshCareer().chapters,{entry:false,firstCompletion:false,firstBuild:false});
});
test('separate demo tabs and reset cannot change personal save keys or another tab',async()=>{
 const first=storage(),second=storage();first.setItem(SAVE_KEY,'personal settings');first.setItem('career-sentinel','personal career');first.setItem(DEMO_SETTINGS_KEY,'demo settings');
 const a=new DemoCareerStore(first),b=new DemoCareerStore(second);await a.execute({type:'equip',equipped:false});assert.equal((await b.read()).equipped,true);
 resetDemo(first);assert.equal(first.getItem(SAVE_KEY),'personal settings');assert.equal(first.getItem('career-sentinel'),'personal career');assert.equal(first.getItem(DEMO_CAREER_KEY),null);assert.equal(first.getItem(DEMO_SETTINGS_KEY),null);assert.notEqual(second.getItem(DEMO_CAREER_KEY),null);
});
test('corrupt demo data is retained until deliberate demo reset, never migrated into career',()=>{
 const data=storage();data.setItem(DEMO_CAREER_KEY,'broken');assert.throws(()=>new DemoCareerStore(data),/Reset only the demo/);assert.equal(data.getItem(DEMO_CAREER_KEY),'broken');
});
test('storage denial after a demo mutation retains session state and stops claiming persistence',async()=>{
 const data=storage();let denied=false;const store=new DemoCareerStore({...data,setItem:(key:string,value:string)=>{if(denied)throw Error('denied');data.setItem(key,value)}});denied=true;await store.execute({type:'equip',equipped:false});assert.equal(store.durable,false);assert.equal((await store.read()).equipped,false);
});
test('a newer same-profile handoff wins over stale readable session data after write failure',async()=>{
 const data=storage();const first=new DemoCareerStore(data);const initial=await first.read();let denied=true;const limited={getItem:data.getItem,setItem:(key:string,value:string)=>{if(denied)throw Error('denied');data.setItem(key,value)}};
 const moving=new DemoCareerStore(limited);await moving.execute({type:'equip',equipped:false});const transfer=await moving.read();assert.ok(transfer.revision>initial.revision);assert.equal(JSON.parse(data.getItem(DEMO_CAREER_KEY)!).equipped,true);
 const destination=new DemoCareerStore(limited,transfer);assert.equal((await destination.read()).equipped,false);assert.equal(destination.durable,false);denied=false;
});
test('browser settings and lap storage is isolated for demo and unchanged for career',()=>{
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),previousLocation=Object.getOwnPropertyDescriptor(globalThis,'location');const session=storage(),local=storage();local.setItem(SAVE_KEY,JSON.stringify(freshSave()));const before=local.getItem(SAVE_KEY);
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{sessionStorage:session,localStorage:local}});Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?play=demo'}});
 const demo=freshSave();demo.settings.mute=true;demo.records['demo-lap']={timeMs:123,recordedAt:'2026-09-15'};assert.equal(writeSave(browserStorage(),demo),true);assert.equal(loadSave(browserStorage()).settings.mute,true);assert.equal(local.getItem(SAVE_KEY),before);assert.ok(session.getItem(DEMO_SETTINGS_KEY));
 Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?play=career'}});assert.equal(loadSave(browserStorage()).settings.mute,false);assert.deepEqual(loadSave(browserStorage()).records,{});
 }finally{if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else delete (globalThis as any).window;if(previousLocation)Object.defineProperty(globalThis,'location',previousLocation);else delete (globalThis as any).location}
});
