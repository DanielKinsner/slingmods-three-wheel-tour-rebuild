import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {TransparentHalves} from '../src/presentation/transparent-halves';
import {perfLegacy,setPerfLegacy} from '../src/presentation/perf-switches';
import {RearPresenter,type RearRig} from '../src/presentation/rear';
import {visitorSearch} from '../src/demo/profile';

test('perf A/B switches: all on by default, legacy restores all or one at a time, hosted only with test+profile',()=>{
 assert.equal(perfLegacy('transparency',''),false);assert.equal(perfLegacy('matrix','?perf=legacy'),true);
 assert.equal(perfLegacy('rear','?perf=legacy-matrix,legacy-rear'),true);assert.equal(perfLegacy('transparency','?perf=legacy-matrix,legacy-rear'),false);
 assert.deepEqual(setPerfLegacy('legacy-rear'),['rear']);assert.equal(perfLegacy('rear'),true);assert.deepEqual(setPerfLegacy(''),[]);assert.equal(perfLegacy('rear'),false);
 assert.equal(new URLSearchParams(visitorSearch('?scene=express&test=1&profile=1&perf=legacy-transparency')).get('perf'),'legacy-transparency');
 assert.equal(new URLSearchParams(visitorSearch('?scene=express&perf=legacy')).get('perf'),null);
 assert.equal(new URLSearchParams(visitorSearch('?scene=express&test=1&profile=1&perf=nonsense')).get('perf'),null);
});

