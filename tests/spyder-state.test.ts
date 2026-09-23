import test from 'node:test';import assert from 'node:assert/strict';
import {freshCareer,transition,migrateCareer} from '../src/career/store';
import {careerRecipe} from '../src/career-experience/model';
import {freshSpyderRecipe,freshRykerRecipe,freshRecipe,validateRecipe,previewSnapshot,BuildRepository} from '../src/signature/config';
import {SPYDER_PRODUCTS} from '../src/signature/spyder-catalog';
import {comparisonIdentity} from '../src/game/build-identity';
import {recordChallenge,challengeBest,CHALLENGES} from '../src/game/challenges';
test('six separate purchases, ownership, setup and old saves survive switching; transactions are idempotent',()=>{
 let s=freshCareer();s.credits=5000;s.owned=true;s.equipped=true;const sling=careerRecipe(s);s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;s=transition(s,{type:'chapter-ryker-purchase',part:'body',id:crypto.randomUUID()}).state;const ryker=careerRecipe(s),start=s.credits;
 s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-spyder-f3'}).state;
 assert.throws(()=>transition(s,{type:'chapter-spyder-equip',part:'front',equipped:true}));
 for(const part of SPYDER_PRODUCTS){const id=crypto.randomUUID();s=transition(s,{type:'chapter-spyder-purchase',part:part.id,id}).state;assert.equal(transition(s,{type:'chapter-spyder-purchase',part:part.id,id}).changed,false);assert.equal(careerRecipe(s).spyder!.parts[part.id],true);s=transition(s,{type:'chapter-spyder-equip',part:part.id,equipped:false}).state;assert.equal(careerRecipe(s).spyder!.parts[part.id],false);s=transition(s,{type:'chapter-spyder-equip',part:part.id,equipped:true}).state}
 assert.equal(s.credits,start-SPYDER_PRODUCTS.reduce((n,p)=>n+p.credits,0));const equipped=careerRecipe(s);
 const id=crypto.randomUUID();s=transition(s,{type:'chapter-one-begin',id,event:'shakedown',preset:'night'}).state;
 for(const [vehicle,expected] of [['slingshot-r-2024',sling],['can-am-ryker-900',ryker],['can-am-spyder-f3',equipped]] as const){s=transition(s,{type:'chapter-vehicle',vehicle}).state;s=migrateCareer(JSON.parse(JSON.stringify(s)));assert.deepEqual(careerRecipe(s),expected);assert.deepEqual(s.ownBuild.chapterOne!.entries[id].recipe,equipped)}
 const retry=crypto.randomUUID();s=transition(s,{type:'chapter-one-begin',id:retry,event:'shakedown',preset:'day',retryOf:id}).state;assert.deepEqual(s.ownBuild.chapterOne!.entries[retry].recipe,equipped);assert.equal(s.ownBuild.chapterOne!.entries[retry].preset,'night');
});
test('preview cannot forge Spyder ownership or accept cross-vehicle products and frozen runs do not mutate',()=>{
 const r=freshSpyderRecipe();r.spyder!.parts.front=true;const s=transition(freshCareer(),{type:'chapter-vehicle',vehicle:'can-am-spyder-f3'}).state;s.ownBuild.spyder!.recipe=r;assert.throws(()=>migrateCareer(s));assert.throws(()=>validateRecipe({...r,ryker:{shocks:true}}));assert.throws(()=>validateRecipe({...r,products:{'SM-3223':'silver'}}));assert.throws(()=>validateRecipe({...r,handlingProfile:'ryker-road-v1'}));const snap=previewSnapshot(r,'ridge','race');r.spyder!.front.preload=1;assert.equal(snap.recipe.spyder!.front.preload,0);assert.ok(Object.isFrozen(snap.recipe.spyder!.parts));
});
test('all three free-preview namespaces retain their own recipes and snapshots',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const rows=[['slingshot',freshRecipe()],['ryker',freshRykerRecipe()],['spyder',freshSpyderRecipe()]] as const;
 for(const [id,recipe] of rows){const repo=new BuildRepository(storage,storage,id);repo.setDraft(recipe);repo.save('Mine',recipe);repo.beginDrive(recipe,'harbor','test')}
 for(const [id,recipe] of rows){const repo=new BuildRepository(storage,storage,id);assert.deepEqual(repo.draft(),recipe);assert.deepEqual(repo.recipes()[0].recipe,recipe);assert.deepEqual(repo.drive().recipe,recipe)}assert.equal(data.size,9);
});
test('Spyder challenge comparisons are partitioned by frozen equipment/tune while historical records survive',()=>{
 const data=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
 const a=freshSpyderRecipe(),b=structuredClone(a);b.spyder!.parts.throttle=true;b.spyder!.mode='Sport';const idA=comparisonIdentity(a),idB=comparisonIdentity(b);assert.notEqual(idA,idB);b.finish='black-red';assert.equal(comparisonIdentity(b),idB);
 const c=CHALLENGES[1];recordChallenge(c,38000,'slingshot-r-2024');recordChallenge(c,39000,idA);recordChallenge(c,36000,idB);assert.equal(challengeBest(c.id)!.value,38000);assert.equal(challengeBest(c.id,idA)!.value,39000);assert.equal(challengeBest(c.id,idB)!.value,36000);
});
