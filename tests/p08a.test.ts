import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {freshCareer,migrateCareer,transition,MemoryCareerStore,CareerDataError} from '../src/career/store';
import {SUSPENSION,streetSetup,suspensionParameters,validSetup} from '../src/career/suspension';
import {DUEL_EVENT,certifyDuelFinish} from '../src/career/duel-result';
import {CrewRace,createCrewGrid} from '../src/competition';import {RaceRoad} from '../src/competition/road';
import route from '../public/assets/harbor/route.json';import type {CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry} from '../src/simulation';
const clean=()=>transition(freshCareer(),{type:'award',id:randomUUID(),valid:true,timeMs:85000,event:'harbor'}).state;
const duel=(place:1|2=2,id:string=randomUUID())=>({type:'duel-award' as const,result:certifyDuelFinish({event:DUEL_EVENT,attemptId:id,participantId:'player',status:'finished',valid:true,laps:1,timeMs:82000,place})});
const buy=()=>({type:'suspension-purchase' as const,id:randomUUID(),productId:SUSPENSION.id,vehicleId:SUSPENSION.vehicleId});
test('Build Matters: new lap -> duel fund -> suspension -> remove/install -> reload; first fund and duplicate result pay once',async()=>{
 const store=new MemoryCareerStore(clean()),finish=duel();await Promise.all([store.execute(finish),store.execute(finish)]);let s=await store.read();assert.equal(s.credits,1450);assert.equal(s.buildMatters.duelCompleted,true);assert.equal(s.buildMatters.duelWon,false);
 await store.execute(buy());assert.equal((await store.read()).credits,450);await store.execute(buy());assert.equal((await store.read()).credits,450);
 await store.execute({type:'suspension-setup',setup:{...streetSetup(),frontRebound:12,rideHeightMm:-10}});await store.execute({type:'suspension-equip',equipped:false});
 s=migrateCareer(JSON.parse(JSON.stringify(await store.read())));assert.equal(s.suspension.owned,true);assert.equal(s.suspension.equipped,false);assert.equal(s.suspension.setup.frontRebound,12);assert.equal(s.suspension.setup.rideHeightMm,-10);
 s=transition(s,{type:'suspension-equip',equipped:true}).state;assert.equal(s.credits,450);s=transition(s,duel(1)).state;assert.equal(s.credits,700);assert.equal(s.buildMatters.duelWon,true);assert.equal(Object.values(s.receipts).filter(r=>r.kind==='duel-award'&&r.chapterBonus===500).length,1);
});
test('new reward proof rejects copied/unearned/invalid/rebound attempts and malformed setup without mutation',()=>{
 const s=clean(),d=duel(),earned=transition(s,d).state;assert.throws(()=>transition(freshCareer(),d),/clean Harbor/);assert.throws(()=>transition(s,structuredClone(d)),/verified/);assert.throws(()=>transition(earned,duel(1,d.result.attemptId)),/different result/);
 assert.throws(()=>transition(earned,{type:'award',event:'harbor',valid:true,timeMs:80000,id:d.result.attemptId}),/another event/);
 for(const patch of[{laps:2},{place:3},{valid:false},{timeMs:NaN},{participantId:'maya'}])assert.throws(()=>certifyDuelFinish({...d.result,...patch} as any));
 assert.throws(()=>transition(freshCareer(),buy()),/1000/);assert.throws(()=>transition(earned,{...buy(),vehicleId:'ryker-rally'}),/fit/);
 for(const patch of[{frontCompression:20},{rearRebound:-1},{rideHeightMm:21},{rideHeightMm:NaN},{frontRebound:1.5}])assert.equal(validSetup({...streetSetup(),...patch}),false);
 assert.throws(()=>transition(s,{type:'suspension-setup',setup:streetSetup()}),/Owned/);assert.deepEqual(s,cleanSnapshot(s));
});
function cleanSnapshot(s:unknown){return JSON.parse(JSON.stringify(s))}
test('v1/v2 migration retains original credits, receipts, build and prior crew access; no invented duel completion',()=>{
 for(const version of [1,2]){const old:any=clean();old.version=version;delete old.buildMatters;delete old.suspension;if(version===1)delete old.crew;const original=structuredClone(old),s=migrateCareer(old);assert.deepEqual(old,original);assert.equal(s.credits,800);assert.deepEqual(s.receipts,old.receipts);assert.equal(s.buildMatters.legacyCrewAccess,true);assert.equal(s.buildMatters.duelCompleted,false);assert.equal(s.suspension.owned,false);assert.deepEqual(migrateCareer(s),s)}
 const newer={...freshCareer(),version:5};assert.throws(()=>migrateCareer(newer),CareerDataError);
});
test('duel runs exactly two participants, one ordered lap, pause/retry and real certificate; crew remains four/two',()=>{
 const r=route as CourseRoute,road=new RaceRoad(r),race=new CrewRace(r,['maya','player'],'player',true);assert.equal(Object.keys(createCrewGrid(r,['maya','player'])).length,2);assert.throws(()=>new CrewRace(r,['maya','player','jett'],'player',true));
 const at=(d:number)=>{const p=road.sample(d),yaw=Math.atan2(-p.dx,-p.dz);return {position:{x:p.x,y:0,z:p.z},quaternion:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},speed:60,wheels:[-1,1,0].map(x=>({localCenter:{x,y:.3,z:0}}))} as VehicleTelemetry};
 const field=(d:number)=>({player:at(d),maya:at(d-2)});race.restart(randomUUID());race.setPaused(true);for(let i=0;i<200;i++)race.tick(field(-5),field(-5),1/60);assert.equal(race.snapshot().countdown,3);race.setPaused(false);for(let i=0;i<180;i++)race.tick(field(-5),field(-5),1/60);
 for(let d=-5;d<r.length+4;d++)race.tick(field(d),field(d+1),1/60);
 assert.equal(race.snapshot().playerResult?.valid,true);assert.equal(race.snapshot().playerResult?.laps,1);assert.equal(race.snapshot().playerResult?.event,DUEL_EVENT);assert.equal(race.snapshot().allFinished,true);assert.equal(transition(clean(),{type:'duel-award',result:race.awardProof() as any}).state.buildMatters.duelWon,true);
 race.restart(randomUUID());assert.equal(race.awardProof(),null);assert.equal(race.snapshot().elapsedMs,0);assert.equal(new CrewRace(r).laps,2);
});
test('documented coefficients preserve street baseline and directional setup, never change springs/grip/power',()=>{const p=suspensionParameters(streetSetup());assert.deepEqual(p,{frontCompression:3800,frontRebound:3800,rearCompression:6500,rearRebound:6500,rideHeight:0});assert.equal(suspensionParameters({...streetSetup(),frontCompression:12}).frontCompression,5130);assert.equal(suspensionParameters({...streetSetup(),frontCompression:12}).frontRebound,3800)});

