import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshCareer,migrateCareer,transition,MemoryCareerStore,CareerDataError,type Career} from '../src/career/store';
import {RIDGE_EVENTS,EVENTS,certifyCareerFinish,eventAvailable,ridgeAvailable,competition,type ChapterEvent,type Attempt} from '../src/career-experience/model';
import {careerRaceHref,routeVersion} from '../src/career-experience/race-adapter';
import {BuildRepository,freshRecipe,DRIVE_KEY,type DestinationId} from '../src/signature/config';
import {PRODUCTS} from '../src/signature/catalog';
import {visitorSearch} from '../src/demo/profile';
import {driveAssetURLs} from '../src/signature/drive-preparation';
import type {CrewRace} from '../src/competition';

const earned=()=>{const s=freshCareer();s.buildMatters.legacyCrewAccess=true;return s};
function begin(s:Career,event:ChapterEvent,retryOf?:string){return transition(s,{type:'chapter-begin',event,id:randomUUID(),cupId:randomUUID(),retryOf,routeVersion:routeVersion(event,s.ownBuild.activeCupId?s.ownBuild.cups[s.ownBuild.activeCupId].stages.length:0)}).state}
function snapshot(a:Attempt,place=a.participants.length){const ids=a.participants.filter(id=>id!=='player');ids.splice(place-1,0,'player');const standings=ids.map((id,i)=>({id,place:i+1,status:'finished',lap:a.laps,nextGate:24,progress:3200*a.laps,timeMs:190000+i*1000,invalidReason:null,valid:true}));return {event:a.competitionId,handlingProfileId:a.handlingProfile,laps:a.laps,phase:'finished',paused:false,countdown:0,elapsedMs:195000,attemptId:a.id,standings,playerResult:{event:a.competitionId,attemptId:a.id,participantId:'player',status:'finished',valid:true,laps:a.laps,timeMs:190000+(place-1)*1000,place,invalidReason:null},allFinished:true} as ReturnType<CrewRace['snapshot']>}
function finish(s:Career,place?:number){const a=s.ownBuild.active!;return transition(s,{type:'chapter-result',result:certifyCareerFinish(a,snapshot(a,place))})}
function coastline(){let s=earned();for(const event of ['open-it-up','hold-your-nerve','coastline-cup','coastline-cup'] as ChapterEvent[])s=finish(begin(s,event)).state;return s}
const storage=()=>{const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}}};

