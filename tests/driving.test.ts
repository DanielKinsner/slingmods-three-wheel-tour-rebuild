import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,FixedClock,FIXED_DT,SPEC,type VehicleTelemetry} from '../src/simulation/index.ts';
import {AutoDrive,DRIVETRAIN,engineTorque} from '../src/simulation/drivetrain.ts';
import {scenarios,runScenario,neutral} from '../src/simulation/scenarios.ts';
import layout from '../public/assets/slingshot-contact-layout.json';

const results=new Map<string,Awaited<ReturnType<typeof runScenario>>>();
async function result(name:string){if(!results.has(name))results.set(name,await runScenario(scenarios.find(s=>s.name===name)!));return results.get(name)!}
const last=(frames:VehicleTelemetry[])=>frames.at(-1)!;
const upright=(f:VehicleTelemetry)=>1-2*(f.quaternion.x**2+f.quaternion.z**2);
test('loaded rest: three non-tensile contacts support stated loaded mass without drift',async()=>{
 const {frames}=await result('rest');const a=frames[180],b=last(frames);
 assert.equal(b.wheels.length,3);assert.ok(b.wheels.every(w=>w.contact&&w.load>100));
 assert.ok(Math.abs(b.wheels.reduce((s,w)=>s+w.load,0)-SPEC.mass*9.81)<SPEC.mass*9.81*0.03);
 assert.ok(Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z)<0.01);assert.ok(Math.abs(b.speed)<0.01);
 for(let i=0;i<3;i++){assert.equal(b.wheels[i].localCenter.x,layout.wheels[i].center[0]);assert.equal(b.wheels[i].localCenter.z,layout.wheels[i].center[2]);assert.ok(Math.abs(b.wheels[i].localCenter.y-layout.wheels[i].center[1])<0.003)}
});
test('all scripted maneuvers remain finite; combined tire ellipse, rear-only drive, front-only steering',async()=>{
 for(const s of scenarios){const {frames}=await result(s.name);for(const f of frames){
  assert.equal(f.wheels.length,3);assert.ok(upright(f)>0.7,`${s.name} overturned at ${f.time}`);
  for(const n of [...Object.values(f.position),...Object.values(f.quaternion),f.speed,f.rpm])assert.ok(Number.isFinite(n),`${s.name} non-finite`);
  assert.equal(f.wheels[0].driveTorque,0);assert.equal(f.wheels[1].driveTorque,0);assert.equal(f.wheels[2].steer,0);
  for(const w of f.wheels){assert.ok(w.load>=0);assert.ok(Math.hypot(w.longitudinalForce,w.lateralForce)<=w.gripLimit+1e-7);for(const n of [w.load,w.travel,w.spin,w.slipRatio,w.slipAngle])assert.ok(Number.isFinite(n))}
 }}
});
test('straight acceleration, lift-off coast and braking have coherent measured distances',async()=>{
 const straight=(await result('straight')).frames,coast=(await result('coast')).frames,brake=(await result('brake')).frames;
 assert.ok(last(straight).speed>20);assert.ok(last(straight).position.z< -70);assert.ok(Math.abs(last(straight).position.x)<0.02);
 assert.ok(last(coast).speed<coast[480].speed-1);assert.ok(last(coast).speed>5);
 assert.ok(Math.abs(last(brake).speed)<0.05);const stop=brake.find(f=>f.time>8&&Math.abs(f.speed)<0.1)!;
 const distance=brake[479].position.z-stop.position.z;assert.ok(distance>10&&distance<45,`stop distance ${distance}m from ${brake[479].speed}m/s`);
 assert.ok(brake.every(f=>f.speed>-0.05));
});
test('left/right asphalt circles have correct turn signs, mirrored radii and sustained support',async()=>{
 const left=(await result('left-circle')).frames,right=(await result('right-circle')).frames;
 assert.ok(left[480].position.x< -3);assert.ok(right[480].position.x>3);
 assert.ok(left[480].angularVelocity.y>0.15);assert.ok(right[480].angularVelocity.y< -0.15);
 for(let i=300;i<left.length;i++){assert.ok(Math.abs(left[i].position.x+right[i].position.x)<0.02);assert.ok(Math.abs(left[i].position.z-right[i].position.z)<0.02);assert.ok(left[i].wheels.every(w=>w.contact&&w.surface==='asphalt'));assert.ok(right[i].wheels.every(w=>w.contact&&w.surface==='asphalt'))}
 const steady=left.slice(600);const rates=steady.map(f=>Math.abs(f.angularVelocity.y));assert.ok(Math.max(...rates)-Math.min(...rates)<0.04);assert.ok(Math.max(...steady.map(f=>f.speed))-Math.min(...steady.map(f=>f.speed))<0.15);
 assert.ok(left[480].wheels[0].steer>left[480].wheels[1].steer&&left[480].wheels[1].steer>0);
});
test('slalom follows alternating input in authoritative yaw response',async()=>{
 const {frames,inputs}=await result('slalom');let positive=0,negative=0;
 for(let i=300;i<frames.length;i++)if(Math.abs(inputs[i].steer)>0.4){if(inputs[i].steer>0&&frames[i].angularVelocity.y>0.05)positive++;if(inputs[i].steer<0&&frames[i].angularVelocity.y< -0.05)negative++}
 assert.ok(positive>60&&negative>60);assert.ok(last(frames).speed>10);
});
test('controlled reverse engages near rest and uses signed physical velocity',async()=>{
 const reverse=(await result('reverse')).frames,interlock=(await result('moving-reverse-interlock')).frames;
 assert.equal(last(reverse).gear,-1);assert.ok(last(reverse).speed< -3&&last(reverse).speed> -6.5);assert.ok(last(reverse).position.z>60);
 const first=interlock.findIndex(f=>f.gear<0);assert.ok(first>420);assert.ok(Math.abs(interlock[first-1].speed)<0.5);assert.ok(interlock.slice(420,first).every(f=>f.throttle===0&&f.brake>=0.6));assert.ok(last(interlock).speed< -3);
});
test('surface friction reduces acceleration; optional traction help limits wheel overspeed; lift/brake recovers',async()=>{
 const wet=(await result('wet-assisted')).frames,dry=(await result('dry-assisted')).frames,loss=(await result('wet-traction-recovery')).frames;
 assert.ok(wet[360].speed<dry[360].speed*0.8);assert.ok(wet.some(f=>f.wheels.every(w=>w.surface==='wet')));
 const wetSlip=Math.max(...wet.map(f=>Math.abs(f.wheels[2].slipRatio))),lossSlip=Math.max(...loss.map(f=>Math.abs(f.wheels[2].slipRatio)));
 assert.ok(lossSlip>0.5);assert.ok(wetSlip<0.15);assert.ok(lossSlip>wetSlip*4);assert.ok(Math.abs(last(loss).speed)<0.1&&Math.abs(last(loss).wheels[2].slipRatio)<0.05);
 assert.ok((await result('gravel')).frames.some(f=>f.wheels.some(w=>w.surface==='gravel')));
});
test('one-wheel bump, curb, seam and landing excite suspension and recover without tunneling',async()=>{
 const bump=(await result('one-wheel-bump')).frames,curb=(await result('curb')).frames,seam=(await result('split-seam')).frames,drop=(await result('drop-landing')).frames,barrier=(await result('barrier')).frames;
 assert.ok(bump.some(f=>Math.abs(f.wheels[0].travel-f.wheels[1].travel)>0.06));assert.ok(Math.max(...bump.map(f=>f.position.y))>0.05);assert.ok(last(bump).position.z<10);
 assert.ok(curb.some(f=>f.wheels.filter(w=>w.contact).length<3));assert.ok(Math.max(...curb.map(f=>f.position.y))>0.12);assert.ok(last(curb).position.z<10);
 assert.ok(last(seam).position.z<10);assert.ok(seam.slice(180).every(f=>f.wheels.length===3&&f.wheels.every(w=>w.contact)));assert.ok(Math.max(...seam.map(f=>f.position.y))<0.15);
 assert.ok(drop.slice(0,20).some(f=>f.wheels.every(w=>!w.contact)));assert.ok(last(drop).wheels.every(w=>w.contact));assert.ok(Math.abs(last(drop).position.y)<0.01);
 assert.ok(barrier.some(f=>f.speed>10));assert.ok(barrier.every(f=>f.position.z> -60));assert.ok(Math.abs(last(barrier).speed)<0.1);
});
test('authoritative AutoDrive executes all five ratios, cuts torque during transitions, and has consistent SI torque/power',()=>{
 const drive=new AutoDrive(),gears=new Set<number>();let shifts=0;
 for(let tick=0;tick<3000;tick++){const speed=Math.min(tick/60*1.8,78);const state=drive.step(speed,0,layout.wheels[2].radius,1,0,false,FIXED_DT);gears.add(drive.gear);if(drive.shiftRemaining>0){assert.equal(state.force,0);shifts++}assert.ok(drive.rpm>=DRIVETRAIN.idle&&drive.rpm<=DRIVETRAIN.redline)}
 assert.deepEqual([...gears],[1,2,3,4,5]);assert.ok(shifts>=4*14);
 const torque=engineTorque(6500),powerW=torque*6500*Math.PI/30;assert.ok(torque>150&&torque<190);assert.ok(powerW>100000&&powerW<140000);
});
test('incline launch and high-speed curb produce physical vertical motion then recover; full-speed steering stays bounded',async()=>{
 const ramp=(await result('incline-launch')).frames,curb=(await result('high-speed-curb')).frames,steer=(await result('high-speed-lock')).frames;
 assert.ok(ramp.some(f=>f.position.y>0.4));assert.ok(ramp.some(f=>f.wheels.filter(w=>w.contact).length<3));assert.ok(last(ramp).position.z<25);assert.ok(last(ramp).wheels.every(w=>w.contact));
 assert.ok(curb.some(f=>f.speed>15));assert.ok(curb.some(f=>f.position.y>0.15));assert.ok(last(curb).position.z<14);assert.ok(last(curb).wheels.every(w=>w.contact));
 const dryFast=steer.filter(f=>f.speed>20&&f.wheels.every(w=>w.surface==='asphalt'));assert.ok(dryFast.length>60);assert.ok(dryFast.every(f=>upright(f)>0.98&&f.wheels.every(w=>w.contact)));assert.ok(dryFast.some(f=>f.angularVelocity.y>0.05));
});
test('straight ramp landing at9m/s preserves heading within3degrees and lateral position within0.5m across symmetric lanes',async()=>{
 const ramp=scenarios.find(s=>s.name==='incline-launch')!;
 for(const x of [-40.1,-40,-39.9]){
  const {frames}=await runScenario({...ramp,pose:{x,z:58}});
  assert.ok(frames.some(f=>f.position.y>0.4),'must actually traverse the ramp');
  for(const f of frames){const q=f.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.x*q.x));assert.ok(Math.abs(yaw)<3*Math.PI/180,`lane${x} yaw${yaw} at${f.time}`);assert.ok(Math.abs(f.position.x-x)<0.5,`lane${x} lateral drift at${f.time}`)}
  assert.ok(last(frames).position.z<10&&last(frames).wheels.every(w=>w.contact),'must land and continue past ramp');
 }
});
test('render cap independence: same fixed clock/input trace at30/60/120/144 gives under1% distance/speed error',async()=>{
 const captures=[];
 for(const cap of [30,60,120,144]){const sim=await Simulation.create(),clock=new FixedClock();let ticks=0;for(let frame=0;frame<cap*12;frame++)clock.advance(1/cap,()=>{const t=ticks/60;sim.step({...neutral,throttle:t>2?0.7:0,steer:t>5?Math.sin(t)*0.3:0});ticks++});assert.equal(ticks,720);assert.equal(clock.droppedSeconds,0);captures.push(sim.telemetry());sim.dispose()}
 const base=captures[0];for(const f of captures){assert.ok(Math.hypot(f.position.x-base.position.x,f.position.z-base.position.z)<0.01);assert.ok(Math.abs(f.speed-base.speed)<0.01)}
});
test('reset clears forces/drivetrain/history, fixed-step rejection and pause clock do not advance state',async()=>{
 const sim=await Simulation.create();for(let i=0;i<240;i++)sim.step({...neutral,throttle:1,steer:1});sim.reset();const f=sim.telemetry();assert.equal(f.time,0);assert.equal(f.speed,0);assert.equal(f.gear,1);assert.ok(f.wheels.every(w=>w.spin===0));assert.deepEqual(f.position,{x:0,y:0.03999999999999998,z:35});
 assert.throws(()=>sim.step(neutral,1/30));const clock=new FixedClock();let ticks=0;clock.advance(1/144,()=>ticks++);clock.clear();assert.equal(ticks,0);clock.advance(5,()=>ticks++);assert.equal(ticks,6);assert.ok(clock.droppedSeconds>4.8);sim.dispose();assert.throws(()=>sim.step(neutral));
});
