import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {ProductPresenter,KIT_DEFAULT_NITS} from '../src/presentation/product';import {defaultAppearance}from'../src/career/catalog';
test('prepared product keeps resident slots but no unowned hardware or light contribution',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({lightOrigins:[[-.61,.122,-.04],[.61,.122,-.04]]})}) as Response;
 const scene=new THREE.Scene(),chassis=new THREE.Group();scene.add(chassis);const root=new THREE.Group(),mat=new THREE.MeshStandardMaterial();mat.name='SM133_Diffuser';root.add(new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),mat));
 const presenter=await ProductPresenter.load({loadAsync:async()=>({scene:root})}as any,chassis,scene);globalThis.fetch=original;
 try{const a=defaultAppearance();presenter.set(false,a);assert.equal(presenter.inspect().residentLights,2);assert.equal(presenter.inspect().lights,0);assert.equal(root.parent,null);
 await presenter.prepare(async()=>{assert.equal(root.parent,chassis)});assert.equal(root.parent,null);assert.equal(presenter.inspect().equipped,false);
 await presenter.prepare(async()=>{presenter.set(true,a)});assert.equal(root.parent,chassis);await presenter.prepare(async()=>{presenter.set(false,a)});assert.equal(root.parent,null);
 for(let i=0;i<12;i++){presenter.set(true,a);assert.equal(presenter.inspect().lights,2);assert.equal(presenter.inspect().emitterNits[0],KIT_DEFAULT_NITS);presenter.set(true,{...a,enabled:false});assert.equal(presenter.inspect().lights,0);presenter.set(false,a);assert.equal(root.parent,null);assert.equal(presenter.inspect().residentLights,2)}
 }finally{presenter.dispose()}assert.equal(scene.children.filter(o=>o instanceof THREE.RectAreaLight).length,0)
});
