import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation,steeringLimit,steeringRequest,type HandlingProfileId} from '../src/simulation';
import {PAD_ENVIRONMENT} from '../src/course/environment';
const road={...PAD_ENVIRONMENT,obstacles:[],ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})};
async function corner(profile:HandlingProfileId,mph:number){
 const sim=await Simulation.create(road,profile);sim.reset({x:0,z:0});
 try{
  for(let i=0;i<2400&&sim.telemetry().speed<mph/2.23694;i++)sim.step({throttle:1,brake:0,steer:0,reverse:false,tractionControl:true});
  assert.ok(sim.telemetry().speed>=mph/2.23694);let distance=0,yaw=0,minUp=1;
  for(let i=0;i<150;i++){
   sim.step({throttle:.4,brake:0,steer:1,reverse:false,tractionControl:true});const t=sim.telemetry(),q=t.quaternion;minUp=Math.min(minUp,1-2*(q.x*q.x+q.z*q.z));
   for(const w of t.wheels)assert.ok(Math.hypot(w.longitudinalForce,w.lateralForce)<=w.gripLimit+1e-7,'finite tire friction circle');
   if(i>=90){distance+=t.speed/60;yaw+=t.angularVelocity.y/60}
  }
  assert.ok(minUp>.98,'clean-road turn remains upright');assert.ok(yaw>0,'left input turns left');return distance/yaw;
 }finally{sim.dispose()}
}
test('responsive profile reduces clean-road full-steering radius at 45, 65 and 85 mph without adding grip',async()=>{
 for(const mph of [45,65,85]){const baseline=await corner('slingmods-sport-v4',mph),candidate=await corner('slingmods-sport-v5',mph);assert.ok(candidate<baseline*.82,`${mph} mph radius: ${candidate.toFixed(1)}m versus ${baseline.toFixed(1)}m`)}
});
test('historical v4 steering remains exact, low-speed lock is retained, and braking does not remove v5 steering',()=>{
 for(const speed of [0,5,15,25,35,45]){
  const expected=Math.min(.60/(1+speed*.021),Math.atan(8.2*2.667/Math.max(speed*speed,1))+.025*speed*speed/(speed*speed+100)/(1+speed*speed/500));
  assert.equal(steeringLimit(speed,'slingmods-sport-v4'),expected);
  assert.equal(steeringRequest(1,speed,'slingmods-sport-v5',1),steeringRequest(1,speed,'slingmods-sport-v5',0));
  assert.equal(steeringRequest(-1,speed,'slingmods-sport-v5'),-steeringRequest(1,speed,'slingmods-sport-v5'));
 }
 for(const speed of [0,3,6])assert.equal(steeringLimit(speed,'slingmods-sport-v5'),steeringLimit(speed,'slingmods-sport-v4'));
});
