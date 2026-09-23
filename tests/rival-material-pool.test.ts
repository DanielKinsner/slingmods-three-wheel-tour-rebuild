import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RivalMaterialPool,sharedRivalMaterial} from '../src/presentation/rival-material-pool';
import {upgradeVehicleMaterial} from '../src/presentation/vehicle-surfaces';

test('fleet trim shares one owned material without coupling disposal or modifying the hero',()=>{
 const source=upgradeVehicleMaterial(new THREE.MeshStandardMaterial(),'rubber',{rubber:new THREE.Texture()});
 source.userData.vehicleRole='rubber';const pool=new RivalMaterialPool();
 assert.equal(sharedRivalMaterial(source,true),true);
 const a=pool.acquire(source),b=pool.acquire(source),c=pool.acquire(source);
 assert.equal(a,b);assert.equal(b,c);assert.notEqual(a,source);
 assert.equal(a.customProgramCacheKey(),source.customProgramCacheKey());
 let disposed=0,sourceDisposed=0;a.addEventListener('dispose',()=>disposed++);source.addEventListener('dispose',()=>sourceDisposed++);
 assert.deepEqual(pool.inspect(),{materials:1,users:3});
 pool.release(source);pool.release(source);assert.equal(disposed,0);
 pool.release(source);assert.equal(disposed,1);assert.equal(sourceDisposed,0);
 pool.release(source);assert.equal(disposed,1);assert.deepEqual(pool.inspect(),{materials:0,users:0});
 assert.notEqual(pool.acquire(source),a,'a later fleet receives a live new copy');pool.release(source);
});

test('paint, lighting, decals and transparent parts never enter the immutable fleet pool',()=>{
 for(const role of ['paint','accent','decal','headlamp','running-brake','brake','clear-cover','passive-reflector','display',undefined]){
  const m=new THREE.MeshStandardMaterial();m.userData.vehicleRole=role;assert.equal(sharedRivalMaterial(m,true),false,String(role));
 }
 const m=new THREE.MeshStandardMaterial();m.userData.vehicleRole='interior';assert.equal(sharedRivalMaterial(m,false),false,'unbound historical vehicles keep private materials');
 for(const change of [(m:THREE.MeshStandardMaterial)=>m.transparent=true,(m:THREE.MeshStandardMaterial)=>m.opacity=.9,(m:THREE.MeshStandardMaterial)=>m.alphaTest=.1,(m:THREE.MeshStandardMaterial)=>m.emissive.set(0xff0000),(m:THREE.MeshStandardMaterial)=>m.emissiveMap=new THREE.Texture()]){
  const copy=m.clone();change(copy);assert.equal(sharedRivalMaterial(copy,true),false);
 }
});
