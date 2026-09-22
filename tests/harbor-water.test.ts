import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHarborWater,createBoatBob,harborWaterGeometry,basinDepth,HARBOR_BASIN,MAX_WATER_LAMPS} from '../src/presentation/harbor-water';

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

// Slice 2D (handoff/PHASE-2D-HARBOR-WATER.md): the pieces that do not show in a screenshot.
function compile(material:THREE.MeshStandardMaterial){const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms)} as Parameters<typeof material.onBeforeCompile>[0];material.onBeforeCompile(shader,{} as THREE.WebGLRenderer);return shader}
test('the swell grid covers exactly what the authored quad covered, at 2 m over the visible basin, on the same water level',()=>{
 const quad=new THREE.PlaneGeometry(12000-28,24000);quad.rotateX(-Math.PI/2);quad.translate(-(12000+28)/2,-.3,0);
 const grid=harborWaterGeometry(quad);grid.computeBoundingBox();quad.computeBoundingBox();
 for(const axis of['x','z'] as const){assert.ok(Math.abs(grid.boundingBox!.min[axis]-quad.boundingBox!.min[axis])<1e-3);assert.ok(Math.abs(grid.boundingBox!.max[axis]-quad.boundingBox!.max[axis])<1e-3)}
 assert.ok(Math.abs(grid.boundingBox!.min.y+.3)<1e-6&&Math.abs(grid.boundingBox!.max.y+.3)<1e-6,'flat at the authored level; the swell happens in the shader');
 const p=grid.getAttribute('position');const xs=new Set<number>();for(let i=0;i<p.count;i++){const x=p.getX(i);if(x>HARBOR_BASIN.bankX-5&&x<HARBOR_BASIN.quayX-.5&&Math.abs(p.getZ(i))<100)xs.add(Math.round(x*100)/100)}
 const sorted=[...xs].sort((a,b)=>a-b),steps=sorted.slice(1).map((x,i)=>x-sorted[i]);assert.ok(steps.length>25&&steps.every(s=>s<2.05),'vertices no more than 2 m apart across the basin');
 assert.ok(p.count>10000&&p.count<60000,`${p.count} vertices: enough for a swell, cheap to draw`);quad.dispose();grid.dispose();
});
test('the basin depth proxy: a beach on the west bank, deep water at the quay wall, capped at 12 m',()=>{
 assert.equal(basinDepth(HARBOR_BASIN.bankX),0);assert.ok(Math.abs(basinDepth(HARBOR_BASIN.bankX+6.7)-3)<.05,'three metres about seven metres off the bank');
 assert.equal(basinDepth(HARBOR_BASIN.quayX),HARBOR_BASIN.quayDepth);assert.equal(basinDepth((HARBOR_BASIN.quayX+HARBOR_BASIN.bankX)/2),HARBOR_BASIN.maxDepth);
 for(let x=HARBOR_BASIN.bankX;x<HARBOR_BASIN.quayX-8;x+=.5)assert.ok(basinDepth(x+.5)>=basinDepth(x),'deeper, never shallower, walking out from the beach');
});
test('night streaks come from water-side lamps and lit windows only, the nearest twelve to the camera, keeping their colours',()=>{
 const material=new THREE.MeshStandardMaterial({normalMap:new THREE.Texture()});
 const lamps=[...Array.from({length:30},(_,i)=>({position:[-9.8,7,-i*20]})),{position:[9.8,7,-50]},{position:[60,7,-50]},{position:[120,7,-50]},{position:[-180,4,-40],color:[1,.86,.62]}];
 const water=createHarborWater([material],{lamps,lampsOn:true});const shader=compile(material);
 assert.equal(shader.uniforms.harborWaterNight.value,1);assert.equal(water.inspect().lamps.waterSide,32,'the two far from the water are dropped');
 water.update(1,new THREE.Vector3(0,2,-45));assert.equal(shader.uniforms.harborLampCount.value,MAX_WATER_LAMPS);
 const positions=shader.uniforms.harborLampPosition.value as THREE.Vector3[],colors=shader.uniforms.harborLampColor.value as THREE.Color[];
 const window=positions.findIndex(p=>p.x===-180);assert.ok(window>=0,'the lit window across the basin is never crowded out by the row of road lamps');assert.ok(Math.abs(colors[window].r-1)<1e-6&&Math.abs(colors[window].b-.62)<1e-6,'window keeps its warm white');
 const sodium=positions.findIndex(p=>p.x===-9.8);assert.ok(Math.abs(colors[sodium].g-.44)<1e-6,'road lamps default to sodium');
 assert.equal(positions.filter(p=>p.x>=HARBOR_BASIN.bankX).length,MAX_WATER_LAMPS-1,'the rest of the slots go to the nearest road lamps');assert.ok(positions.filter(p=>p.x===-9.8).every(p=>Math.abs(p.z+45)<=140),'and they are the closest ones');
 const dark=createHarborWater([new THREE.MeshStandardMaterial({normalMap:new THREE.Texture()})],{lamps,lampsOn:false});assert.equal(dark.inspect().night,0,'day looks skip the streak loop');
 water.dispose();dark.dispose();
});
test('the vertex swell and the boat bob are off on Low and under reduced motion',()=>{
 const mk=(o:Parameters<typeof createHarborWater>[1])=>createHarborWater([new THREE.MeshStandardMaterial({normalMap:new THREE.Texture()})],o).inspect().swellAmplitudeMetres;
 assert.equal(mk({}),.035);assert.equal(mk({swell:false}),0);assert.equal(mk({motion:false}),0);
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),3),m=new THREE.Matrix4();
 mesh.setMatrixAt(0,m.makeTranslation(-40,0,-67));mesh.setMatrixAt(1,m.makeTranslation(145,1,-190));mesh.setMatrixAt(2,m.makeTranslation(-50,0,-102));
 const bob=createBoatBob([mesh]);assert.equal(bob.count,2,'the cradled skiff at 1 m is not afloat');
 const before=Array.from(mesh.instanceMatrix.array);bob.update(3.2);const after=Array.from(mesh.instanceMatrix.array);
 assert.deepEqual(after.slice(16,32),before.slice(16,32),'the cradled boat never moves');assert.notDeepEqual(after.slice(0,16),before.slice(0,16));
 const heave=Math.abs(after[13]-before[13]),tilt=Math.acos(Math.min(1,after[5]));assert.ok(heave<=.03+1e-9&&tilt<Math.PI/180*1.2,'a few centimetres and about a degree, no more');
 assert.notEqual(after[13],mesh.instanceMatrix.array[16+13],'each boat is on its own phase');bob.update(NaN);assert.equal(createBoatBob([]).count,0);
});
test('the compiled shader keeps the sun glitter, foam and streak stages and never leaves the stock normal-map path in',()=>{
 const material=new THREE.MeshStandardMaterial({normalMap:new THREE.Texture()});const water=createHarborWater([material],{});const shader=compile(material);
 for(const piece of['harborShore(','harborDepth(','harborFoam','harborGlitterNormal','harborLampPosition','directionalLights[0]','#include <opaque_fragment>'])assert.ok(shader.fragmentShader.includes(piece),piece);
 assert.ok(!shader.fragmentShader.includes('#include <normal_fragment_maps>'));assert.ok(shader.vertexShader.includes('harborWaterSwell*hwFade'),'vertex swell fades at both shores');
 assert.ok(!shader.fragmentShader.includes('harborSwellMap;')||shader.fragmentShader.includes('#ifdef HARBOR_WATER_P11'),'P11 maps are only sampled once they have arrived');
 assert.equal(material.customProgramCacheKey(),'p11-harbor-water-v2');material.defines!.HARBOR_WATER_P11=1;assert.equal(material.customProgramCacheKey(),'p11-harbor-water-v2-p11','a different program once the maps arrive');
 water.dispose();assert.equal(material.defines!.HARBOR_WATER_P11,undefined,'dispose restores the material, defines included');
});
