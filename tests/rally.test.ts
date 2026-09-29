import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceWorld,FIXED_DT,ROAD_DRIFT_DYNAMICS,type DriftDynamics,type VehicleTelemetry} from '../src/simulation';
import * as THREE from 'three';
import {SpeedFeel} from '../src/presentation/speed-feel';
import {RALLY_DRIFT,RALLY_CAMERA,RALLY_RULES_ID} from '../src/rally/tuning';
import {RALLY_FILMS} from '../src/rally/cinematics';
import {FILMS,filmDuration,sampleFilm,type Film} from '../src/presentation/cinematics/tracks';
import {RYKER_DEFINITION} from '../src/simulation/vehicle-definition';
import {CrewRace} from '../src/competition/race';
import {RivalController} from '../src/competition/rival';
import {sampleRoad,projectRoad,createCourseEnvironment} from '../src/course/environment';
import {EXPRESS_ROUTE} from '../src/express/route';
import {RALLY_ROUTE,createRallyEnvironment,rallyPoint} from '../src/rally/route';
import {RallyScore,readRallyRecord,saveRallyRecord,RALLY_RECORD_KEY} from '../src/rally/score';
import {rallyHref,rallyRecipe,rememberRallyOrigin,rallyReturnFragment,rememberDestination,rallyWasChosen} from '../src/rally/entry';
import {artUrl,artForSearch} from '../src/game/loading-art';
import {courseMap} from '../src/interface/route-art';
import {freshRecipe,freshRykerRecipe,freshSpyderRecipe,fragmentRecipe,recipeFragment} from '../src/signature/config';
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
  try{world.addVehicle('player',RALLY_ROUTE.start,RYKER_DEFINITION,'ryker-road-v1');world.initialize();world.get('player').enableDrift(true,undefined,false,RALLY_DRIFT);
    const race=new CrewRace(RALLY_ROUTE,['player'],'player',false,{eventId:RALLY_RULES_ID,laps:1,handlingProfileId:'ryker-road-v1',timeTrial:true}),driver=new RivalController(RALLY_ROUTE,'player',11,'slingmods-sport-v5',.83);race.restart('rally-physical-lap');
    let prev=world.telemetry();for(let i=0;i<180*60&&!race.snapshot().playerResult;i++){world.step({player:race.control('player',driver.control(prev.player,prev))},FIXED_DT);const now=world.telemetry();race.tick(prev,now,FIXED_DT);prev=now;}
    const result=race.snapshot().playerResult;assert.equal(result?.valid,true,JSON.stringify(result));assert.ok(result.timeMs!>60000);assert.equal(race.awardProof(),null,'no career proof');assert.equal(world.get('player').drift().boosts,0);
  }finally{world.dispose();}
});

test('rally handbrake produces a sustained catchable dirt slide without an arcade boost',async()=>{
  const world=await RaceWorld.create(createRallyEnvironment(),'ryker-road-v1');
  try{world.addVehicle('player',{x:0,z:-50,y:sampleRoad(RALLY_ROUTE,50).y,yaw:0},RYKER_DEFINITION,'ryker-road-v1');world.initialize();const car=world.get('player');car.enableDrift(true,undefined,false,RALLY_DRIFT);car.setMotion({x:0,y:0,z:-20},{x:0,y:0,z:0});let sliding=0,maxSlip=0;
    for(let i=0;i<240;i++){const t=i/60,tel=car.telemetry(),held=t>.3&&t<1.6;world.step({player:{throttle:.65,brake:0,steer:held?1:Math.max(-1,Math.min(1,-tel.angularVelocity.y*.9)),handbrake:held?1:0,reverse:false}},FIXED_DT);const slip=Math.abs(car.telemetry().wheels[2].slipAngle);if(slip>.14&&slip<1.05)sliding++;maxSlip=Math.max(maxSlip,slip);}
    assert.ok(sliding>35,`drift lasted ${sliding} ticks, peak slip ${maxSlip}`);assert.ok(maxSlip<1.3,'bounded slide');assert.equal(car.drift().boosts,0);car.grantBoost(2);assert.equal(car.drift().boostLeft,0);assert.ok(Math.abs(car.telemetry().speed)>6);
  }finally{world.dispose();}
});