const decal=(extra:Partial<THREE.MeshStandardMaterialParameters>={})=>new THREE.MeshStandardMaterial({transparent:true,side:THREE.DoubleSide,...extra});
function car(){
 const root=new THREE.Group(),box=new THREE.BoxGeometry(),tangents=new THREE.BoxGeometry();tangents.setAttribute('tangent',new THREE.BufferAttribute(new Float32Array(tangents.attributes.position.count*4),4));
 const eligible=decal(),shared=decal(),single=decal(),glass=new THREE.MeshPhysicalMaterial({transparent:true,side:THREE.DoubleSide,transmission:.5}),hooked=decal(),tangent=decal(),opaque=new THREE.MeshStandardMaterial({side:THREE.DoubleSide});single.forceSinglePass=true;hooked.onBeforeRender=()=>{};
 for(const [g,m] of [[box,eligible],[box,shared],[box,shared],[box,single],[box,glass],[box,hooked],[tangents,tangent],[box,opaque]] as const)root.add(new THREE.Mesh(g,m));
 return {root,eligible,shared,single,glass,hooked,tangent,opaque};
}
test('transparent halves: only plain two-sided transparent materials change, idempotently, and restore() undoes it',()=>{
 const c=car(),halves=new TransparentHalves();
 assert.equal(halves.apply([c.root]),2);assert.equal(halves.apply([c.root]),2);
 for(const m of [c.eligible,c.shared]){assert.equal(m.side,THREE.FrontSide);assert.equal(m.shadowSide,THREE.DoubleSide,'shadows still cast from both sides');assert.notEqual(m.onBeforeRender,THREE.Material.prototype.onBeforeRender)}
 for(const m of [c.single,c.glass,c.hooked,c.tangent,c.opaque])assert.equal(m.side,THREE.DoubleSide,m.type+' keeps three\'s own path');
 halves.restore();for(const m of [c.eligible,c.shared]){assert.equal(m.side,THREE.DoubleSide);assert.equal(m.shadowSide,null);assert.equal(m.onBeforeRender,THREE.Material.prototype.onBeforeRender)}
});
test('transparent halves: back half first, negated normal matrix and BackSide winding, then everything restored',()=>{
 const c=car(),halves=new TransparentHalves();halves.apply([c.root]);
 const mesh=c.root.children[0] as THREE.Mesh,camera=new THREE.PerspectiveCamera(),scene=new THREE.Scene(),before=[.1,-.2,.3,.4,.5,-.6,.7,.8,.9];mesh.normalMatrix.fromArray(before);
 const draws:{material:THREE.Material;normal:number[];flip:boolean|undefined}[]=[];let flip:boolean|undefined;
 const state={setMaterial(material:THREE.Material,frontFaceCW:boolean){flip=material.side===THREE.BackSide!==frontFaceCW},setFlipSided(value:boolean){flip=value}};
 const renderer={state,renderBufferDirect(_c:THREE.Camera,_s:THREE.Scene,_g:THREE.BufferGeometry,material:THREE.Material,object:THREE.Mesh){state.setMaterial(material,object.matrixWorld.determinant()<0);draws.push({material,normal:[...object.normalMatrix.elements],flip})}} as unknown as THREE.WebGLRenderer;
 c.eligible.onBeforeRender(renderer,scene,camera,mesh.geometry,mesh,null as unknown as THREE.Group);
 assert.equal(draws.length,1);assert.equal(draws[0].material,c.eligible);assert.deepEqual(draws[0].normal,before.map(v=>-v));assert.equal(draws[0].flip,true,'back half winds like BackSide');
 assert.deepEqual([...mesh.normalMatrix.elements],before);
 renderer.renderBufferDirect(camera,scene,mesh.geometry,c.eligible,mesh,null as never);assert.equal(draws[1].flip,false,'front half winds normally');
 // A mirrored object (negative determinant): three flips its winding, and the back half flips that again, as BackSide would.
 mesh.scale.x=-1;mesh.updateMatrixWorld();c.eligible.onBeforeRender(renderer,scene,camera,mesh.geometry,mesh,null as unknown as THREE.Group);assert.equal(draws[2].flip,false);
 renderer.renderBufferDirect(camera,scene,mesh.geometry,c.eligible,mesh,null as never);assert.equal(draws[3].flip,true);
});
test('negating the normal matrix reproduces FLIP_SIDED exactly (negation commutes with every product and sum)',()=>{
 const rnd=(s:number)=>()=>(s=(s*16807)%2147483647)/2147483647-.5,r=rnd(7);
 for(let i=0;i<2000;i++){
  const m=new THREE.Matrix3().fromArray(Array.from({length:9},()=>r()*7)),n=new THREE.Vector3(r(),r(),r());
  const flipped=n.clone().applyMatrix3(m).negate(),negated=n.clone().applyMatrix3(new THREE.Matrix3().fromArray(m.elements.map(v=>-v)));
  assert.ok(Object.is(flipped.x,negated.x)&&Object.is(flipped.y,negated.y)&&Object.is(flipped.z,negated.z),`differs at ${i}`);
 }
});

const rig=JSON.parse(fs.readFileSync('public/assets/vehicles/slingshot-p04a1-rear-rig.json','utf8')) as RearRig;
function rearScene(){const world=new THREE.Group(),root=new THREE.Group();world.add(root);root.position.set(42,2,-19);root.rotation.set(.2,1.7,-.11);for(const name of [...Object.values(rig.groups),'rear_arm_pivot','rear_hub','shock_upper','shock_lower','rear_spin']){const o=new THREE.Group();o.name=name;root.add(o)}root.getObjectByName('rear_spin')!.position.fromArray(rig.wheelCenter);return root}
test('rear presenter: the race path poses identically and measures only when inspected',()=>{
 const measured=new RearPresenter(rearScene(),rig),lazy=new RearPresenter(rearScene(),rig);
 for(const [y,spin] of [[rig.wheelCenter[1]-.08,.4],[rig.wheelCenter[1]+.05,2.2]]){
  const w={localCenter:{x:0,y,z:rig.wheelCenter[2]},spin},report=measured.update(w);assert.equal(lazy.update(w,false),undefined);
  for(const name of [...Object.values(rig.groups),'rear_arm_pivot','rear_hub','shock_upper','shock_lower'])assert.deepEqual(lazy.root.getObjectByName(name)!.matrix.elements,measured.root.getObjectByName(name)!.matrix.elements,name);
  assert.deepEqual(lazy.inspect(),report);
 }
});