test('P10A Ridge unlock needs completed Cup records; old boolean and partial Cup do not grant access',()=>{
 const spoof=earned();spoof.ownBuild.completed['coastline-cup']=true;assert.equal(ridgeAvailable(spoof),false);assert.throws(()=>begin(spoof,'find-the-ridge'),/locked/);
 let partial=earned();for(const e of ['open-it-up','hold-your-nerve','coastline-cup'] as ChapterEvent[])partial=finish(begin(partial,e)).state;
 assert.equal(ridgeAvailable(migrateCareer(partial)),false);assert.equal(ridgeAvailable(coastline()),true);
 const missing=coastline();delete missing.receipts[missing.ownBuild.records.at(-1)!.attemptId];assert.equal(ridgeAvailable(missing),false);assert.throws(()=>migrateCareer(missing),CareerDataError);
});
test('P10A additive migration keeps all old recipes, attempts, Cup stages, credits and receipts byte-equivalent',()=>{
 const old:any=coastline();delete old.ownBuild.ridge;const bytes=JSON.stringify(old),loaded=migrateCareer(JSON.parse(bytes)),stripped:any=structuredClone(loaded);delete stripped.ownBuild.ridge;
 assert.equal(JSON.stringify(stripped),bytes);assert.equal(JSON.stringify(old),bytes);assert.equal(eventAvailable(loaded,'find-the-ridge'),true);assert.deepEqual(Object.values(loaded.ownBuild.ridge.completed),[false,false,false]);assert.deepEqual(Object.keys(EVENTS),['open-it-up','hold-your-nerve','coastline-cup']);
});
test('P10A all three roles bind route, lighting, actual rivals and laps; valid last place advances without purchases',()=>{
 let s=coastline();const old=structuredClone(s),expected=[400,600,900];assert.equal(eventAvailable(s,'nico-ridge-duel'),false);
 for(const [i,event] of (Object.keys(RIDGE_EVENTS) as (keyof typeof RIDGE_EVENTS)[]).entries()){
  s=begin(s,event);const a=s.ownBuild.active!;assert.equal(a.route,'ridge');assert.equal(a.routeVersion,'ridge-layout-v1');assert.equal(a.laps,i===2?2:1);assert.deepEqual(a.participants,i===0?['player']:i===1?['nico','player']:['maya','jett','nico','player']);assert.match(careerRaceHref(a),/^\?scene=ridge&play=career&attempt=/);assert.equal(RIDGE_EVENTS[event].preset,i===2?'night':'day');const result=finish(s);assert.equal(result.receipt?.amount,expected[i]);assert.equal(result.receipt?.chapterBonus,0);s=migrateCareer(JSON.parse(JSON.stringify(result.state)));assert.equal(s.ownBuild.ridge.completed[event],true);
 }
 assert.equal(s.credits,old.credits+1900);assert.deepEqual(s.ownBuild.products,old.ownBuild.products);assert.deepEqual(s.ownBuild.completed,old.ownBuild.completed);for(const [id,r]of Object.entries(old.receipts))assert.deepEqual(s.receipts[id],r);
});
test('P10A rewards commit once across reload; repeated valid finishes have unchanged transparent awards, wins are achievements',async()=>{
 let s=coastline();for(const event of Object.keys(RIDGE_EVENTS) as (keyof typeof RIDGE_EVENTS)[]){s=begin(s,event);const proof=certifyCareerFinish(s.ownBuild.active!,snapshot(s.ownBuild.active!,1)),first=transition(s,{type:'chapter-result',result:proof});const store=new MemoryCareerStore(JSON.parse(JSON.stringify(first.state)));const repeat=await store.execute({type:'chapter-result',result:proof});assert.equal(repeat.changed,false);assert.equal(repeat.state.credits,first.state.credits);assert.equal(repeat.state.ownBuild.ridge.won[event],true);s=finish(begin(repeat.state,event),1).state;assert.equal(Object.values(s.receipts).at(-1)?.amount,RIDGE_EVENTS[event].repeat);assert.equal(Object.values(s.receipts).at(-1)?.chapterBonus,0)}
});
test('P10A retries preserve the committed build and abandon/invalid/unfinished/wrong-lap results cannot pay',()=>{
 let s=begin(coastline(),'find-the-ridge');const a=s.ownBuild.active!,before=s.credits,proof=certifyCareerFinish(a,snapshot(a));s=transition(s,{type:'chapter-finish',finish:'white-graphite'}).state;s=begin(s,'find-the-ridge',a.id);assert.deepEqual(s.ownBuild.active!.recipe,a.recipe);assert.throws(()=>transition(s,{type:'chapter-result',result:proof}),/abandoned/);assert.equal(s.credits,before);
 const next=s.ownBuild.active!,snap=snapshot(next);for(const patch of [{allFinished:false},{laps:2 as const},{playerResult:{...snap.playerResult!,valid:false}},{playerResult:{...snap.playerResult!,laps:2 as const}}])assert.throws(()=>certifyCareerFinish(next,{...snap,...patch}),/matching/);
 const abandoned=transition(s,{type:'chapter-abandon'}).state;assert.equal(abandoned.credits,before);assert.equal(abandoned.ownBuild.ridge.completed['find-the-ridge'],false);
});
test('P10A corrupt chapter medals are rejected without overwriting raw saves',()=>{
 const s=coastline();for(const patch of [null,{completed:{'find-the-ridge':true,'nico-ridge-duel':false,'summit-invitational':false},won:{'find-the-ridge':false,'nico-ridge-duel':false,'summit-invitational':false}},{completed:{},won:{}}]){const bad={...s,ownBuild:{...s.ownBuild,ridge:patch}},bytes=JSON.stringify(bad);assert.throws(()=>migrateCareer(bad),CareerDataError);assert.equal(JSON.stringify(bad),bytes)}
});
test('P10A every destination is free and snapshots retain all five parts, finish, setup and historical profile',()=>{
 const d=storage(),session=storage(),repo=new BuildRepository(d,session),recipe=freshRecipe();recipe.finish='white-graphite';recipe.handlingProfile='slingmods-sport-v2';recipe.suspension.frontCompression=14;for(const p of PRODUCTS)recipe.products[p.id]=p.option;const career=JSON.stringify(freshCareer());d.data.set('career-sentinel',career);repo.setDraft(recipe);
 for(const route of ['harbor','express','ridge'] as DestinationId[])for(const mode of ['test','race'] as const){repo.beginDrive(recipe,route,mode,'night');const trip=repo.drive();assert.deepEqual(trip.recipe,recipe);assert.deepEqual(repo.draft(),recipe);assert.equal(trip.route,route);assert.equal(trip.lighting,route==='ridge'?'night':undefined);assert.equal(d.data.get('career-sentinel'),career)}
 const bad=JSON.parse(session.data.get(DRIVE_KEY)!);bad.lighting='storm';session.data.set(DRIVE_KEY,JSON.stringify(bad));const bytes=session.data.get(DRIVE_KEY);assert.throws(()=>repo.drive());assert.equal(session.data.get(DRIVE_KEY),bytes);
});
test('P10A staged query retains Ridge career identities and lighting, rejects unknown inputs',()=>{
 const id=randomUUID();assert.equal(new URLSearchParams(visitorSearch(`?scene=ridge&play=career&attempt=${id}&lighting=night`)).get('attempt'),id);assert.equal(new URLSearchParams(visitorSearch('?scene=ridge&route=ridge&mode=race&play=preview&lighting=night')).get('lighting'),'night');assert.equal(new URLSearchParams(visitorSearch('?scene=ridge&lighting=storm')).has('lighting'),false);
});
test('P10A mountain resources are requested only for mountain preparation',()=>{
 for(const route of ['express','harbor'] as const)assert.equal(driveAssetURLs(route,freshRecipe()).some(u=>u.includes('/ridge/')),false);const urls=driveAssetURLs('ridge',freshRecipe());assert.ok(urls.includes('/assets/ridge/ridge-kit.glb'));assert.equal(new Set(urls).size,urls.length);
});
