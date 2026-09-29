import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SprayPool} from '../src/presentation/wet-spray';
import {headlightPoolStrength} from '../src/presentation/harbor-lighting';
import {LOOKS} from '../src/presentation/time-of-day';

test('wet spray: streak quads from a fixed pool, lit by the haze, hidden when idle',()=>{
 const pool=new SprayPool(4),mesh=pool.points as THREE.Mesh<THREE.InstancedBufferGeometry,THREE.ShaderMaterial>;
 assert.equal(mesh.geometry.instanceCount,4);assert.equal(mesh.name,'pooled-water-rooster-tail');assert.equal(mesh.visible,false);
 for(let i=0;i<6;i++)pool.emit(new THREE.Vector3(i,0,0),new THREE.Vector3(0,.5,-30),0,1,.5);
 assert.equal(pool.emitted,6,'the pool wraps instead of growing');
 pool.update(.1,.1,900,true);assert.equal(mesh.visible,true);
 const pos=mesh.geometry.getAttribute('iPos') as THREE.InstancedBufferAttribute;assert.ok(pos.getZ(0)<-2.9,'particles travel with their velocity');
 pool.update(.7,.6,900,true);assert.equal(mesh.visible,false,'expired spray draws nothing');
 pool.setLight(new THREE.Color(.5,.5,.5),.8);assert.ok(Math.abs(mesh.material.uniforms.light.value.r-.4)<1e-9,'spray takes the route haze, not a fixed blue');
 assert.ok(mesh.material.uniforms.near.value>=2,'spray fades before it reaches the chase camera');
 pool.clear();assert.equal(mesh.visible,false);pool.dispose();
});

test('headlight pools: dry sunless roads only',()=>{
 assert.equal(headlightPoolStrength(true,undefined),1.1,'Smoky Ridge blue hour');
 assert.equal(headlightPoolStrength(true,LOOKS.night),1.1,'Harbor/Express Night');
 assert.equal(headlightPoolStrength(true,LOOKS['night-rain']),0,'wet night: the streaked reflections carry the lights');
 assert.equal(headlightPoolStrength(true,LOOKS['dusk-rain']),0,'dusk: the sky still lights the road');
 assert.equal(headlightPoolStrength(false,LOOKS.day),0);
});
