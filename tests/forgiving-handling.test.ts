import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,CURRENT_HANDLING_PROFILE} from '../src/simulation';
import {scenarios} from '../src/simulation/scenarios';
import {MOTION_PAD} from '../scripts/p09c-motion-protocol';
import {streetSetup} from '../src/career/suspension';
test('forgiving stock and street setup match; 60 mph full braking remains decisive',async()=>{
 const stock=await Simulation.create(MOTION_PAD,CURRENT_HANDLING_PROFILE),street=await Simulation.create(MOTION_PAD,CURRENT_HANDLING_PROFILE);street.configureSuspension(streetSetup());let entry=false,distance=0,last=stock.telemetry(),stopped=false;
 for(let i=0;i<1200;i++){if(last.speed>=26.8)entry=true;const c={throttle:entry?0:1,brake:entry?1:0,steer:0,reverse:false};stock.step(c);street.step(c);const t=stock.telemetry();assert.deepEqual(t,street.telemetry());if(entry)distance+=Math.hypot(t.position.x-last.position.x,t.position.z-last.position.z);last=t;if(entry&&Math.abs(t.speed)<.2){stopped=true;break}}
 assert.ok(stopped&&distance<40);stock.dispose();street.dispose();
});
test('forgiving tune retains ramp pitch, suspension travel and severe curb overturn',async()=>{
 for(const name of ['incline-launch','high-speed-curb']){const scenario=scenarios.find(s=>s.name===name)!,sim=await Simulation.create(undefined,CURRENT_HANDLING_PROFILE);sim.reset(scenario.pose);let minUp=1,pitch=0,travel=0;
 for(let i=0;i<scenario.seconds*60;i++){sim.step(scenario.control(i/60,sim.telemetry()));const t=sim.telemetry(),q=t.quaternion;minUp=Math.min(minUp,1-2*(q.x*q.x+q.z*q.z));pitch=Math.max(pitch,Math.abs(2*(q.w*q.x-q.y*q.z)));travel=Math.max(travel,...t.wheels.map(w=>Math.abs(w.travel)));}
 assert.ok(travel>.02);if(name==='incline-launch')assert.ok(pitch>.04);else assert.ok(minUp<0,'severe curb crash is still physical');sim.dispose();}
});
