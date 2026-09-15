import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {freshCareer,migrateCareer,transition,MemoryCareerStore,CareerDataError,type Career,type Command} from '../src/career/store';
import {certifyCrewFinish,CREW_EVENT} from '../src/career/crew-result';
import {PRODUCT} from '../src/career/catalog';
// Original crew-economy tests use a migrated pre-P08A earned career.
const clean=(s=freshCareer())=>migrateCareer({...transition(s,{type:'award',event:'harbor',valid:true,id:randomUUID(),timeMs:78000}).state,version:2});
const crew=(place:1|2|3|4,id:string=randomUUID()):Command=>({type:'crew-award',result:certifyCrewFinish({event:CREW_EVENT,attemptId:id,participantId:'player',status:'finished',valid:true,laps:2,timeMs:156000,place})});
const bought=()=>transition(clean(),{type:'purchase',id:randomUUID(),productId:PRODUCT.id,vehicleId:PRODUCT.vehicleId}).state;
function v1(s:Career){const old=structuredClone(s)as any;old.version=1;delete old.crew;delete old.buildMatters;delete old.suspension;delete old.ownBuild;return old}
test('v1 fresh, earned, installed and unequipped careers migrate repeatably with exact old fields',()=>{
 const installed=bought();installed.appearance={color:'cyan',brightness:.7,enabled:false};
 for(const fixture of[freshCareer(),clean(),installed,{...installed,equipped:false}]){const old=v1(fixture),source=structuredClone(old),next=migrateCareer(old);assert.equal(next.version,4);assert.deepEqual(v1(next),source);assert.deepEqual(old,source);assert.deepEqual(migrateCareer(next),next);assert.equal(next.crew.cleared,false)}
});
test('unknown and corrupt schemas fail without mutation or silent reset',()=>{
 const fixture=v1(bought());for(const bad of[{...fixture,version:99},{...fixture,credits:-1},{...fixture,owned:false,equipped:true},{...fixture,appearance:{...fixture.appearance,color:'oops'}},{...fixture,receipts:{bad:{}}},null]){const before=structuredClone(bad);assert.throws(()=>migrateCareer(bad),CareerDataError);assert.deepEqual(bad,before)}
});
test('crew fixture300 ->850 ->850 ->1150 and immutable proof boundaries',()=>{
 const saved=clean(bought()),first=crew(3),won=transition(saved,first);assert.equal(saved.credits,300);assert.equal(won.state.credits,850);assert.equal(won.receipt?.chapterBonus,400);assert.equal(won.story,'crewPodium');assert.equal(won.state.crew.bestPlace,3);assert.equal(transition(won.state,first).state.credits,850);assert.equal(transition(won.state,first).changed,false);
 const replay=transition(won.state,crew(1));assert.equal(replay.state.credits,1150);assert.equal(replay.receipt?.chapterBonus,0);assert.equal(replay.state.crew.bestPlace,1);
 assert.throws(()=>transition(saved,structuredClone(first)),/verified/);assert.throws(()=>transition(saved,{type:'crew-award',result:{place:1}}as any),/verified/);
});
test('new clean lap800, kit600, first second-place600 ->800; fourth100 never clears',()=>{
 const s=bought(),fourth=transition(s,crew(4));assert.equal(fourth.state.credits,300);assert.equal(fourth.state.crew.completed,true);assert.equal(fourth.state.crew.cleared,false);assert.equal(fourth.story,'crewFourth');assert.equal(transition(s,crew(2)).state.credits,800);
 for(const place of[1,2,3,4]as const){const result=transition(s,crew(place));assert.equal(result.receipt?.amount,({1:700,2:600,3:550,4:100})[place])}
});
test('invalid, unfinished, relocated, bad lap and bad placement cannot be certified',()=>{
 const good={event:CREW_EVENT,attemptId:randomUUID(),participantId:'player',status:'finished',valid:true,laps:2,timeMs:160000,place:1}as const;
 for(const patch of[{valid:false},{status:'running'},{status:'relocated'},{laps:1},{place:0},{place:5},{timeMs:0},{timeMs:NaN},{event:'harbor'},{participantId:'nico'}])assert.throws(()=>certifyCrewFinish({...good,...patch}as any));assert.throws(()=>transition(freshCareer(),crew(1)),/clean Harbor/);
});
test('crew and solo receipts cannot be rebound and event flags are separate',()=>{
 const id=randomUUID(),s=clean(),r=transition(s,crew(1,id)).state;assert.throws(()=>transition(r,crew(2,id)),/different result/);assert.throws(()=>transition(r,{type:'award',id,event:'harbor',valid:true,timeMs:90000}),/another event/);
 const soloId=Object.keys(s.receipts)[0];assert.throws(()=>transition(s,crew(1,soloId)),/different result/);assert.equal(transition(r,{type:'award',id:randomUUID(),event:'harbor',valid:true,timeMs:90000}).receipt?.amount,100);
});
test('concurrent crew claims share one first-clear and duplicate IDs never pay twice in fallback',async()=>{
 const db=new MemoryCareerStore(clean());const a=crew(1),b=crew(3);await Promise.all([db.execute(a),db.execute(b),db.execute(a),db.execute(b)]);const s=await db.read();assert.equal(s.credits,1650);assert.equal(s.crew.bestPlace,1);assert.equal(Object.values(s.receipts).filter(r=>r.chapterBonus===400).length,1);
 const receipts=structuredClone(s.receipts);await db.execute({type:'crew-invitation'});await db.execute({type:'crew-acknowledge'});assert.equal((await db.execute({type:'crew-invitation'})).changed,false);assert.equal((await db.execute({type:'crew-acknowledge'})).changed,false);assert.deepEqual((await db.read()).receipts,receipts);assert.equal(db.durable,false);
});
