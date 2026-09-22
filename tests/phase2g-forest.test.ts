import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from 'three';
import {forestFloorPlan,forestLOD,FOREST_BUDGET} from '../src/ridge/forest-layout';
import {forestAssetURLs} from '../src/ridge/forest-assets';
import {forestCardGeometry,forestWind} from '../src/ridge/forest';
import {RIDGE_ROUTE,RIDGE_SUPPORT_MESHES} from '../src/ridge/route';
import {projectRoad} from '../src/course/environment';
import {optionalDriveAssetURLs,driveAssetURLs} from '../src/signature/drive-preparation';
import {freshRecipe} from '../src/signature/config';
import {visitorSearch} from '../src/demo/profile';
test('forest floor plan is deterministic, clears the road and retains the physical route',()=>{
 const before=JSON.stringify(RIDGE_SUPPORT_MESHES),a=forestFloorPlan();assert.deepEqual(a,forestFloorPlan());assert.ok(a.cover.length>2000&&a.cover.length<3000);assert.ok(a.rocks.length<120);
 for(const p of [...a.cover,...a.rocks]){assert.ok(Object.values(p).every(Number.isFinite));const r=projectRoad(RIDGE_ROUTE,p.x,p.z);assert.ok(r.distance>9.35,'foliage stays beyond the road and runoff');const side=(p.x-r.x)*-r.dz+(p.z-r.z)*r.dx;assert.ok(!(r.progress>1460&&r.progress<2100&&side<0),'overlook remains open')}
 assert.equal(JSON.stringify(RIDGE_SUPPORT_MESHES),before);
});
test('every foliage card has finite wind weights and stays within its authored atlas tile',()=>{
 for(let variant=0;variant<3;variant++){const g=forestCardGeometry(variant);for(const a of Object.values(g.attributes))for(const x of a.array)assert.ok(Number.isFinite(x));const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++){assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1);assert.ok(uv.getY(i)>=0&&uv.getY(i)<=1)}if(variant===2)assert.ok(Array.from(g.getAttribute('color').array).every(v=>v===0));else assert.ok(Array.from(g.getAttribute('color').array).some(v=>v>0));g.dispose()}
});
test('quality budgets use three mesh levels then imposters and cull distant trees',()=>{
 for(const quality of ['low','medium','high','ultra']as const){const b=FOREST_BUDGET[quality];assert.equal(forestLOD(b.end+1,quality),-1);assert.equal(forestLOD(b.far+1,quality),3);assert.equal(forestLOD(b.mid+1,quality),2);assert.equal(forestLOD(b.near+1,quality),1)}
 assert.equal(forestLOD(5,'low'),1);assert.equal(forestLOD(5,'high'),0);assert.ok(FOREST_BUDGET.low.cover<FOREST_BUDGET.high.cover);
});
test('visible and depth foliage share the same wind uniform and vertex deformation',()=>{
 const time={value:2},strength={value:.18},sun=new THREE.Vector3(0,1,0),color=new THREE.MeshStandardMaterial(),depth=new THREE.MeshDepthMaterial();
 forestWind(color,time,strength,sun);forestWind(depth,time,strength,sun);
 const compile=(m:THREE.Material)=>{const s={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <opaque_fragment>'};m.onBeforeCompile(s as any,{} as any);return s};
 const a=compile(color),b=compile(depth);assert.equal(a.vertexShader,b.vertexShader);assert.equal((a.uniforms as any).forestWind,strength);assert.equal((b.uniforms as any).forestTime,time);strength.value=0;assert.equal((a.uniforms as any).forestWind.value,0);color.dispose();depth.dispose();
});
test('forest downloads are optional, present and included in the shipped allowlist',()=>{
 const urls=forestAssetURLs(),allowed=new Set(JSON.parse(readFileSync('demo-assets.json','utf8')).assets);assert.equal(urls.length,25);assert.equal(new Set(urls).size,urls.length);
 for(const url of urls){assert.ok(existsSync('public'+url));assert.ok(allowed.has(url.slice(1)),url);assert.ok(optionalDriveAssetURLs('ridge').includes(url));assert.ok(!driveAssetURLs('ridge',freshRecipe()).includes(url));assert.ok(!optionalDriveAssetURLs('harbor').includes(url));assert.ok(!url.endsWith('.png'))}
 assert.equal(new URLSearchParams(visitorSearch('?forest=off')).get('forest'),'off');assert.equal(new URLSearchParams(visitorSearch('?forest=unknown')).has('forest'),false);
});
