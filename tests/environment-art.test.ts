import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {RIDGE_ROUTE,RIDGE_SURFACES} from '../src/ridge/route';
import {ridgeSeamBlend,ridgeBackdrop} from '../src/ridge/presentation';
import {expressLandMaterial,expressWaterMaterial} from '../src/express/presentation';
import {surfaceRule} from '../src/presentation/surface-materials';

const n=RIDGE_ROUTE.centerline.length;
test('Ridge start-line seam: visible terrain shares one edge where station 3200 meets 0; physics meshes untouched',()=>{
 const before=RIDGE_SURFACES.terrain.map(d=>d.vertices.slice()),land=JSON.parse(readFileSync('public/assets/ridge/ridge-land.json','utf8'));
 // The physical data really does step here (this is what opened the crack); the blend must not hide a zero-size problem.
 assert.ok(Math.abs(RIDGE_SURFACES.terrain[5].vertices[4]-RIDGE_SURFACES.terrain[5].vertices[(2*n+1)*3+1])>1);
 const seam=ridgeSeamBlend(land);
 seam.terrain.forEach((d,k)=>{for(let c=0;c<2;c++)assert.equal(d.vertices[(2*n+c)*3+1],d.vertices[c*3+1],'wrap column equals the first column');
  // Only heights in the last eight cross-sections move.
  d.vertices.forEach((v,i)=>{if(i%3!==1||Math.floor(i/6)<n-8)assert.equal(v,before[k][i])})});
 seam.terrain.slice(2,4).forEach((d,k)=>{const inner=k===0?0:1;for(let i=n-8;i<=n;i++)assert.equal(d.vertices[(i*2+(1-inner))*3+1],before[k+2][(i*2+(1-inner))*3+1],'9 m edge stays exact')});
 RIDGE_SURFACES.terrain.forEach((d,k)=>assert.deepEqual(d.vertices,before[k],'physical support meshes are never mutated'));
 // The scenic land's 60 m edge follows the eased ribbon, so no sliver opens between them.
 assert.ok(Math.abs(seam.land!.vertices[(n-1)*3+1]-seam.terrain[0].vertices[(n-1)*2*3+1])<1e-5);
 assert.ok(Math.abs(seam.land!.vertices[(2*n-1)*3+1]-seam.terrain[5].vertices[((n-1)*2+1)*3+1])<1e-5);
});
test('Ridge backdrop: five shaded layers in one fogged draw, inside the camera far plane from anywhere on the route',()=>{
 for(const preset of['day','night']as const){const {geometry,material}=ridgeBackdrop(preset,new THREE.Vector3(-.74,.29,-.6).normalize());
  assert.ok(material instanceof THREE.ShaderMaterial&&material.fog);assert.ok(geometry.getAttribute('ridgeTint')&&geometry.getAttribute('ridgeData'));
  const p=geometry.getAttribute('position');let far=0;for(const [x,z] of RIDGE_ROUTE.centerline)for(let i=0;i<p.count;i+=37)far=Math.max(far,Math.hypot(p.getX(i)-x,p.getZ(i)-z));
  assert.ok(far<2150,`farthest backdrop vertex ${far.toFixed(0)} m stays inside the 2200 m far plane`);geometry.dispose();material.dispose()}
});
test('Harbor Express land and water keep their own shaders (the scenery pass leaves them alone)',()=>{
 const t=new THREE.Texture(),land=expressLandMaterial(t,t,undefined,false),water=expressWaterMaterial('day');
 assert.equal(surfaceRule(land,'Express_land'),undefined);assert.equal(surfaceRule(water.material,'Express_water'),undefined);
 assert.equal(land.customProgramCacheKey(),'express-land-v1');assert.equal(water.material.customProgramCacheKey(),'express-water-v1');assert.equal(water.material.metalness,0);
});
