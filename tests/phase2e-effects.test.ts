import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {VehicleEffectState,tireActivity,skidActivity} from '../src/presentation/vehicle-effect-state';
import {VehicleEffects,SkidBuffer} from '../src/presentation/vehicle-effects';
import type {VehicleTelemetry} from '../src/simulation';
import {GRAPHICS_PRESETS} from '../src/presentation/graphics-settings';
import {RaceWorld,CURRENT_HANDLING_PROFILE} from '../src/simulation';
import {effectContacts} from '../src/presentation/effect-contacts';
function telemetry():VehicleTelemetry{return {time:0,position:{x:0,y:.025,z:0},quaternion:{x:0,y:0,z:0,w:1},velocity:{x:0,y:0,z:-25},angularVelocity:{x:0,y:0,z:0},speed:25,rpm:5000,engineWheelAngularSpeed:70,gear:2,shifting:false,shiftRemaining:0,steer:.2,throttle:.8,brake:0,reversePending:false,wheels:['front_left','front_right','rear'].map((id,i)=>({id,contact:true,load:2000,travel:0,slipRatio:.05,slipAngle:.03,spin:0,steer:0,localCenter:{x:i===0?-.8775:i===1?.8775:0,y:i===2?.3455:.32985,z:i===2?1.3335:-1.3335},surface:'asphalt',angularSpeed:75,longitudinalSpeed:25,longitudinalForce:200,lateralForce:300,gripLimit:2000,driveTorque:100}))}}
test('wheel effects require moving grounded tires; wet spray does not create dry skids',()=>{
 const t=telemetry(),w=t.wheels[0];assert.equal(tireActivity(w,25,false),0);assert.ok(tireActivity(w,25,true)>.8);assert.equal(skidActivity(w,25,true),0);
 w.slipAngle=.4;assert.ok(skidActivity(w,25,false)>.9);w.contact=false;assert.equal(tireActivity(w,25,true),0);w.contact=true;w.load=0;assert.equal(tireActivity(w,25,false),0);
 w.load=2000;w.surface='grass';assert.ok(tireActivity(w,25,false)>0);assert.equal(skidActivity(w,25,false),0);w.angularSpeed=0;assert.equal(tireActivity(w,0,true),0);
});
test('brake heat integrates braking work, cools, and remains frozen on pause',()=>{
 const t=telemetry(),s=new VehicleEffectState();t.brake=1;for(let i=0;i<360;i++)s.update(t,1/60,false,false);assert.ok(s.heat>.7);const h=s.heat;s.update(t,0,false,false);assert.equal(s.heat,h);t.brake=0;for(let i=0;i<180;i++)s.update(t,1/60,false,false);assert.ok(s.heat<h);s.reset(t);assert.equal(s.heat,0);
});
test('flame pops require high-rpm lift, equipped exhaust, normal motion, and cooldown',()=>{
 for(const [exhaust,reduced,expected]of [[true,false,true],[false,false,false],[true,true,false]] as const){const t=telemetry(),s=new VehicleEffectState();s.reset(t);t.throttle=0;s.update(t,1/60,exhaust,reduced);assert.equal(s.flame,expected);t.throttle=.8;s.update(t,1/60,exhaust,reduced);t.throttle=0;s.update(t,1/60,exhaust,reduced);assert.equal(s.flame,false)}
});
test('skid ring is bounded, follows height, and rejects teleport bridges',()=>{
 const b=new SkidBuffer(2),a=new THREE.Vector3(0,2,0);assert.equal(b.add(a,new THREE.Vector3(0,2,20),.2),false);for(let i=0;i<10;i++)assert.equal(b.add(a,new THREE.Vector3(0,2,-1),.2),true);assert.equal(b.count,2);assert.equal(b.mesh.geometry.drawRange.count,12);assert.ok(Math.abs(b.mesh.geometry.getAttribute('position').getY(0)-2.012)<1e-5);b.dispose();
});
test('shared batches emit for rivals at reduced density, preserve telemetry and freeze on pause',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,3,7);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const e=new VehicleEffects(scene,[{id:'player',root:new THREE.Group(),exhaust:true},{id:'maya',root:new THREE.Group(),exhaust:false}]);const t=telemetry(),r=telemetry();
 const advance=(wet=false)=>{t.time+=1/60;r.time=t.time;t.position.z-=.4;r.position.z-=.4;const before=JSON.stringify([t,r]);e.update({player:t,maya:r},camera,900,'high',wet,true,false);assert.equal(JSON.stringify([t,r]),before)};
 for(let i=0;i<90;i++)advance(true);let s=e.inspect();assert.ok(s.particles[3].emitted>40);assert.equal(s.skidSegments,0);const emitted=s.particles[3].emitted;e.update({player:t,maya:r},camera,900,'high',true,true,false);assert.equal(e.inspect().particles[3].emitted,emitted);
 for(const w of t.wheels)w.slipAngle=.4;for(let i=0;i<90;i++)advance();assert.ok(e.inspect().skidSegments>40);assert.ok(e.inspect().particles[0].emitted>0);
 e.update({player:t,maya:r},camera,900,'low',false,true,true);s=e.inspect();assert.equal(s.headlightFog,false);assert.equal(s.heatHaze,0);assert.equal(scene.children.length,1);e.dispose();assert.equal(scene.children.length,0);
});
test('graphics presets budget effects and disabling them leaves the scene and telemetry inert',()=>{
 assert.ok(GRAPHICS_PRESETS.low.vehicleEffects<GRAPHICS_PRESETS.high.vehicleEffects);assert.equal(GRAPHICS_PRESETS.low.exhaustShimmer,false);
 const scene=new THREE.Scene(),t=telemetry(),e=new VehicleEffects(scene,[{id:'player',root:new THREE.Group(),exhaust:true}],()=>true,false);t.brake=1;t.wheels[0].slipAngle=.7;
 for(let i=0;i<20;i++){t.time+=.1;e.update({player:t},new THREE.PerspectiveCamera(),900,'high',true,true,false)}assert.equal(e.group.visible,false);assert.equal(e.inspect().skidSegments,0);assert.ok(e.inspect().particles.every(p=>p.emitted===0));e.dispose();
});
test('sparks read solved barrier contacts without changing the world',async()=>{
 const world=await RaceWorld.create({ground:{center:[0,-.15,0],size:[40,.3,40]},obstacles:[{id:'wall',center:[.96,.65,0],size:[.2,1.3,10]}],ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})},CURRENT_HANDLING_PROFILE);
 try{world.addVehicle('player',{z:0});world.initialize();const read=effectContacts(world),p=new THREE.Vector3();let contact=false;for(let i=0;i<10;i++){world.step({player:{throttle:0,brake:0,steer:0,reverse:false}});const before=JSON.stringify(world.telemetry());contact=read('player',p)||contact;assert.equal(JSON.stringify(world.telemetry()),before)}assert.equal(contact,true);assert.ok(p.y>=0);assert.equal(read('missing',p),false)}finally{world.dispose()}
});
test('a sudden stop at a solved contact still emits an impact spark',()=>{
 const e=new VehicleEffects(new THREE.Scene(),[{id:'player',root:new THREE.Group(),exhaust:false}],(_id,p)=>{p.set(1,.4,0);return true}),t=telemetry(),camera=new THREE.PerspectiveCamera();
 e.update({player:t},camera,900,'high',false,false,false);t.time=1/60;e.update({player:t},camera,900,'high',false,false,false);t.time=2/60;t.speed=0;e.update({player:t},camera,900,'high',false,false,false);assert.equal(e.inspect().particles[4].emitted,1);e.dispose();
});
