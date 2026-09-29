import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceWorld,FIXED_DT} from '../src/simulation';
import {RYKER_DEFINITION} from '../src/simulation/vehicle-definition';
import {CrewRace} from '../src/competition/race';
import {RivalController} from '../src/competition/rival';
import {sampleRoad,projectRoad,createCourseEnvironment} from '../src/course/environment';
import {EXPRESS_ROUTE} from '../src/express/route';
import {RALLY_ROUTE,createRallyEnvironment,rallyPoint} from '../src/rally/route';
import {RallyScore,readRallyRecord,saveRallyRecord,RALLY_RECORD_KEY} from '../src/rally/score';
import {rallyHref,rallyRecipe} from '../src/rally/entry';
import {freshRecipe,freshRykerRecipe,freshSpyderRecipe,fragmentRecipe} from '../src/signature/config';
import {visitorSearch} from '../src/demo/profile';

test('rally is Ryker exclusive, preserves the supplied Ryker build and never mutates a road build',()=>{
  for(const source of [freshRecipe(),freshSpyderRecipe()]){const before=structuredClone(source),next=rallyRecipe(source);assert.equal(next.vehicleId,'can-am-ryker-900');assert.deepEqual(source,before);}
  const ryker=freshRykerRecipe();ryker.ryker={shocks:true,exhaust:true};assert.deepEqual(rallyRecipe(ryker),ryker);
  const href=rallyHref(ryker),url=new URL(href,'https://example.test');assert.equal(new URLSearchParams(visitorSearch(url.search)).get('scene'),'rally');assert.deepEqual(fragmentRecipe(url.hash),ryker);
});

test('the dirt stage has a continuous support corridor, ordered gates, broad shoulders and separate grip',()=>{
  assert.ok(RALLY_ROUTE.length>2100&&RALLY_ROUTE.length<2200);assert.equal(RALLY_ROUTE.checkpoints.length,32);
  const env=createRallyEnvironment();assert.equal(env.surfaceAt(0,-100).id,'dirt');assert.ok(env.surfaceAt(0,-100).mu<createCourseEnvironment(EXPRESS_ROUTE).surfaceAt(0,-100).mu);
  for(let s=0;s<RALLY_ROUTE.length;s+=5){const p=sampleRoad(RALLY_ROUTE,s),shoulder=rallyPoint(s,12);assert.equal(env.surfaceAt(p.x,p.z).id,'dirt');assert.ok(projectRoad(RALLY_ROUTE,shoulder.x,shoulder.z).distance>10,'no shoulder intrudes on another road branch');assert.ok(Number.isFinite(RALLY_ROUTE.heightAt!(p.x,p.z)));}
  const first=rallyPoint(0),last=rallyPoint(RALLY_ROUTE.length);assert.deepEqual(first,last);
});

test('a real Ryker completes every checkpoint and the finish using only pedals and steering on rally dirt',async()=>{
  const world=await RaceWorld.create(createRallyEnvironment(),'ryker-road-v1');
  try{world.addVehicle('player',RALLY_ROUTE.start,RYKER_DEFINITION,'ryker-road-v1');world.initialize();world.get('player').enableDrift(true,undefined,false);
    const race=new CrewRace(RALLY_ROUTE,['player'],'player',false,{eventId:'redstone-rally-v1',laps:1,handlingProfileId:'ryker-road-v1',timeTrial:true}),driver=new RivalController(RALLY_ROUTE,'player',11,'slingmods-sport-v5',.83);race.restart('rally-physical-lap');
    let prev=world.telemetry();for(let i=0;i<180*60&&!race.snapshot().playerResult;i++){world.step({player:race.control('player',driver.control(prev.player,prev))},FIXED_DT);const now=world.telemetry();race.tick(prev,now,FIXED_DT);prev=now;}
    const result=race.snapshot().playerResult;assert.equal(result?.valid,true,JSON.stringify(result));assert.ok(result.timeMs!>60000);assert.equal(race.awardProof(),null,'no career proof');assert.equal(world.get('player').drift().boosts,0);
  }finally{world.dispose();}
});

