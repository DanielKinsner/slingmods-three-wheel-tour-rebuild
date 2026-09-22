import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from 'three';
import {surfaceRule,prepareSurfaceMaterial,loadSurfaceMaterials} from '../src/presentation/surface-materials';
import {surfaceAssetURLs} from '../src/presentation/surface-assets';
import {optionalDriveAssetURLs} from '../src/signature/drive-preparation';
import {visitorSearch} from '../src/demo/profile';

test('surface pass selects scenery and room finishes while preserving protected artwork and special shaders',()=>{
 for(const name of ['studio_warm_white','studio_charcoal_tile','Quality_Aluminum','Waterfront_Marine_Paint','Ridge_warm_timber'])assert.ok(surfaceRule(new THREE.MeshStandardMaterial({name}),''));
 for(const name of ['SlingMods_authorized_logo','Radar_Blue','Quality_Glazing','Showcase_Practical_Atlas','P06C_Palm_Frond'])assert.equal(surfaceRule(new THREE.MeshStandardMaterial({name}),''),undefined);
 const custom=new THREE.MeshStandardMaterial();custom.onBeforeCompile=()=>{};assert.equal(surfaceRule(custom,'Ridge_physical_terrain_0'),undefined);
});
test('physical texture scale follows instance transforms and uses derivative normals rather than unrelated authored tangents',()=>{
 const source=new THREE.MeshStandardMaterial({name:'Quality_Aluminum',color:'#b0b6b8',roughness:.3,metalness:.7}),maps=[new THREE.Texture(),new THREE.Texture(),new THREE.Texture()],material=prepareSurfaceMaterial(source,surfaceRule(source,'')!,maps);
 const shader={uniforms:{},vertexShader:'#include <uv_vertex>',fragmentShader:'#include <map_fragment>\n#include <normal_fragment_maps>'};material.onBeforeCompile(shader as any,{} as any);
 assert.ok(shader.vertexShader.includes('instanceMatrix*surfaceLocal'));assert.ok(shader.vertexShader.includes('/0.500'));assert.ok(shader.fragmentShader.includes('#undef USE_TANGENT'));assert.ok(shader.fragmentShader.includes('surfaceDetail'));assert.ok(!shader.fragmentShader.includes('#include <normal_fragment_maps>'));
 assert.equal(material.roughness,.3);assert.equal(material.metalness,.7);assert.deepEqual(material.color,source.color);assert.equal(source.map,null);assert.equal(material.map,maps[0]);material.dispose();source.dispose();maps.forEach(t=>t.dispose());
});
test('authored floor textures and UVs remain intact when adding the close-up detail layer',()=>{
 const maps=[new THREE.Texture(),new THREE.Texture(),new THREE.Texture()],source=new THREE.MeshStandardMaterial({name:'Refined_vented_red',map:maps[0],normalMap:maps[1],roughnessMap:maps[2]});maps[0].repeat.set(3,7);
 const rule=surfaceRule(source,'')!;assert.equal(rule.detailOnly,true);const material=prepareSurfaceMaterial(source,rule);assert.equal(material.map,source.map);assert.deepEqual(material.map!.repeat.toArray(),[3,7]);
 const shader={uniforms:{},vertexShader:'#include <uv_vertex>',fragmentShader:'#include <normal_fragment_maps>'};material.onBeforeCompile(shader as any,{} as any);assert.equal(shader.vertexShader,'#include <uv_vertex>');assert.ok(shader.fragmentShader.includes('surfaceDetail'));material.dispose();source.dispose();maps.forEach(t=>t.dispose());
});
test('surface ownership restores originals without disposing borrowed maps or touching geometry',async()=>{
 const maps=[new THREE.Texture(),new THREE.Texture(),new THREE.Texture()],original=new THREE.MeshStandardMaterial({name:'Quality_Cast_Concrete',map:maps[0],normalMap:maps[1],roughnessMap:maps[2]}),geometry=new THREE.BoxGeometry(),mesh=new THREE.Mesh(geometry,original),root=new THREE.Group();root.add(mesh);
 let originalsDisposed=0,replacementsDisposed=0;original.addEventListener('dispose',()=>originalsDisposed++);maps.forEach(t=>t.addEventListener('dispose',()=>originalsDisposed++));geometry.addEventListener('dispose',()=>originalsDisposed++);
 const finish=await loadSurfaceMaterials({} as THREE.WebGLRenderer,root);assert.notEqual(mesh.material,original);assert.equal(mesh.geometry,geometry);(mesh.material as THREE.Material).addEventListener('dispose',()=>replacementsDisposed++);finish.dispose();finish.dispose();assert.equal(mesh.material,original);assert.equal(originalsDisposed,0);assert.equal(replacementsDisposed,1);
 const off=await loadSurfaceMaterials({} as THREE.WebGLRenderer,root,false);assert.equal(off.inspect().changedMeshes,0);off.dispose();original.dispose();geometry.dispose();maps.forEach(t=>t.dispose());
});
test('all surface sets are shipped and warmed optionally, including the published comparison switch',()=>{
 const allow=new Set(JSON.parse(readFileSync('demo-assets.json','utf8')).assets);
 for(const place of ['harbor','express','ridge','showroom'] as const)for(const url of surfaceAssetURLs(place)){assert.ok(existsSync('public'+url));assert.ok(allow.has(url.slice(1)),url);if(place!=='showroom')assert.ok(optionalDriveAssetURLs(place).includes(url))}
 assert.equal(new URLSearchParams(visitorSearch('?surfaces=off')).get('surfaces'),'off');assert.equal(new URLSearchParams(visitorSearch('?surfaces=invalid')).has('surfaces'),false);
});
