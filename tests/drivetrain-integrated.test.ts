import test from 'node:test';
import assert from 'node:assert/strict';
import {runScenario,scenarios,neutral,type DrivingScenario} from '../src/simulation/scenarios.ts';
import {DRIVETRAIN} from '../src/simulation/drivetrain.ts';
import {FIXED_DT} from '../src/simulation/index.ts';
export const rpmCases:DrivingScenario[]=[
 ...['straight','reverse','wet-traction-recovery','moving-reverse-interlock'].map(name=>scenarios.find(s=>s.name===name)!),
 {name:'wet-braking-rpm',seconds:14,pose:{x:-28,z:-8},control:t=>({...neutral,tractionControl:false,throttle:t>2&&t<7?1:0,brake:t>=7?1:0})},
 {name:'rolling-and-shifts-rpm',seconds:22,pose:{x:0,z:100},control:t=>({...neutral,throttle:t>2?1:0})}
];
for(const scenario of rpmCases)test(`integrated RPM: ${scenario.name}, signed wheel phase and bounded engine coupling`,async()=>{
 const {frames}=await runScenario(scenario);let previousSpin=[0,0,0];
 for(const f of frames){
  assert.ok(f.rpm>=DRIVETRAIN.idle&&f.rpm<=DRIVETRAIN.redline);
  for(let i=0;i<3;i++){const w=f.wheels[i];assert.ok(Number.isFinite(w.angularSpeed));assert.ok(Math.abs((w.spin-previousSpin[i])/FIXED_DT-w.angularSpeed)<1e-8);previousSpin[i]=w.spin}
  if(f.shifting)assert.equal(f.wheels[2].driveTorque,0);
 }
 if(scenario.name==='reverse'){assert.ok(frames.some(f=>f.wheels[2].angularSpeed< -5));assert.equal(frames.at(-1)!.gear,-1)}
 if(scenario.name.includes('wet-')){assert.ok(frames.some(f=>f.wheels[2].surface==='wet'));assert.ok(Math.abs(frames.at(-1)!.speed)<0.1);assert.ok(frames.at(-1)!.rpm<1200)}
 if(scenario.name==='rolling-and-shifts-rpm'){assert.ok(new Set(frames.map(f=>f.gear)).size>=3);assert.ok(frames.some(f=>f.shifting))}
});