test('rally handbrake produces a sustained catchable dirt slide without an arcade boost',async()=>{
  const world=await RaceWorld.create(createRallyEnvironment(),'ryker-road-v1');
  try{world.addVehicle('player',{x:0,z:-50,y:sampleRoad(RALLY_ROUTE,50).y,yaw:0},RYKER_DEFINITION,'ryker-road-v1');world.initialize();const car=world.get('player');car.enableDrift(true,undefined,false);car.setMotion({x:0,y:0,z:-20},{x:0,y:0,z:0});let sliding=0,maxSlip=0;
    for(let i=0;i<240;i++){const t=i/60,tel=car.telemetry(),held=t>.3&&t<1.6;world.step({player:{throttle:.65,brake:0,steer:held?1:Math.max(-1,Math.min(1,-tel.angularVelocity.y*.9)),handbrake:held?1:0,reverse:false}},FIXED_DT);const slip=Math.abs(car.telemetry().wheels[2].slipAngle);if(slip>.14&&slip<1.05)sliding++;maxSlip=Math.max(maxSlip,slip);}
    assert.ok(sliding>35,`drift lasted ${sliding} ticks, peak slip ${maxSlip}`);assert.ok(maxSlip<1.3,'bounded slide');assert.equal(car.drift().boosts,0);car.grantBoost(2);assert.equal(car.drift().boostLeft,0);assert.ok(Math.abs(car.telemetry().speed)>6);
  }finally{world.dispose();}
});

test('drift score ignores stationary farming, reversing, paused ticks, off-course slides and invalid results',async()=>{
  const world=await RaceWorld.create(createRallyEnvironment(),'ryker-road-v1');try{world.addVehicle('player',RALLY_ROUTE.start,RYKER_DEFINITION,'ryker-road-v1');world.initialize();const race=new CrewRace(RALLY_ROUTE,['player'],'player',false,{eventId:'score-test',laps:1,handlingProfileId:'ryker-road-v1',timeTrial:true});race.restart('score');const state=race.snapshot();state.phase='running';const t=world.get('player').telemetry(),score=new RallyScore();t.position={x:0,y:0,z:-100};t.speed=15;t.velocity={x:0,y:0,z:-15};t.wheels[2]={...t.wheels[2],contact:true,slipAngle:.4};state.standings[0].progress=100;score.tick(t,state,FIXED_DT);assert.ok(score.score>0);const banked=score.score;
    for(let i=0;i<60;i++)score.tick(t,state,FIXED_DT);assert.equal(score.score,banked,'no progress means no farming');state.standings[0].progress=110;state.paused=true;score.tick(t,state,FIXED_DT);assert.equal(score.score,banked);state.paused=false;t.velocity.z=15;score.tick(t,state,FIXED_DT);assert.equal(score.score,banked);t.velocity.z=-15;t.position.x=35;state.standings[0].progress=120;score.tick(t,state,FIXED_DT);assert.equal(score.score,banked);score.reset();assert.equal(score.score,0);assert.equal(score.slideSeconds,0);
  }finally{world.dispose();}
});

test('rally records keep the fastest time and highest drift independently, isolate builds and tolerate denied storage',()=>{
  const data=new Map<string,string>([['career','untouched']]),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  assert.equal(saveRallyRecord('stock',100000,2000,storage),true);saveRallyRecord('stock',110000,4000,storage);saveRallyRecord('tuned',90000,500,storage);const best=readRallyRecord('stock',storage);assert.equal(best?.timeMs,100000);assert.equal(best?.drift,4000);assert.equal(best?.runs,2);assert.equal(data.get('career'),'untouched');assert.equal(saveRallyRecord('stock',NaN,9999,storage),false);
  data.set(RALLY_RECORD_KEY,'null');assert.equal(saveRallyRecord('stock',100000,100,storage),true);assert.equal(saveRallyRecord('stock',100000,100,{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}),false);
});
