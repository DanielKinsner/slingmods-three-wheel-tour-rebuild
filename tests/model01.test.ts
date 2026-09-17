import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {FrontLinks} from '../src/presentation/front-links';
import {visitorSearch} from '../src/demo/profile';
const bytes=fs.readFileSync('public/assets/model01/slingshot-josh-adapted.glb');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
function scene(){const root=new THREE.Group();const nodes=gltf.nodes.map((n:any)=>{const o=new THREE.Object3D();o.name=n.name;o.userData=n.extras??{};if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale)}return o});gltf.nodes.forEach((n:any,i:number)=>n.children?.forEach((j:number)=>nodes[i].add(nodes[j])));gltf.scenes[gltf.scene??0].nodes.forEach((i:number)=>root.add(nodes[i]));root.updateMatrixWorld(true);return{root,nodes}}
test('actual exported tire pivots and fixed calipers are separated; no studio imported',()=>{
 const {root}=scene();for(const id of ['front_left','front_right','rear']){const tire=root.getObjectByName('Josh_'+id+'_tire')!;assert.ok(tire);assert.equal(tire.parent!.name,id+'_spin');const caliper=root.getObjectByName(id==='rear'?'rear_stationary_caliper':id+'_stationary_caliper')!;assert.ok(caliper);for(let p=caliper.parent;p;p=p.parent)assert.ok(!p.name.endsWith('_spin'),'caliper must not rotate with tire')}
 assert.ok(!gltf.nodes.some((n:any)=>n.camera!==undefined||n.name?.includes('Studio')));
 for(const n of ['steering_control','stock_exhaust','signature_seat_driver','signature_storage_door_left','josh_donor_foundation'])assert.ok(root.getObjectByName(n),n);
});
test('all authored front links follow travel while retaining chassis endpoints',()=>{
 const {root,nodes}=scene();const links=nodes.filter((n:THREE.Object3D)=>n.userData.model01FrontLink);assert.equal(links.length,12);
 const checks=links.map((node:THREE.Object3D)=>{const b=new THREE.Vector3().fromArray(node.userData.model01FrontLink.b),a=new THREE.Vector3().fromArray(node.userData.model01FrontLink.a);return{node,a,b,localA:node.worldToLocal(a.clone()),localB:node.worldToLocal(b.clone())}});
 const rig=new FrontLinks(root);
 for(const travel of [-.16,0,.16]){rig.update([{localCenter:{x:-.8775,y:.32985+travel,z:-1.3335}},{localCenter:{x:.8775,y:.32985-travel,z:-1.3335}}]);root.updateMatrixWorld(true);for(const c of checks){assert.ok(c.node.localToWorld(c.localA.clone()).distanceTo(c.a)<1e-6);const expected=c.b.clone();expected.y+=c.node.userData.model01FrontLink.side==='left'?travel:-travel;assert.ok(c.node.localToWorld(c.localB.clone()).distanceTo(expected)<1e-6)}}
});
test('candidate URL survives public visitor routing without enabling arbitrary assets',()=>{assert.equal(new URLSearchParams(visitorSearch('?visual=josh&asset=private')).get('visual'),'josh');assert.equal(new URLSearchParams(visitorSearch('?visual=unknown&asset=private')).has('visual'),false)});
