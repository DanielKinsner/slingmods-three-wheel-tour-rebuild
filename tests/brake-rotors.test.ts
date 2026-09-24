import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {upgradeBrakeRotors} from '../src/presentation/brake-rotors';
test('Slingshot rotors are rebuilt in place, fitted to the original radius and axis, once',()=>{
 const car=new THREE.Group(),spin=new THREE.Group();car.add(spin);
 const disc=new THREE.CylinderGeometry(.171,.171,.02,24);disc.rotateZ(Math.PI/2);disc.translate(.89,1.12,-.38);   // thin along x, like the front rotors
 const mat=new THREE.MeshStandardMaterial({name:'mat_1_RoughAluminum_1913985_Brembo_399mm_Rotor'});const rotor=new THREE.Mesh(disc,mat);spin.add(rotor);
 spin.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({name:'Tire'})));
 assert.equal(upgradeBrakeRotors(car),1);assert.equal(upgradeBrakeRotors(car),0,'idempotent');
 assert.equal(rotor.parent,spin,'same spinning node');assert.equal(spin.children.length,2,'no extra meshes: draw count unchanged');assert.notEqual(rotor.geometry,disc);
 const ring=new THREE.Box3().setFromBufferAttribute(rotor.geometry.getAttribute('position') as THREE.BufferAttribute),size=ring.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.y/2-.1715)<.004&&Math.abs(size.z/2-.1715)<.004,'same radius');assert.ok(size.x<.06,'thin along the measured axis');
 assert.ok(Math.abs(ring.getCenter(new THREE.Vector3()).x-.89)<.01,'on the original ring plane');
});
