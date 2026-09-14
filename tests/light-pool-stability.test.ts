/** FUTURE regression: not executed by Astra (Three.js dependency unavailable here).
 * Copy into tests/ only as part of P04B2 implementation; run with the existing tsx runner.
 * Tests the actual scene/light lifecycle, not GPU performance or compilation timing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {harborLighting} from '../src/presentation/harbor-lighting';

test('night practical slots stay present across distance changes; unused slots emit zero', () => {
 const scene=new THREE.Scene();const car=new THREE.Group();scene.add(car);
 const route={lamps:[0,30,60,90,120,150].map(x=>({position:[x,6,0],target:[x,0,0]}))};
 const rig=harborLighting(scene,car,route,'night','standard');
 try {
  const counts:number[]=[];
  for(const x of [0,75,250,0]){
   rig.update(new THREE.Vector3(x,0,0),0);
   const visible:THREE.SpotLight[]=[];
   scene.traverseVisible(o=>{if(o instanceof THREE.SpotLight)visible.push(o)});
   counts.push(visible.length);
   // Two stock beams + four resident practical slots; emitters may fade to zero.
   assert.ok(visible.every(l=>Number.isFinite(l.intensity)&&l.intensity>=0));
   if(x===250){
    const practical=visible.filter(l=>l.parent!==car);
    assert.equal(practical.length,4);
    assert.ok(practical.every(l=>l.intensity===0));
   }
  }
  assert.deepEqual(counts,[6,6,6,6]);
 } finally {rig.dispose()}
});
