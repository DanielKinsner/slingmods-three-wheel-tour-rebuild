import test from 'node:test';import assert from 'node:assert/strict';
import {freshCareer,transition,migrateCareer} from '../src/career/store';
import {careerRecipe,RYKER_CREDITS} from '../src/career-experience/model';
import {certifyCareerFinish,competition,chapterRouteVersion,type ChapterEvent,type Attempt} from '../src/career-experience/model';
import type {CrewRace} from '../src/competition';

// Transaction boundary fixtures, separate from the actual input-driven browser lap.
function finishSnapshot(a:Attempt){const standings=a.participants.map((id,i)=>({id,place:i+1,status:'finished',lap:a.laps,nextGate:24,progress:3200*a.laps,timeMs:90000+i*1000,valid:true,invalidReason:null}));const player=standings.find(s=>s.id==='player')!;return {event:a.competitionId,attemptId:a.id,phase:'finished',paused:false,countdown:0,elapsedMs:95000,handlingProfileId:a.handlingProfile,laps:a.laps,allFinished:true,standings,playerResult:{...player,event:a.competitionId,attemptId:a.id,participantId:'player',laps:a.laps}} as ReturnType<CrewRace['snapshot']>}
test('career vehicle switch preserves Slingshot equipment; Ryker purchases are separate and idempotent',()=>{
 let s=freshCareer();s.credits=4000;s.owned=true;s.equipped=true;s.suspension.owned=true;s.suspension.equipped=true;const old=careerRecipe(s);
 s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;assert.equal(careerRecipe(s).vehicleId,'can-am-ryker-900');assert.deepEqual(careerRecipe(s).products,{});assert.deepEqual(careerRecipe(s).ryker,{});
 assert.throws(()=>transition(s,{type:'chapter-ryker-equip',part:'body',equipped:true}));
 const id=crypto.randomUUID();s=transition(s,{type:'chapter-ryker-purchase',part:'shocks',id}).state;assert.equal(s.credits,4000-RYKER_CREDITS.shocks);assert.equal(transition(s,{type:'chapter-ryker-purchase',part:'shocks',id}).changed,false);assert.equal(careerRecipe(s).ryker?.shocks,true);
 s=transition(s,{type:'chapter-ryker-style',finish:'white-graphite'}).state;s=migrateCareer(JSON.parse(JSON.stringify(s)));s=transition(s,{type:'chapter-vehicle',vehicle:'slingshot-r-2024'}).state;assert.deepEqual(careerRecipe(s),old);
 s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;assert.equal(careerRecipe(s).finish,'white-graphite');assert.equal(careerRecipe(s).ryker?.shocks,true);assert.equal(s.suspension.equipped,true);
});
test('Ryker ownership cannot be forged by a free-preview build in a career save',()=>{const s=transition(freshCareer(),{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;s.ownBuild.ryker!.recipe.ryker={body:true};assert.throws(()=>migrateCareer(s))});

test('Ryker frozen Cup, retry and every Ridge event survive vehicle switching and reload with unchanged rewards',()=>{
 let s=freshCareer();s.buildMatters.legacyCrewAccess=true;s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;
 s=transition(s,{type:'chapter-ryker-style',finish:'white-graphite'}).state;const frozen=careerRecipe(s);
 for(const event of ['open-it-up','hold-your-nerve','coastline-cup','coastline-cup','find-the-ridge','nico-ridge-duel','summit-invitational'] as ChapterEvent[]){
  const stage=(s.ownBuild.activeCupId?s.ownBuild.cups[s.ownBuild.activeCupId].stages.length:0) as 0|1;
  s=transition(s,{type:'chapter-begin',id:crypto.randomUUID(),cupId:crypto.randomUUID(),event,routeVersion:chapterRouteVersion(competition(event,stage).route)}).state;
  const old=structuredClone(s.ownBuild.active!);assert.equal(old.recipe.vehicleId,'can-am-ryker-900');assert.equal(old.handlingProfile,'ryker-road-v1');assert.deepEqual(old.recipe.products,{});
  s=transition(s,{type:'chapter-vehicle',vehicle:'slingshot-r-2024'}).state;s=migrateCareer(JSON.parse(JSON.stringify(s)));
  s=transition(s,{type:'chapter-begin',id:crypto.randomUUID(),retryOf:old.id,event,routeVersion:old.routeVersion}).state;assert.deepEqual(s.ownBuild.active!.recipe,old.recipe);
  const a=s.ownBuild.active!,proof=certifyCareerFinish(a,finishSnapshot(a));const paid=transition(s,{type:'chapter-result',result:proof});s=migrateCareer(JSON.parse(JSON.stringify(paid.state)));
  assert.equal(transition(s,{type:'chapter-result',result:proof}).changed,false);assert.deepEqual(s.ownBuild.records.at(-1)!.recipe,frozen);
  s=transition(s,{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;
 }
 assert.equal(s.credits,4300);assert.equal(s.ownBuild.records.length,7);assert.ok(Object.values(s.ownBuild.ridge.completed).every(Boolean));
});

test('Chapter 01 entry keeps its build and preset through style changes, switching and retry',()=>{
 let s=transition(freshCareer(),{type:'chapter-vehicle',vehicle:'can-am-ryker-900'}).state;
 const id=crypto.randomUUID();s=transition(s,{type:'chapter-one-begin',id,event:'shakedown',preset:'night'}).state;const original=structuredClone(s.ownBuild.chapterOne!.entries[id]);
 s=transition(s,{type:'chapter-ryker-style',finish:'white-graphite'}).state;s=transition(s,{type:'chapter-vehicle',vehicle:'slingshot-r-2024'}).state;s=migrateCareer(JSON.parse(JSON.stringify(s)));
 const retry=crypto.randomUUID();s=transition(s,{type:'chapter-one-begin',id:retry,event:'shakedown',preset:'day',retryOf:id}).state;
 assert.deepEqual(s.ownBuild.chapterOne!.entries[retry].recipe,original.recipe);assert.equal(s.ownBuild.chapterOne!.entries[retry].preset,'night');assert.equal(s.ownBuild.chapterOne!.entries[id].status,'abandoned');
});
