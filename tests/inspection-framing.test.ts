import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {fitInspectionCamera,projectedBounds} from '../src/presentation/inspection';

test('whole-vehicle framing respects perspective margin through the complete orbit',()=>{
 for(const aspect of [16/9,1.5,1,9/16])for(const fov of [30,38,50]){
  const camera=new THREE.PerspectiveCamera(fov,aspect,.05,700),bounds=new THREE.Box3(new THREE.Vector3(-1,0,-2.2),new THREE.Vector3(1,1.4,1.7));
  for(let i=0;i<=144;i++){
   const a=i*Math.PI*2/144;fitInspectionCamera(camera,bounds,new THREE.Vector3(Math.sin(a),.3,-Math.cos(a)));
   const p=projectedBounds(camera,bounds);assert.ok(p.allInFront);assert.ok(Math.max(Math.abs(p.minX),Math.abs(p.maxX),Math.abs(p.minY),Math.abs(p.maxY))<=.800001,JSON.stringify({aspect,fov,i,p}));
  }
 }
});
