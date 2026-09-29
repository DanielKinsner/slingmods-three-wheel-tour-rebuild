import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {standInShadowSwitch,STAND_IN_LAYER} from '../src/presentation/vehicle-proxy';
import {sceneryAmbient,smoothCutouts} from '../src/presentation/outdoor-environment';

test('stand-in shadows: the layer is on for the main camera only while the shadow pass walks the scene',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),car=new THREE.Group();scene.add(car);
 const dispose=standInShadowSwitch(scene);scene.add(new THREE.Group());   // something added later must not end up after the closing marker
 const hook=scene.onBeforeRender as unknown as (...args:unknown[])=>void;hook(undefined,scene,camera,null,undefined,undefined);
 const order=scene.children.map(o=>o.name);assert.equal(order[0],'stand_in_shadow_on');assert.equal(order.at(-1),'stand_in_shadow_off');
 const [on,off]=[scene.children[0],scene.children.at(-1)!] as THREE.Mesh[];
 assert.ok(on.castShadow&&off.castShadow&&!on.frustumCulled,'the markers reach the shadow traversal');
 assert.equal(camera.layers.isEnabled(STAND_IN_LAYER),false,'main view is projected without the stand-ins');
 const shadow=(m:THREE.Mesh)=>(m.onBeforeShadow as unknown as (...args:unknown[])=>void)(undefined,m,camera,camera,m.geometry,m.material,null);
 shadow(on);assert.equal(camera.layers.isEnabled(STAND_IN_LAYER),true,'stand-ins join the sun shadow');
 shadow(off);assert.equal(camera.layers.isEnabled(STAND_IN_LAYER),false,'and leave again before anything else renders');
 assert.equal((on.material as THREE.MeshBasicMaterial).colorWrite,false,'the markers never draw colour');
 dispose();assert.ok(!scene.children.some(o=>o.name.startsWith('stand_in_shadow')));
});

test('scenery ambient lowers the sky fill on the world only; vehicles keep their full reflections',()=>{
 const scene=new THREE.Scene();scene.environment=new THREE.Texture();scene.environmentIntensity=.95;
 const world=new THREE.MeshStandardMaterial(),paint=new THREE.MeshStandardMaterial(),own=new THREE.MeshStandardMaterial({envMap:new THREE.Texture(),envMapIntensity:.4});
 const car=new THREE.Group();car.add(new THREE.Mesh(new THREE.BoxGeometry(),paint));scene.add(car,new THREE.Mesh(new THREE.BoxGeometry(),world),new THREE.Mesh(new THREE.BoxGeometry(),own));
 assert.equal(sceneryAmbient(scene,[car],1),0,'factor 1 changes nothing (Night, Ridge)');
 assert.equal(sceneryAmbient(scene,[car],.6),1);
 assert.equal(world.envMap,scene.environment);assert.ok(Math.abs(world.envMapIntensity-.57)<1e-9);
 assert.equal(paint.envMap,null,'vehicle untouched');assert.equal(own.envMapIntensity,.4,'a material with its own map is untouched');
});

test('cut-out foliage is feathered only when the pipeline has MSAA, and never on vehicles',()=>{
 const scene=new THREE.Scene(),leaf=new THREE.MeshStandardMaterial({alphaTest:.5}),carLeaf=new THREE.MeshStandardMaterial({alphaTest:.5}),glass=new THREE.MeshStandardMaterial({alphaTest:.5,transparent:true});
 const car=new THREE.Group();car.add(new THREE.Mesh(new THREE.PlaneGeometry(),carLeaf));scene.add(car,new THREE.Mesh(new THREE.PlaneGeometry(),leaf),new THREE.Mesh(new THREE.PlaneGeometry(),glass));
 assert.equal(smoothCutouts(scene,[car],0),0,'Low has no MSAA');assert.equal(leaf.alphaToCoverage,false);
 assert.equal(smoothCutouts(scene,[car],4),1);assert.equal(leaf.alphaToCoverage,true);assert.equal(carLeaf.alphaToCoverage,false);assert.equal(glass.alphaToCoverage,false);
});
