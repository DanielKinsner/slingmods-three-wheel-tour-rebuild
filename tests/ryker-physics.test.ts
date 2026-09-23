import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,RaceWorld,FIXED_DT} from '../src/simulation';
import {RYKER_DEFINITION,SLINGSHOT_DEFINITION} from '../src/simulation/vehicle-definition';
import {RykerCVT,rykerTorque} from '../src/simulation/ryker-cvt';
import {freshRykerRecipe,validateRecipe,previewSnapshot} from '../src/signature/config';
const coast={throttle:0,brake:0,steer:0,reverse:false};
test('Ryker CVT has bounded engine power and no gear shifts, with safe reverse interlock',()=>{
 for(let rpm=1050;rpm<=8500;rpm+=25){assert.ok(rykerTorque(rpm)<=79.1);assert.ok(rykerTorque(rpm)*rpm*Math.PI/30<=61100.01)}
 const cvt=new RykerCVT();for(let i=0;i<900;i++){cvt.step(i/20,0,.285,1,0,false,FIXED_DT);assert.equal(cvt.gear,1);assert.equal(cvt.shiftRemaining,0);assert.ok(cvt.ratio>=.62&&cvt.ratio<=3)}
 const interlock=cvt.step(15,0,.285,1,0,true,FIXED_DT);assert.equal(interlock.throttle,0);assert.ok(interlock.brake>=.6);assert.ok(cvt.reversePending);
 cvt.step(0,0,.285,1,0,true,FIXED_DT);assert.equal(cvt.gear,-1);
});
test('real Ryker body supports all measured contacts, accelerates, brakes in a turn and reverses',async()=>{
 const s=await Simulation.create(undefined,'ryker-road-v1',RYKER_DEFINITION);
 try {for(let i=0;i<180;i++)s.step(coast);let t=s.telemetry();assert.equal(t.vehicleId,'can-am-ryker-900');assert.equal(t.powertrain,'cvt');assert.ok(t.wheels.every(w=>w.contact));
  for(let i=0;i<3;i++){assert.equal(t.wheels[i].localCenter.x,RYKER_DEFINITION.layout.wheels[i].center[0]);assert.equal(t.wheels[i].localCenter.z,RYKER_DEFINITION.layout.wheels[i].center[2])}
  assert.ok(Math.abs(t.wheels.reduce((n,w)=>n+w.load,0)-380*9.81)<60);
  for(let i=0;i<240;i++)s.step({...coast,throttle:1});const fast=s.telemetry();assert.ok(fast.speed>15,`forward ${fast.speed}`);assert.equal(fast.gear,1);
  for(let i=0;i<75;i++)s.step({...coast,brake:.6,steer:.55});t=s.telemetry();assert.ok(t.steer>0);assert.ok(t.speed<fast.speed-3);assert.ok(t.quaternion.w*t.quaternion.w+t.quaternion.y*t.quaternion.y>.8,'does not tip in ordinary braking turn');
  for(let i=0;i<240;i++)s.step({...coast,throttle:1,reverse:true});t=s.telemetry();assert.equal(t.gear,-1);assert.ok(t.speed<-.5&&t.speed>-6.5);assert.ok(t.wheels.every(w=>Number.isFinite(w.load)));
 }finally{s.dispose()}
});
test('mixed world preserves Slingshot definition and explicit Ryker identity',async()=>{const w=await RaceWorld.create(undefined,'slingmods-sport-v5');try{const s=w.addVehicle('s',{x:-4},SLINGSHOT_DEFINITION,'slingmods-sport-v5'),r=w.addVehicle('r',{x:4},RYKER_DEFINITION,'ryker-road-v1');for(let i=0;i<120;i++)w.step({s:coast,r:coast});assert.equal(s.definition.powertrain,'five-speed');assert.equal(r.telemetry().powertrain,'cvt');assert.equal(s.definition.mass,850);assert.equal(r.definition.mass,380)}finally{w.dispose()}});
test('versioned Ryker snapshots are deeply frozen and reject invisible Slingshot equipment',()=>{const r=freshRykerRecipe();r.ryker={body:true};const snap=previewSnapshot(r,'harbor','race');r.ryker.body=false;assert.equal(snap.recipe.ryker?.body,true);assert.ok(Object.isFrozen(snap.recipe.ryker));assert.throws(()=>validateRecipe({...r,products:{'SM-3223':'silver'}}));assert.throws(()=>validateRecipe({...r,handlingProfile:'slingmods-sport-v5'}))});
