import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WetReflection} from '../src/presentation/wet-reflection';

// The planar pass turns shadow updates off and reuses the main pass' shadow maps. Before the main pass has made them,
// three.js binds an RGBA placeholder to the shadow sampler and every shadow-receiving draw fails with
// "Mismatch between texture format and sampler type" (the showroom's first frame drew 261 of them).
function setup(){
 const renders:boolean[]=[],renderer={getDrawingBufferSize:(v:THREE.Vector2)=>v.set(800,450),getRenderTarget:()=>null,shadowMap:{enabled:true,autoUpdate:true},getClearAlpha:()=>1,getClearColor:(c:THREE.Color)=>c,setClearColor(){},setRenderTarget(){},
  render(){renders.push(renderer.shadowMap.autoUpdate)}};
 const scene=new THREE.Scene(),car=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()),key=new THREE.SpotLight(0xffffff,1);key.castShadow=true;scene.add(car,key,key.target);
 const camera=new THREE.PerspectiveCamera(40,16/9,.1,100);camera.position.set(3,2,5);camera.lookAt(0,0,0);
 const pass=new WetReflection(renderer as unknown as THREE.WebGLRenderer,0,[{reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},planar:{value:0}}] as never,.5);pass.reflect([car]);
 return{renders,renderer,scene,camera,key,pass};
}

test('planar reflection waits for the main pass to make the shadow maps it reuses',()=>{
 const {renders,scene,camera,key,pass}=setup();
 pass.render(scene,camera);assert.equal(renders.length,0,'no shadow map yet: skip, keep the previous image');
 key.shadow.map=new THREE.WebGLRenderTarget(4,4);pass.render(scene,camera);
 assert.deepEqual(renders,[false],'map made by the main pass: reflect, reusing it (shadow updates off)');assert.equal(pass.passes,1);
});

test('planar reflection only waits for shadows that will actually be sampled',()=>{
 const off=setup();off.renderer.shadowMap.enabled=false;off.pass.render(off.scene,off.camera);assert.equal(off.renders.length,1,'shadows disabled: no maps are ever made or sampled');
 const hidden=setup();hidden.key.visible=false;hidden.pass.render(hidden.scene,hidden.camera);assert.equal(hidden.renders.length,1,'a hidden light is not in the lights state');
 const plain=setup();plain.key.castShadow=false;plain.pass.render(plain.scene,plain.camera);assert.equal(plain.renders.length,1,'a light without shadows needs no map');
});
