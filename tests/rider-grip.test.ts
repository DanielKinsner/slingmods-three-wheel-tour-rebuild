import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {DriverPresenter, type DriverAttachment} from '../src/presentation/driver';
import type {VehicleTelemetry} from '../src/simulation';

// Use the shipped joints and control hierarchy; textures are irrelevant to grip orientation.
function hierarchy(file:string){
 const bytes=readFileSync(file),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 const joints=new Set<number>(g.skins?.flatMap((s:any)=>s.joints)??[]);
 const nodes=g.nodes.map((n:any,i:number)=>{
  const o=joints.has(i)?new THREE.Bone():new THREE.Object3D();o.name=n.name??'';o.userData=n.extras??{};
  if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);
  if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);
  return o;
 });
 g.nodes.forEach((n:any,i:number)=>n.children?.forEach((c:number)=>nodes[i].add(nodes[c])));
 const root=new THREE.Group();g.scenes[g.scene??0].nodes.forEach((i:number)=>root.add(nodes[i]));return root;
}

for(const ryker of [false,true])test(`shipped rider fingers wrap the ${ryker?'Ryker handlebar':'tilted Slingshot wheel'} in its moving frame`,()=>{
 const rider=hierarchy('public/assets/drivers/tour-rider/tour-rider.glb');
 const model=hierarchy(ryker?'public/assets/ryker/complete/ryker-900-complete.glb':'public/assets/model02/slingshot-2026.glb');
 const config:DriverAttachment=JSON.parse(readFileSync(ryker?'public/assets/ryker/driver-attachment.json':'public/assets/model02/driver-attachment.json','utf8'));
 const vehicle=new THREE.Group();vehicle.rotation.set(.12,.7,-.08);vehicle.add(model,rider);
 if(config.rootOffset)rider.position.fromArray(config.rootOffset);vehicle.updateMatrixWorld(true);
 const wheel=model.getObjectByName('steering_control')!,base=wheel.quaternion.clone();
 const localAxes=Object.fromEntries(Object.entries(config.arms).map(([side,a])=>{
  const rest=vehicle.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rider.getObjectByName(a.handBone)!.getWorldQuaternion(new THREE.Quaternion()));
  return [side,new THREE.Vector3(0,1,0).applyQuaternion(rest.invert())];
 }));
 const driver=new DriverPresenter(rider,vehicle,wheel,config);
 for(const steer of [0,.05,-.05]){
  wheel.quaternion.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(ryker?new THREE.Vector3(0,.968,-.251).normalize():new THREE.Vector3(0,0,1),ryker?steer:steer*10));
  const report=driver.update({speed:12,steer,throttle:.3,brake:0} as VehicleTelemetry,1/60,false,steer===0);
  for(const [side,a] of Object.entries(config.arms)){
   const actual=localAxes[side].clone().applyQuaternion(rider.getObjectByName(a.handBone)!.getWorldQuaternion(new THREE.Quaternion()));
   const expected=(ryker?new THREE.Vector3(side==='left'?1:-1,0,0):new THREE.Vector3(0,1,0)).applyQuaternion(wheel.getWorldQuaternion(new THREE.Quaternion()));
   assert.ok(actual.dot(expected)>.995,`${side} grip axis differs by ${(Math.acos(THREE.MathUtils.clamp(actual.dot(expected),-1,1))*180/Math.PI).toFixed(1)} degrees`);
   assert.ok(report.arms[side].gap<.001,'grip position must stay attached');
   // The authored curl centre is 23 mm ahead of the retained semantic hand pivot.
   // Ryker's measured grip centre is 9 mm behind its control origin; wheel rim is at Z=0.
   const hand=rider.getObjectByName(a.handBone)!,curlOffset=new THREE.Vector3(0,0,-.023);
   const restRoot=hierarchy('public/assets/drivers/tour-rider/tour-rider.glb');restRoot.updateMatrixWorld(true);
   curlOffset.applyQuaternion(restRoot.getObjectByName(a.handBone)!.getWorldQuaternion(new THREE.Quaternion()).invert());
   const curl=hand.localToWorld(curlOffset),control=new THREE.Vector3().fromArray(a.wheelGripLocal);control.z=ryker?.009:0;wheel.localToWorld(control);
   assert.ok(curl.distanceTo(control)<.001,`${side} glove cavity floats ${(curl.distanceTo(control)*1000).toFixed(1)} mm from the control`);
  }
 }
});
