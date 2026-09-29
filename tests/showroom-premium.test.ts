import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {premiumShowroom,SHOWROOM_PREMIUM} from '../src/presentation/showroom-premium';

function room(){
 const root=new THREE.Group(),mesh=(name:string,material:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(),material);m.name=name;root.add(m);return m};
 const floor=new THREE.MeshStandardMaterial({name:'Refined_vented_gray'});let surfaceHook=0;floor.onBeforeCompile=()=>{surfaceHook++};floor.customProgramCacheKey=()=>'surface-finish';
 const logo=new THREE.MeshStandardMaterial({name:'SlingMods_authorized_logo',map:new THREE.Texture()});
 const brushed=new THREE.MeshStandardMaterial({name:'studio_handle_brushed',roughness:.28,envMapIntensity:.7,color:0x8c999e});
 return {root,floor,logo,brushed,hooks:()=>surfaceHook,softbox:mesh('softbox',new THREE.MeshStandardMaterial({name:'studio_softbox_diffuser'})),wall:mesh('wall',new THREE.MeshStandardMaterial({name:'studio_warm_white'})),floorMesh:mesh('floor',floor),sign:mesh('sign',logo),hardware:mesh('ramps',brushed)};
}
const compile=(material:THREE.Material)=>{const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader} as unknown as THREE.WebGLProgramParametersWithUniforms;material.onBeforeCompile(shader,undefined as unknown as THREE.WebGLRenderer);return shader};

test('showroom finish keeps the owner room, replaces the floating softboxes and coats only the floor',()=>{
 const r=room(),premium=premiumShowroom(undefined as unknown as THREE.WebGLRenderer,r.root,0);
 assert.equal(r.softbox.visible,false,'softbox panels hidden under the finished ceiling');assert.equal(r.wall.visible,true);
 assert.ok(premium.group.getObjectByName('showroom_ceiling'));assert.equal(premium.group.children.filter(o=>(o as THREE.SpotLight).isSpotLight).length,SHOWROOM_PREMIUM.downlights.length);
 const shader=compile(r.floor);assert.equal(r.hooks(),1,'the shared surface-finish hook still runs');
 assert.match(shader.fragmentShader,/coatShine/);assert.match(shader.vertexShader,/vCoatWorld/);assert.ok('coatReflection' in shader.uniforms);assert.match(r.floor.customProgramCacheKey(),/^surface-finish\|showroom-epoxy-coat$/);
 assert.equal(compile(r.wall.material as THREE.Material).fragmentShader,THREE.ShaderLib.standard.fragmentShader,'walls are untouched');
 assert.equal(r.logo.emissiveMap,r.logo.map,'the brand sign is backlit by its own artwork');assert.ok(r.brushed.roughness>=.5&&r.brushed.envMapIntensity<.7);
 const inspect=premium.inspect();assert.equal(inspect.planar,null,'no planar pass below High');assert.deepEqual(inspect.floorMaterials,['Refined_vented_gray']);
 premium.dispose();
 assert.equal(r.softbox.visible,true);assert.equal(r.logo.emissiveMap,null);assert.equal(r.brushed.roughness,.28);assert.equal(r.brushed.envMapIntensity,.7);assert.equal(r.brushed.color.getHex(),0x8c999e);
});

test('lights-down look dims the frame, pools and sign; studio restores them',()=>{
 const r=room(),premium=premiumShowroom(undefined as unknown as THREE.WebGLRenderer,r.root,0),spots=()=>premium.group.children.filter(o=>(o as THREE.SpotLight).isSpotLight) as THREE.SpotLight[];
 premium.setLook('lights');assert.ok(spots().every(s=>s.intensity===SHOWROOM_PREMIUM.looks.lights.pool));assert.equal(r.logo.emissiveIntensity,SHOWROOM_PREMIUM.looks.lights.sign);
 premium.setLook('studio');assert.ok(spots().every(s=>s.intensity===SHOWROOM_PREMIUM.looks.studio.pool));assert.ok(SHOWROOM_PREMIUM.looks.lights.led<SHOWROOM_PREMIUM.looks.studio.led);
 premium.dispose();
});