test('rally drift is a little looser than road, stays bounded, recovers, and does not change normal driving',async()=>{
  async function run(dynamics:Readonly<DriftDynamics>,handbrake=true){const world=await RaceWorld.create(createRallyEnvironment(),'ryker-road-v1');
    try{world.addVehicle('player',{x:0,z:-50,y:sampleRoad(RALLY_ROUTE,50).y,yaw:0},RYKER_DEFINITION,'ryker-road-v1');world.initialize();const car=world.get('player');car.enableDrift(true,undefined,false,dynamics);car.setMotion({x:0,y:0,z:-20},{x:0,y:0,z:0});const trace=[];
      for(let i=0;i<240;i++){const t=i/60,n=car.telemetry(),held=t>.3&&t<1.6;world.step({player:{throttle:.65,brake:0,steer:held?1:Math.max(-1,Math.min(1,-n.angularVelocity.y*.9)),handbrake:held&&handbrake?1:0,reverse:false}},FIXED_DT);const next=car.telemetry();trace.push({t,slip:Math.abs(next.wheels[2].slipAngle),speed:next.speed,position:next.position});}
      assert.equal(car.drift().boosts,0);return trace;
    }finally{world.dispose();}}
  const old=await run(ROAD_DRIFT_DYNAMICS),rally=await run(RALLY_DRIFT),mean=(rows:typeof old)=>{const held=rows.filter(r=>r.t>.5&&r.t<1.6);return held.reduce((n,r)=>n+r.slip,0)/held.length};
  // Owner feedback on v2: the slide read as too extreme. Keep it visibly looser than road, never past ~55 degrees,
  // and no more than ~1.5x the road layer's speed loss through the held slide.
  const loss=(rows:typeof old)=>20-rows.find(r=>r.t>=1.6)!.speed,peak=Math.max(...rally.map(r=>r.slip));
  assert.ok(mean(rally)>mean(old)*1.08&&mean(rally)<mean(old)*1.25,`held angle ${mean(rally)} vs road ${mean(old)}`);assert.ok(peak<.96,`peak slip ${peak}`);assert.ok(loss(rally)<loss(old)*1.5,`speed loss ${loss(rally)} vs road ${loss(old)}`);assert.ok(rally.at(-1)!.slip<.08&&rally.at(-1)!.speed>15,'release and countersteer catch the slide');
  assert.deepEqual(await run(RALLY_DRIFT,false),await run(ROAD_DRIFT_DYNAMICS,false),'driving without the handbrake is unchanged');
});

test('rally camera removes most constant dirt vibration while retaining the normal road camera',()=>{
  const telemetry={speed:20,throttle:1,brake:0,position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:-20},angularVelocity:{x:0,y:0,z:0},quaternion:{x:0,y:0,z:0,w:1},wheels:[0,1,2].map(()=>({contact:true,surface:'dirt'}))} as unknown as VehicleTelemetry;
  const sample=(feel:SpeedFeel,t=telemetry)=>{const camera=new THREE.PerspectiveCamera(42,16/9,.1,1000),target=new THREE.Vector3(),errors=[];
    for(let i=0;i<300;i++){camera.position.set(0,2.4,6);camera.fov=42;target.set(0,.85,-2);camera.lookAt(target);feel.apply(camera,target,t,'near',1/60,1440,i===0);const aim=target.clone().sub(camera.position).normalize(),view=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);errors.push(aim.angleTo(view));}return errors;};
  const rms=(values:number[])=>Math.sqrt(values.reduce((n,v)=>n+v*v,0)/values.length),road=sample(new SpeedFeel(false)),rally=sample(new SpeedFeel(false,RALLY_CAMERA));assert.ok(rms(rally)<rms(road)*.2);
  const asphalt={...telemetry,wheels:telemetry.wheels.map(w=>({...w,surface:'asphalt'}))};assert.deepEqual(sample(new SpeedFeel(false,RALLY_CAMERA),asphalt),sample(new SpeedFeel(false),asphalt));
  assert.ok(rms(sample(new SpeedFeel(true,RALLY_CAMERA)))<1e-6,'reduced motion still disables the camera layer');
});

test('rally cinematics use finite stage-specific shots and preserve the shared score timings',()=>{
  for(const film of Object.keys(RALLY_FILMS) as Film[]){assert.equal(filmDuration(film,RALLY_FILMS),filmDuration(film,FILMS));for(let t=0;t<filmDuration(film,RALLY_FILMS);t+=1/60){const shot=sampleFilm(film,t,RALLY_FILMS);assert.ok([...shot.position,...shot.aim,shot.fov].every(Number.isFinite));assert.ok(shot.position[1]>.2&&!shot.done);}assert.equal(sampleFilm(film,filmDuration(film,RALLY_FILMS),RALLY_FILMS).done,true);}
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

test("leaving a rally returns the player's own build and reopens the Redstone card; denied storage falls back safely",()=>{
  const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};
  const slingshot=freshRecipe(),ryker=freshRykerRecipe(),eventFragment=recipeFragment(rallyRecipe(slingshot));
  rememberRallyOrigin(slingshot,storage);assert.deepEqual(fragmentRecipe(rallyReturnFragment(eventFragment,storage)),slingshot,'a supplied Ryker is event-only');
  rememberRallyOrigin(ryker,storage);assert.equal(rallyReturnFragment(eventFragment,storage),eventFragment,'an entered Ryker build comes back as driven');
  assert.equal(rallyWasChosen(storage),false);rememberDestination('rally',storage);assert.equal(rallyWasChosen(storage),true);rememberDestination('ridge',storage);assert.equal(rallyWasChosen(storage),false);
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};
  assert.doesNotThrow(()=>rememberRallyOrigin(slingshot,denied));assert.equal(rallyReturnFragment(eventFragment,denied),eventFragment);assert.equal(rallyWasChosen(denied),false);
});

test('rally art resolves through the same JPEG lookups as the road courses',()=>{
  assert.equal(artForSearch('?scene=rally&visual=ryker&mode=race'),'rally');assert.equal(artUrl('rally'),'/assets/game-feel/loading/rally.jpg');assert.equal(courseMap('rally'),'/assets/game-feel/maps/rally.jpg');
});
