import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {configureShadows} from '../src/presentation/shadows';
const mesh=(name:string)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());m.name=name;return m};
test('pad ground and markings receive vehicle shadows without entering the caster set',()=>{
 const car=new THREE.Group(),pad=new THREE.Group();car.add(mesh('body'),mesh('front_left_spin'));pad.add(mesh('ground'),mesh('straight_lane_edge'),mesh('wet'),mesh('curb'),mesh('barrier'),mesh('incline-launch'));
 const c=configureShadows(car,pad,'repaired');for(const name of ['ground','straight_lane_edge','wet'])assert.deepEqual(c.find(x=>x.name===name),{name,caster:false,receiver:true});for(const name of ['body','front_left_spin','curb','barrier','incline-launch'])assert.ok(c.find(x=>x.name===name)?.caster);
});
test('explicit diagnostic caster isolation cannot remove shadows from the restored normal policy',()=>{
 const car=new THREE.Group(),pad=new THREE.Group();car.add(mesh('body'));pad.add(mesh('ground'));
 assert.ok(configureShadows(car,pad,'receivers-only').every(o=>!o.caster));assert.ok(configureShadows(car,pad,'legacy').every(o=>o.caster));const normal=configureShadows(car,pad);assert.equal(normal[0].caster,true);assert.equal(normal[1].caster,false);
});
