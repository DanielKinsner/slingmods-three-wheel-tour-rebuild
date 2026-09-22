import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {DrivingContact,contactGround,type GroundProbe} from '../src/presentation/driving-contact';
import {ChaseShadow,CHASE_SHADOW} from '../src/presentation/chase-shadow';
import {RaceWorld,CURRENT_HANDLING_PROFILE,type VehicleTelemetry} from '../src/simulation';
import {visitorSearch} from '../src/demo/profile';
const flat:GroundProbe=(_p,_d,out)=>{out.height=0;out.normal.set(0,1,0);return true};
async function fixture(){const world=await RaceWorld.create({ground:{center:[0,-.15,0],size:[40,.3,40]},obstacles:[],ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})},CURRENT_HANDLING_PROFILE);world.addVehicle('player',{z:0});world.initialize();for(let i=0;i<30;i++)world.step({player:{throttle:0,brake:0,steer:0,reverse:false}});return world}
test('contact reads real static ground and leaves physics untouched',async()=>{
 const world=await fixture();try{
  const field=world.telemetry(),before=JSON.stringify(field),scene=new THREE.Scene(),contact=new DrivingContact(scene,['player'],contactGround(world));contact.update(field);
  assert.equal(contact.inspect().visiblePatches,4);assert.equal(contact.inspect().drawCalls,1);assert.equal(JSON.stringify(world.telemetry()),before);
  const positions=contact.mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)assert.ok(Math.abs(positions.getY(i)-.012)<.001);
  contact.dispose();assert.equal(scene.children.length,0);
 }finally{world.dispose()}
});
test('shared patches follow a sloped receiver plane and preserve telemetry',async()=>{
 const world=await fixture();try{
  const t=world.telemetry().player;const slope:GroundProbe=(p,_d,out)=>{out.height=.1*p.x;out.normal.set(-.1,1,0).normalize();return true};
  const c=new DrivingContact(new THREE.Scene(),['player','rival'],slope),before=JSON.stringify(t);c.update({player:t,rival:t});assert.equal(c.inspect().drawCalls,1);assert.equal(c.inspect().visiblePatches,8);
  const p=c.mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-(.1*p.getX(i)+.012))<1e-6);assert.equal(JSON.stringify(t),before);c.dispose();
 }finally{world.dispose()}
});
test('airborne tires, rollovers, missing receivers and the off switch do not leave floating contact patches',async()=>{
 const world=await fixture();try{
  const t=world.telemetry().player,c=new DrivingContact(new THREE.Scene(),['player'],flat);c.update({player:t});assert.equal(c.inspect().visiblePatches,4);
  t.position.y+=2;for(const w of t.wheels)w.contact=false;c.update({player:t});assert.equal(c.inspect().visiblePatches,0);
  t.position.y=0;for(const w of t.wheels)w.contact=true;t.quaternion={x:0,y:0,z:1,w:0};c.update({player:t});assert.equal(c.inspect().visiblePatches,0);c.dispose();
  t.quaternion={x:0,y:0,z:0,w:1};for(const [probe,enabled]of [[()=>false,true],[flat,false]] as const){const hidden=new DrivingContact(new THREE.Scene(),['player'],probe,enabled);hidden.update({player:t});assert.equal(hidden.mesh.visible,false);hidden.dispose()}
 }finally{world.dispose()}
});
test('player contact follows the interpolated visual pose rather than the previous physics tick',async()=>{
 const world=await fixture();try{const t=world.telemetry().player,presented=structuredClone(t);presented.position.x+=.5;const c=new DrivingContact(new THREE.Scene(),['player'],flat);c.update({player:t});const before=c.mesh.geometry.getAttribute('position').getX(0);c.update({player:t},presented);assert.ok(Math.abs(c.mesh.geometry.getAttribute('position').getX(0)-before-.5)<1e-6);c.dispose()}finally{world.dispose()}
});
test('light-space snapping keeps sub-texel movement stable and tracks large movement',()=>{
 const light=new THREE.DirectionalLight(),direction=new THREE.Vector3(-22,42,-28).normalize(),shadow=new ChaseShadow(light,direction),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
 const position=new THREE.Vector3(),camera=new THREE.Vector3();shadow.update(position,camera,'high');const before=light.target.position.clone(),tiny=CHASE_SHADOW.high.span/CHASE_SHADOW.high.resolution*.1;
 position.addScaledVector(right,tiny);camera.copy(position);shadow.update(position,camera,'high');assert.ok(light.target.position.distanceTo(before)<1e-10);
 position.addScaledVector(right,5);camera.copy(position);shadow.update(position,camera,'high');assert.ok(light.target.position.distanceTo(before)>4.9);assert.ok(light.target.position.distanceTo(position)<.04);
});
test('shadow quality switches dispose the old map once and bound camera focus',()=>{
 const light=new THREE.DirectionalLight(),shadow=new ChaseShadow(light,new THREE.Vector3(0,1,1).normalize());let disposed=0;light.shadow.map=new THREE.WebGLRenderTarget(8,8);light.shadow.map.addEventListener('dispose',()=>disposed++);
 shadow.update(new THREE.Vector3(),new THREE.Vector3(100,0,0),'high');assert.equal(disposed,1);assert.equal(light.shadow.mapSize.x,2048);assert.ok(light.target.position.length()<5.1);
 shadow.update(new THREE.Vector3(),new THREE.Vector3(),'high');assert.equal(disposed,1);shadow.update(new THREE.Vector3(),new THREE.Vector3(),'low');assert.equal(light.shadow.mapSize.x,512);assert.equal(shadow.inspect().maps,1);
});
test('published contact comparison flag is allowlisted and unknown values are dropped',()=>{
 assert.equal(new URLSearchParams(visitorSearch('?contact=off')).get('contact'),'off');assert.equal(new URLSearchParams(visitorSearch('?contact=anything')).has('contact'),false);
});
