import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {batchPlacements} from '../src/presentation/showcase';import {trimSmallCasters,configureShadows} from '../src/presentation/shadows';
// Draw calls are the harbor's frame-time budget (handoff/PHASE-2-DRAW-CALLS.md). These pin the cuts that do not show.
const layout=JSON.parse(readFileSync('public/assets/showcase-quality/scene-layout.json','utf8')) as {spatialChunkMetres:number;lod:Record<string,unknown>;instances:{module:string;position:number[]}[]};
test('harbor scenery batches actually batch: no more than one instanced group per three placements',()=>{
 const batches=batchPlacements(layout,layout.instances),placed=[...batches.values()].reduce((n,list)=>n+list.length,0);
 assert.equal(placed,layout.instances.length,'every placement is drawn exactly once');
 for(const [key,list]of batches)assert.ok(list.every(p=>p.module===key.split(':')[0]),'a batch never mixes modules');
 const authored=new Set(layout.instances.map(p=>[p.module,Math.floor(p.position[0]/layout.spatialChunkMetres),Math.floor(p.position[2]/layout.spatialChunkMetres)].join(':'))).size;
 assert.ok(batches.size<=layout.instances.length/3,`${batches.size} batches for ${layout.instances.length} placements`);assert.ok(batches.size<authored*.55,`was ${authored} at the authored cell size`);
});
test('palms keep smaller cells than static scenery, because their level of detail is chosen per cell',()=>{
 const span=(module:string)=>{let widest=0;for(const [key,list]of batchPlacements(layout,layout.instances))if(key.startsWith(module+':')){const xs=list.map(p=>p.position[0]),zs=list.map(p=>p.position[2]);widest=Math.max(widest,Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))}return widest};
 assert.ok(span('palm0')<=layout.spatialChunkMetres*2);assert.ok(span('barrierseam')<=layout.spatialChunkMetres*4);assert.ok(span('barrierseam')>layout.spatialChunkMetres,'static scenery really does share wider cells');
});
test('in a drive, parts too small for the sun shadow map to resolve do not cast; the showroom default keeps every caster',()=>{
 const car=new THREE.Group(),part=(name:string,size:number,scale=1)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),new THREE.MeshBasicMaterial());m.name=name;m.scale.setScalar(scale);car.add(m);return m};
 const body=part('body',1.8),bolt=part('bolt',.02),scaledUp=part('authored_small_shown_large',.02,20),tube=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1.2),new THREE.MeshBasicMaterial());tube.name='roll_hoop_tube';car.add(tube);
 configureShadows(car,new THREE.Group());assert.ok([body,bolt,scaledUp,tube].every(m=>m.castShadow),'the shared loader (showroom included) leaves every part casting');
 const result=trimSmallCasters(car);assert.deepEqual(result,{kept:3,trimmed:1,minimumMetres:.15});
 assert.equal(bolt.castShadow,false);assert.equal(body.castShadow,true);assert.equal(scaledUp.castShadow,true,'size is measured in the world, not in the file');assert.equal(tube.castShadow,true,'thin but long parts still shape the shadow');assert.equal(bolt.receiveShadow,true);
});
