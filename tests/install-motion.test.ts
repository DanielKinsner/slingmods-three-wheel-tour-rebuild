import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {InstallMotion,arrivals,drawnSet,FLY_MS} from '../src/presentation/install-motion';
const box=(name:string,x=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshStandardMaterial());m.name=name;m.position.x=x;return m};
function car(){
 const root=new THREE.Group(),body=box('body'),rider=new THREE.Group(),exhaust=new THREE.Group(),kit=new THREE.Group();
 rider.add(box('rider_mesh'));exhaust.name='exhaust';exhaust.add(box('pipe_l',-.3),box('pipe_r',.3));exhaust.position.set(0,.2,-1);exhaust.visible=false;kit.name='kit';kit.add(box('panel',.8));
 root.add(body,rider,exhaust);return {root,rider,exhaust,kit};
}
test('arrivals are the topmost newly drawn nodes: shown or attached parts, never the rider or what was already drawn',()=>{
 const {root,rider,exhaust,kit}=car(),before=drawnSet(root);
 exhaust.visible=true;root.add(kit);rider.add(box('rider_glove'));
 assert.deepEqual(arrivals(root,before,rider).map(n=>n.name).sort(),['exhaust','kit']);
 assert.deepEqual(arrivals(root,drawnSet(root),rider),[]);
});
test('a part flies from outside the car and is put back exactly; its landing fires once, also when interrupted',()=>{
 const {root,exhaust,rider}=car(),motion=new InstallMotion(new THREE.Scene()),camera=new THREE.PerspectiveCamera();camera.position.set(3,1.5,3);
 const before=drawnSet(root);exhaust.visible=true;const home=exhaust.position.clone();let landed=0;
 assert.equal(motion.play(root,before,{now:1000,camera,lights:false,exclude:rider,onLand:()=>landed++}),true);
 assert.ok(exhaust.position.distanceTo(home)>.2,'starts away from its mount');
 motion.update(1000+FLY_MS*.5);assert.ok(exhaust.position.distanceTo(home)>0&&motion.busy);assert.equal(landed,0);
 motion.finish(1000+FLY_MS*.6);assert.deepEqual(exhaust.position.toArray(),home.toArray());assert.equal(landed,1);assert.equal(motion.busy,false);
 motion.finish();assert.equal(landed,1,'no second landing');
 assert.equal(motion.play(root,drawnSet(root),{now:2000,camera,lights:false}),false,'nothing new: caller plays its sound at once');
});
test('lights do not fly: they ignite with a flicker and settle back to normal brightness',()=>{
 const {root,kit}=car(),motion=new InstallMotion(new THREE.Scene()),before=drawnSet(root);root.add(kit);let landed=0;
 assert.equal(motion.play(root,before,{now:0,camera:new THREE.PerspectiveCamera(),lights:true,onLand:()=>landed++}),true);
 assert.equal(landed,1);assert.equal(kit.position.x,0);
 const gains=[20,70,130,200,400,900].map(t=>motion.update(t));
 assert.ok(gains[0]<.5&&gains[1]>2&&gains[2]<.5&&gains[3]>1.5,`flicker then glow: ${gains}`);assert.equal(gains[5],1);
});
