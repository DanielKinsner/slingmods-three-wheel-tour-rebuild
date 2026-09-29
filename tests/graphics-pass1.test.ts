import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GroundLight,casterShadow,bakeRect,MAX_POOLS,type GroundCaster} from '../src/presentation/ground-light';
import {raceRiderRim} from '../src/presentation/rider-kit';
import {configureRidgeLighting} from '../src/ridge/presentation';
import {NIGHT_IMPOSTOR} from '../src/ridge/forest';

const tree:GroundCaster={x:10,z:0,low:4,high:10,radius:3,opacity:.8,contact:.6,contactRadius:1.5};
const hooks=()=>({uniforms:{} as Record<string,unknown>,vertexShader:'void main(){\n#include <project_vertex>\n}',fragmentShader:'void main(){\n#include <lights_fragment_begin>\n#include <aomap_fragment>\n}'});

test('baked shade: a crown shadow falls away from the sun, longer as the sun drops',()=>{
 const high=casterShadow(tree,new THREE.Vector3(1,1,0).normalize());
 assert.ok(Math.abs(high.x-3)<1e-9&&Math.abs(high.z)<1e-9,'45 degree sun from +x: crown middle (7 m) lands 7 m towards -x');
 assert.ok(Math.abs(high.major-Math.hypot(3,3))<1e-9&&high.minor===3);assert.ok(Math.abs(Math.cos(high.angle)+1)<1e-9,'oriented along -x');
 const low=casterShadow(tree,new THREE.Vector3(-.74,.29,-.60).normalize());   // Smoky Ridge's late sun, ~17 degrees
 assert.ok(low.major>2*high.major,'a 17 degree sun stretches the shadow (10.3 m vs 4.2 m at 45 degrees)');
 assert.ok(low.x>tree.x&&low.z>tree.z,'and throws it away from the sun (+x, +z)');
});

test('baked shade: the bake square covers every caster with a margin',()=>{
 const [x0,z0,size]=bakeRect([tree,{...tree,x:-90,z:40}],50);
 assert.equal(size,100+100);assert.ok(x0<=-140&&x0+size>=60&&z0<=-50&&z0+size>=90);
 assert.deepEqual(bakeRect([]),[0,0,1]);
});

test('ground light chains onto existing shader edits, needs all three hooks, and restores on dispose',()=>{
 const light=new GroundLight(),m=new THREE.MeshStandardMaterial();let own=0;
 m.onBeforeCompile=()=>{own++};m.customProgramCacheKey=()=> 'route-floor';
 light.patch(m,m,new THREE.MeshBasicMaterial());assert.equal(light.inspect().materials,1,'standard materials only, once');
 const shader=hooks();m.onBeforeCompile(shader as never,undefined as never);
 assert.equal(own,1,'the route\'s own edit still runs first');
 assert.ok(shader.fragmentShader.includes('directLight.color *= glShadeV.x;'),'sun shade applies to the directional light');
 assert.ok(shader.fragmentShader.includes('glPools()')&&shader.vertexShader.includes('glWorld='));
 assert.ok('glBake' in shader.uniforms&&'glPoolPos' in shader.uniforms);
 assert.equal(m.customProgramCacheKey(),'route-floor|ground-light-v1');
 const partial={...hooks(),fragmentShader:'void main(){\n#include <lights_fragment_begin>\n}'};m.onBeforeCompile(partial as never,undefined as never);
 assert.ok(!partial.fragmentShader.includes('glShade'),'a material missing a hook is left untouched instead of failing to compile');
 light.dispose();assert.equal(m.customProgramCacheKey(),'route-floor');const after=hooks();m.onBeforeCompile(after as never,undefined as never);assert.ok(!after.fragmentShader.includes('glShade'));
});

test('headlight pools: off in daylight, one per lamp at night, capped',()=>{
 const light=new GroundLight(),lamp={position:new THREE.Vector3(1,.5,2),direction:new THREE.Vector3(0,-.05,-1).normalize()};
 light.setPools(0xffffff,0);light.update(null,[lamp,lamp]);assert.equal(light.uniforms.glPoolCount.value,0);
 light.setPools(0xffffff,1.1);light.update(null,[lamp,lamp]);assert.equal(light.uniforms.glPoolCount.value,2);assert.deepEqual(light.uniforms.glPoolPos.value[0].toArray(),[1,.5,2]);
 light.update(null,Array.from({length:12},()=>lamp));assert.equal(light.uniforms.glPoolCount.value,MAX_POOLS);
 light.update({focus:new THREE.Vector3(5,0,5),right:new THREE.Vector3(1,0,0),up:new THREE.Vector3(0,1,0),half:24},[]);assert.equal(light.uniforms.glNearHalf.value,24);assert.equal(light.uniforms.glPoolCount.value,0);
});

test('Smoky Ridge light: the late sun outweighs the sky fill, and blue hour drops the ground for the headlights',()=>{
 const rig=(preset:'day'|'night')=>{const scene=new THREE.Scene(),sun=new THREE.DirectionalLight(),fill=new THREE.HemisphereLight();scene.add(sun,fill);configureRidgeLighting(scene,preset);return{sun:sun.intensity,fill:fill.intensity}};
 const day=rig('day'),night=rig('night');
 assert.ok(day.sun/day.fill>=5,'day: shade needs the sun well above the fill (was 3.0 / 1.1)');
 assert.ok(night.sun<=.3&&night.fill<=.35,'blue hour: no daylight-level fill (was .85 / .95)');
 assert.ok(new THREE.Color(NIGHT_IMPOSTOR).r<new THREE.Color(0x748095).r*.5,'far tree cards dim with the rig');
});

test('race rider rim touches the biker only, once',()=>{
 const suit=new THREE.MeshStandardMaterial({name:'Biker_Leather'}),paint=new THREE.MeshStandardMaterial({name:'Model02_Paint'}),root=new THREE.Group();
 root.add(new THREE.Mesh(new THREE.BoxGeometry(),suit),new THREE.Mesh(new THREE.BoxGeometry(),paint));
 raceRiderRim([root,root],new THREE.Color(.5,.4,.3),.5);const key=suit.customProgramCacheKey();raceRiderRim([root],new THREE.Color(1,1,1),1);
 assert.equal(suit.customProgramCacheKey(),key,'idempotent');assert.ok(key.endsWith('|race-rim-v1'));
 assert.equal(paint.onBeforeCompile,THREE.Material.prototype.onBeforeCompile,'vehicle paint untouched');
 const shader={uniforms:{} as Record<string,{value:THREE.Color}>,vertexShader:'',fragmentShader:'#include <opaque_fragment>'};suit.onBeforeCompile(shader as never,undefined as never);
 assert.ok(shader.fragmentShader.includes('outgoingLight+=raceRiderRim'));assert.ok(Math.abs(shader.uniforms.raceRiderRim.value.r-.25)<1e-9);
});

test('Redstone keeps its canyon haze: the race re-applies it after the shared rig installs Harbor fog',()=>{
 const race=readFileSync(new URL('../src/express.ts',import.meta.url),'utf8'),rally=readFileSync(new URL('../src/rally/presentation.ts',import.meta.url),'utf8');
 assert.match(rally,/const fog=new THREE\.FogExp2\(/);assert.match(rally,/return \{root,support,obstacles,fog,/);
 const rig=race.indexOf('harborLighting(scene,hero.asset'),restore=race.indexOf('if(rallyFog)scene.fog=rallyFog');
 assert.ok(rig>0&&restore>rig,'the canyon haze is restored after harborLighting runs');
});
