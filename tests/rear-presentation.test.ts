import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {RearPresenter,solveRear,type RearRig} from '../src/presentation/rear';
import {SPEC} from '../src/simulation';
const rig=JSON.parse(fs.readFileSync('public/assets/vehicles/slingshot-p04a1-rear-rig.json','utf8')) as RearRig;
const v=(p:number[])=>new THREE.Vector3().fromArray(p);
const ys=Array.from({length:81},(_,i)=>rig.wheelCenter[1]-SPEC.mass*9.81*.5/SPEC.rearSpring-SPEC.travel+i*(SPEC.restLength+SPEC.travel)/80);
function scene(){const world=new THREE.Group(),root=new THREE.Group();world.add(root);root.position.set(42,2,-19);root.rotation.set(.2,1.7,-.11);for(const name of [...Object.values(rig.groups),'rear_arm_pivot','rear_hub','shock_upper','shock_lower','rear_spin']){const o=new THREE.Group();o.name=name;root.add(o)}root.getObjectByName('rear_spin')!.position.fromArray(rig.wheelCenter);return root}
test('rear link retains chassis pivot and matches raycast hub across complete supported travel',()=>{
 for(const y of ys){const s=solveRear(rig,new THREE.Vector3(0,y,rig.wheelCenter[2]));assert.ok(v(rig.armPivot).applyMatrix4(s.arm).distanceTo(v(rig.armPivot))<1e-10);assert.ok(v(rig.armHub).applyMatrix4(s.arm).distanceTo(s.hub)<1e-10);assert.ok(v(rig.shockLower).applyMatrix4(s.spring).distanceTo(s.lower)<1e-10);assert.ok(v(rig.shockUpper).applyMatrix4(s.body).distanceTo(s.upper)<1e-10);assert.ok(v(rig.shockLower).applyMatrix4(s.piston).distanceTo(s.lower)<1e-10);}
});
test('shared rear presenter is invariant to chassis transform and wheel spin; has no accumulated deformation',()=>{
 const root=scene(),p=new RearPresenter(root,rig),wheel=root.getObjectByName('rear_spin')!;
 for(const y of [...ys,...ys.slice().reverse()]){let prior:any;for(const spin of [0,Math.PI/2,Math.PI,Math.PI*1.5]){wheel.position.set(0,y,rig.wheelCenter[2]);wheel.rotation.x=-spin;const r=p.update({localCenter:{x:0,y,z:rig.wheelCenter[2]},spin});assert.ok(r.wheelCenterError<1e-10);assert.ok(r.armEndpointError<1e-10);assert.ok(r.shockEndpointError<1e-10);assert.ok(v(r.hub).distanceTo(wheel.position)<1e-10);if(prior)assert.deepEqual(r.groups,prior.groups,'Suspension must not spin with wheel');prior=r;}}
 wheel.position.fromArray(rig.wheelCenter);p.update({localCenter:{x:0,y:rig.wheelCenter[1],z:rig.wheelCenter[2]},spin:0});assert.ok(Math.abs(p.inspect().armScale-1)<1e-12);
});
test('missing current rear mechanical groups fail explicitly instead of presenting a detached rig',()=>{
 const root=scene();root.remove(root.getObjectByName(rig.groups.arm)!);assert.throws(()=>new RearPresenter(root,rig),/Missing rear group/);
});
