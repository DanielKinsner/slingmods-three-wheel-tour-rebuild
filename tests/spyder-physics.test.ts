import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation,RaceWorld,FIXED_DT} from '../src/simulation';
import {SPYDER_DEFINITION,RYKER_DEFINITION,SLINGSHOT_DEFINITION,vehicleDefinition} from '../src/simulation/vehicle-definition';
import {SpyderSE6,spyderTorque} from '../src/simulation/spyder-se6';
import {freshSpyderBuild,spyderThrottle} from '../src/signature/spyder-catalog';
const coast={throttle:0,brake:0,steer:0,reverse:false};
test('SE6 visits all six forward ratios and safely interlocks reverse; power is bounded',()=>{
 for(let rpm=1000;rpm<=8100;rpm+=25){assert.ok(spyderTorque(rpm)<=130.1);assert.ok(spyderTorque(rpm)*rpm*Math.PI/30<=85800.001)}
 const d=new SpyderSE6(),gears=new Set();for(let i=0;i<3600;i++){const x=d.step(i/50,0,.32355,1,0,false,FIXED_DT);gears.add(d.gear);assert.ok(Number.isFinite(x.force));assert.ok(d.rpm>=1000&&d.rpm<=8100)}
 assert.deepEqual([...gears],[1,2,3,4,5,6]);const pending=d.step(30,0,.32355,1,0,true,FIXED_DT);assert.equal(pending.throttle,0);assert.ok(pending.brake>=.65);assert.ok(d.gear>0);d.step(0,0,.32355,1,0,true,FIXED_DT);assert.equal(d.gear,-1);
});
test('Pedal Commander preserves endpoints; light products have no force effect',async()=>{
 const b=freshSpyderBuild();b.parts.throttle=true;for(const mode of ['Eco','City','Sport','Sport+'] as const){b.mode=mode;assert.equal(spyderThrottle(0,b),0);assert.equal(spyderThrottle(1,b),1)}b.mode='Eco';assert.ok(spyderThrottle(.5,b)<.5);b.mode='Sport+';assert.ok(spyderThrottle(.5,b)>.5);
 const a=await Simulation.create(undefined,'spyder-f3-v1',SPYDER_DEFINITION),c=await Simulation.create(undefined,'spyder-f3-v1',SPYDER_DEFINITION);try{const lights=freshSpyderBuild();lights.parts={underglow:true,wheels:true};c.configureSpyder(lights);for(let i=0;i<420;i++){const input={...coast,throttle:i>120?1:0,steer:i>300?.3:0};a.step(input);c.step(input)}assert.deepEqual(c.telemetry(),a.telemetry())}finally{a.dispose();c.dispose()}
});
test('Spyder settles at loaded mass, drives, trail brakes, stops and reverses',async()=>{
 const s=await Simulation.create(undefined,'spyder-f3-v1',SPYDER_DEFINITION);try{for(let i=0;i<180;i++)s.step(coast);let t=s.telemetry();assert.equal(t.powertrain,'six-speed');assert.ok(t.wheels.every(w=>w.contact));assert.ok(Math.abs(t.wheels.reduce((n,w)=>n+w.load,0)-508*9.81)<70);for(let i=0;i<300;i++)s.step({...coast,throttle:1});const fast=s.telemetry();assert.ok(fast.speed>18);for(let i=0;i<90;i++)s.step({...coast,brake:.65,steer:.5});t=s.telemetry();assert.ok(t.speed<fast.speed);assert.ok(t.quaternion.w**2+t.quaternion.y**2>.8);for(let i=0;i<180;i++)s.step({...coast,brake:1});assert.ok(Math.abs(s.telemetry().speed)<.3);for(let i=0;i<240;i++)s.step({...coast,throttle:1,reverse:true});t=s.telemetry();assert.equal(t.gear,-1);assert.ok(t.speed<-.5&&t.speed>-5.5);assert.ok(t.wheels.every(w=>Number.isFinite(w.load)));}finally{s.dispose()}
});
test('mixed world has three independent definitions and configuration; unknown ID fails closed',async()=>{
 assert.throws(()=>vehicleDefinition('unknown' as any));const w=await RaceWorld.create(undefined,'slingmods-sport-v5');try{const a=w.addVehicle('s',{x:-5},SLINGSHOT_DEFINITION,'slingmods-sport-v5'),b=w.addVehicle('r',{x:0},RYKER_DEFINITION,'ryker-road-v1'),c=w.addVehicle('p',{x:5},SPYDER_DEFINITION,'spyder-f3-v1');const config=freshSpyderBuild();config.parts.front=true;config.front.preload=.5;c.configureSpyder(config);assert.throws(()=>b.configureSpyder(config));assert.throws(()=>c.configureRykerSuspension(true));for(let i=0;i<180;i++)w.step({s:coast,r:coast,p:coast});assert.deepEqual([a.definition.mass,b.definition.mass,c.definition.mass],[850,380,508]);assert.deepEqual([a.definition.powertrain,b.definition.powertrain,c.definition.powertrain],['five-speed','cvt','six-speed']);}finally{w.dispose()}
});
