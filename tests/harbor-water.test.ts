import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHarborWater} from '../src/presentation/harbor-water';

test('water time updates retain one shader variant and dispose restores the source material',()=>{
 const texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({color:0x235d69,normalMap:texture,roughness:.24,metalness:.12,envMapIntensity:.75});
 const original={color:material.color.clone(),compile:material.onBeforeCompile,key:material.customProgramCacheKey};
 const water=createHarborWater([material]);
 const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms)} as Parameters<typeof material.onBeforeCompile>[0];
 material.onBeforeCompile(shader,{} as THREE.WebGLRenderer);
 const version=material.version,key=material.customProgramCacheKey();
 for(const t of [0,1,65.23,180,NaN]){water.update(t);assert.ok(Number.isFinite(shader.uniforms.harborWaterTime.value));assert.equal(material.version,version);assert.equal(material.customProgramCacheKey(),key)}
 assert.equal(material.normalMap,texture,'retain the authored normal texture rather than allocate a runtime texture per frame');
 water.dispose();water.dispose();assert.deepEqual(material.color,original.color);assert.equal(material.roughness,.24);assert.equal(material.metalness,.12);assert.equal(material.envMapIntensity,.75);assert.equal(material.onBeforeCompile,original.compile);assert.equal(material.customProgramCacheKey,original.key);
 material.dispose();texture.dispose();
});

test('water rejects a missing authored normal map instead of silently dropping wave detail',()=>{
 const material=new THREE.MeshStandardMaterial();assert.throws(()=>createHarborWater([material]),/authored normal map/);material.dispose();
});
