import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ShakedownRace,chapterOneRace} from '../src/career-experience/chapter-one-race';
import {RaceAttempt} from '../src/race/attempt';
import {CrewRace} from '../src/competition';
import {sampleRoad,type CourseRoute} from '../src/course/environment';
import {freshCareer,MemoryCareerStore,type Career} from '../src/career/store';
import type {CareerClient} from '../src/career/client';
import {careerRecipe} from '../src/career-experience/model';
import {CURRENT_HANDLING_PROFILE} from '../src/simulation/profile';
import {BuildRepository,DRIVE_KEY,freshRecipe,currentDrivingCopy} from '../src/signature/config';
import type {VehicleTelemetry} from '../src/simulation';
import {browserStorage,SAVE_KEY} from '../src/save';

const route:CourseRoute={id:'test',version:'1',name:'Test',width:11,runoff:3,length:600,centerline:[[0,0],[0,-100],[-100,-100],[-100,100],[0,100]],start:{x:0,z:5,y:.025,yaw:0},ground:{center:[0,-.15,0],size:[500,.3,500]},colliders:[],lamps:[],checkpoints:[]};
route.checkpoints=[0,50,150,250,350,450,550].map((d,i)=>({...sampleRoad(route,d),id:String(i),distance:d,halfWidth:8.5}));
const at=(distance:number,offset=0):VehicleTelemetry=>{const p=sampleRoad(route,distance);return {position:{x:p.x+offset,z:p.z,y:.025},quaternion:{x:0,y:0,z:0,w:1},speed:60,wheels:[-.8,.8,0].map(x=>({localCenter:{x,y:.3,z:0},contact:true}))} as VehicleTelemetry};
const memory=()=>{const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}}};
function client(initial:Career=freshCareer()){
 let state=initial;const store=new MemoryCareerStore(initial);
 return {profile:'career',get state(){return state},async execute(c){const r=await store.execute(c);state=r.state;return r},close(){store.close()}} as CareerClient;
}
test('shared Shakedown preserves standing-lap timing, pause, invalid practice continuation and retry',()=>{
 for(const invalid of [false,true]){
  const shared=new ShakedownRace(route,'day',CURRENT_HANDLING_PROFILE),original=new RaceAttempt(route,'day');
  shared.restart(randomUUID());original.restart();
  const tick=(a:VehicleTelemetry,b:VehicleTelemetry)=>{shared.tick({player:a},{player:b},1/60);original.tick(a,b,1/60);assert.deepEqual(shared.snapshot().standingLap,original.snapshot())};
  shared.setPaused(true);original.setPaused(true);tick(at(-5),at(-5));shared.setPaused(false);original.setPaused(false);
  for(let i=0;i<180;i++)tick(at(-5),at(-5));
  if(invalid)for(let i=0;i<22;i++)tick(at(-5,15),at(-5,15));
  for(let d=-5;d<601;d++)tick(at(d),at(d+1));
  assert.equal(shared.snapshot().playerResult?.valid,!invalid);assert.equal(shared.snapshot().allFinished,true);
  shared.restart(randomUUID());original.restart();tick(at(-5),at(-5));
 }
});
test('Chapter 01 shares all earned equipment and finish; locked races stay locked and preview-only parts never appear',()=>{
 const s=freshCareer();s.ownBuild.finish='white-graphite';s.ownBuild.products['SM-7720']={owned:true,equipped:true};s.ownBuild.products['SM-28919']={owned:true,equipped:false};
 const c=client(s);assert.equal(chapterOneRace(c,new URLSearchParams('scene=crew')),null);
 const solo=chapterOneRace(c,new URLSearchParams('scene=harbor'))!;assert.deepEqual(solo.recipe,careerRecipe(s));assert.equal(solo.recipe.products['SM-28919'],undefined);assert.equal(solo.recipe.handlingProfile,CURRENT_HANDLING_PROFILE);
 s.chapters.firstCompletion=true;s.buildMatters.duelCompleted=true;
 for(const query of ['scene=crew','scene=crew&event=duel'])assert.deepEqual(chapterOneRace(c,new URLSearchParams(query))!.recipe,solo.recipe);
 assert.deepEqual(solo.recipe.products,{'SM-7720':careerRecipe(s).products['SM-7720']});
});
test('Chapter 01 rewards still require its actual race proof and pay once across callbacks; retry rejects the old finish',async()=>{
 for(const solo of [true,false]){
  const s=freshCareer();s.chapters.firstCompletion=!solo;
  const c=client(s),entry=chapterOneRace(c,new URLSearchParams(solo?'scene=harbor':'scene=crew&event=duel'))!;
  const race=solo?new ShakedownRace(route,'day',CURRENT_HANDLING_PROFILE):new CrewRace(route,entry.participants,'player',true,{handlingProfileId:CURRENT_HANDLING_PROFILE});
  race.restart(entry.attempt.id);
  const field=(d:number)=>Object.fromEntries(entry.participants.map(id=>[id,at(id==='player'?d:d-2)]));
  for(let i=0;i<180;i++)race.tick(field(-5),field(-5),1/60);
  await assert.rejects(entry.commit(race));
  for(let d=-5;d<605;d++)race.tick(field(d),field(d+1),1/60);
  assert.equal(race.snapshot().playerResult?.valid,true);
  const first=await entry.commit(race),again=await entry.commit(race);assert.ok(first.receipt);assert.equal(again.changed,false);assert.equal(first.state.credits,again.state.credits);
  await entry.restart();await assert.rejects(entry.commit(race),/match/);
 }
});
test('persisted old preview trips use current physics without modifying source recipe or stored trip bytes',()=>{
 const d=memory(),s=memory(),repo=new BuildRepository(d,s),recipe={...freshRecipe(),handlingProfile:'slingmods-sport-v2' as const};
 const raw=JSON.stringify({version:1,scope:'preview',recipe,route:'harbor',mode:'race',returnTo:'?scene=signature&screen=build'});s.setItem(DRIVE_KEY,raw);
 assert.deepEqual(repo.drive().recipe,currentDrivingCopy(recipe));assert.equal(s.getItem(DRIVE_KEY),raw);assert.equal(recipe.handlingProfile,'slingmods-sport-v2');
});
test('explicit career settings are durable across every road; all free-drive routes keep preview settings separate',()=>{
 const win=Object.getOwnPropertyDescriptor(globalThis,'window'),loc=Object.getOwnPropertyDescriptor(globalThis,'location');const local=memory(),session=memory();
 try{
  Object.defineProperty(globalThis,'window',{configurable:true,value:{localStorage:local,sessionStorage:session}});
  for(const scene of ['harbor','crew','express','ridge']){Object.defineProperty(globalThis,'location',{configurable:true,value:{search:`?scene=${scene}&play=career`}});browserStorage().setItem(SAVE_KEY,scene);assert.equal(local.getItem(SAVE_KEY),scene)}
  for(const scene of ['express','ridge','signature']){Object.defineProperty(globalThis,'location',{configurable:true,value:{search:`?scene=${scene}`}});browserStorage().setItem(SAVE_KEY,scene);assert.equal(session.getItem('slingmods-signature-settings-v1'),scene);assert.equal(local.getItem(SAVE_KEY),'ridge')}
 }finally{for(const [key,value] of [['window',win],['location',loc]] as const){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key)}}
});
