import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {RIDGE_ROUTE,RIDGE_SURFACES,RIDGE_SEAM_METRES,ridgeCrossHeight} from '../src/ridge/route';
import {sampleRoad} from '../src/course/environment';
import {snapRidgeLandEdge,ridgeBackdrop} from '../src/ridge/presentation';
import {expressLandMaterial,expressWaterMaterial} from '../src/express/presentation';
import {surfaceRule} from '../src/presentation/surface-materials';

const n=RIDGE_ROUTE.centerline.length;
test('Ridge start line: the hillside wraps in physics, the road is untouched, the scenic land stays glued to it',()=>{
 // Physics heights: no step anywhere across the line, on either side, out to the 60 m verge.
 for(const off of[-60,-44,-20,-10,10,20,44,60])assert.ok(Math.abs(ridgeCrossHeight(RIDGE_ROUTE.length,off)-ridgeCrossHeight(0,off))<1e-9,`wraps at ${off} m`);
 // The road and shoulders (<=9 m) are bit-identical to the pre-fix formula everywhere on the lap.
 const old=(s:number,o:number)=>{const base=sampleRoad(RIDGE_ROUTE,s).y??0,d=Math.abs(o);return base-(Math.max(0,d-6)*.025)};
 for(let s=0;s<=RIDGE_ROUTE.length;s+=7)for(const o of[-9,-6,-3,0,3,6,9])assert.equal(ridgeCrossHeight(s,o),old(s,o));
 // Off-road ground only changes in the last RIDGE_SEAM_METRES before the line.
 const raw=(s:number,o:number)=>{const base=sampleRoad(RIDGE_ROUTE,s).y??0,fade=Math.min(1,(Math.abs(o)-9)/35),bank=Math.sin(s/3200*Math.PI*4)*.55+(o>0?.45:-.45);return base-.075+fade*(Math.abs(o)-9)*bank*.47+Math.sin(s*.035)*fade*1.3};
 for(let s=0;s<RIDGE_ROUTE.length-RIDGE_SEAM_METRES;s+=11)for(const o of[-40,-15,15,40])assert.equal(ridgeCrossHeight(s,o),raw(s,o));
 // Every terrain ribbon closes on itself, and the baked land's 60 m edge sits exactly on the terrain edge.
 RIDGE_SURFACES.terrain.forEach(d=>{for(let c=0;c<2;c++)assert.ok(Math.abs(d.vertices[(2*n+c)*3+1]-d.vertices[c*3+1])<1e-9)});
 const land=snapRidgeLandEdge(JSON.parse(readFileSync('public/assets/ridge/ridge-land.json','utf8')));
 for(let i=0;i<n;i++){assert.ok(Math.abs(land.vertices[i*3+1]-RIDGE_SURFACES.terrain[0].vertices[i*2*3+1])<1e-9);assert.ok(Math.abs(land.vertices[(n+i)*3+1]-RIDGE_SURFACES.terrain[5].vertices[(i*2+1)*3+1])<1e-9)}
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
