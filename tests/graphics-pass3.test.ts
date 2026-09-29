import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareSurfaceMaterial} from '../src/presentation/surface-materials';
import {DriftSparks} from '../src/presentation/drift-sparks';

const shader=()=>({uniforms:{},vertexShader:'void main(){\n#include <uv_vertex>\n#include <project_vertex>\n}',fragmentShader:'void main(){\n#include <map_fragment>\n#include <normal_fragment_maps>\n#include <emissivemap_fragment>\n#include <aomap_fragment>\n}'});
const detail={kind:'grass' as const,detailOnly:true,tint:false},concrete={kind:'concrete' as const,detailOnly:true,tint:true};

test('race surfaces: turf patches and less sky sheen; the showroom path is untouched',()=>{
 const turf=prepareSurfaceMaterial(new THREE.MeshStandardMaterial(),detail,undefined,{}),s=shader();turf.onBeforeCompile(s as never,undefined as never);
 assert.ok(s.fragmentShader.includes('surfaceMacro')&&s.fragmentShader.includes('reflectedLight.indirectSpecular*=.35'));assert.ok(s.vertexShader.includes('vSurfaceWorld=(modelMatrix'));
 assert.ok(turf.customProgramCacheKey().endsWith('-race'));
 const room=prepareSurfaceMaterial(new THREE.MeshStandardMaterial(),detail),r=shader();room.onBeforeCompile(r as never,undefined as never);
 assert.ok(!r.fragmentShader.includes('surfaceMacro')&&!r.vertexShader.includes('vSurfaceWorld'),'no race option: showroom and workbench shaders unchanged');
 assert.equal(room.customProgramCacheKey(),'surface-finish-v1-grass-true-false');
});

test('race surfaces: grime only on flat routes and only on near-vertical faces',()=>{
 const flat=prepareSurfaceMaterial(new THREE.MeshStandardMaterial(),concrete,undefined,{groundY:0}),a=shader();flat.onBeforeCompile(a as never,undefined as never);
 assert.ok(a.fragmentShader.includes('surfaceWall=1.-smoothstep(.55,.8,abs(surfaceUp.y))'),'pavement (normal up) is excluded');assert.ok(flat.customProgramCacheKey().endsWith('-race-grime'));
 const hilly=prepareSurfaceMaterial(new THREE.MeshStandardMaterial(),concrete,undefined,{}),b=shader();hilly.onBeforeCompile(b as never,undefined as never);
 assert.ok(!b.fragmentShader.includes('surfaceWall'),'no ground height (Ridge, Redstone): no grime line');
});

test('drift sparks: streaks from a fixed pool, nothing drawn when idle',()=>{
 const scene=new THREE.Scene(),sparks=new DriftSparks(scene),g=sparks.points.geometry as THREE.InstancedBufferGeometry;
 assert.equal(g.instanceCount,0);assert.equal(scene.children.includes(sparks.points),true);
 sparks.burst(new THREE.Vector3(),new THREE.Vector3(5,0,0),2);sparks.update(1/60,null,new THREE.Vector3(),2,0);assert.ok(g.instanceCount>0);
 const colour=g.getAttribute('iColor') as THREE.InstancedBufferAttribute;assert.ok(colour.getX(0)>1&&colour.getZ(0)<colour.getX(0),'hot orange tier colour, above white for bloom');
 sparks.update(.5,null,new THREE.Vector3(),2,0);assert.equal(g.instanceCount,0,'expired sparks draw nothing');
 sparks.clear();sparks.dispose();assert.equal(scene.children.includes(sparks.points),false);
});
