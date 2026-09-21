import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {mergeRigidParts,materialSignature} from '../src/presentation/merge-rigid';import {trimSmallCasters} from '../src/presentation/shadows';
// Rivals are drawn from a merged copy of the car (handoff/PHASE-2-DRAW-CALLS.md). These pin that merging never moves a
// vertex, never flips a face, and never swallows a part that something addresses individually.
const dynamic=(o:THREE.Object3D)=>/_(steer|spin)$/.test(o.name)||o.name==='steering_control'||!!o.userData.frontLink;
const plastic=()=>new THREE.MeshStandardMaterial({color:0x101010,roughness:.6}),part=(name:string,material:THREE.Material,at:[number,number,number],size=.4)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),material);m.name=name;m.position.set(...at);m.castShadow=true;m.receiveShadow=true;return m};
/** Every triangle as world-space corners plus its winding normal, order-independent. */
function triangles(root:THREE.Object3D){root.updateWorldMatrix(true,true);const out:string[]=[];
 root.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh||!mesh.visible)return;const g=mesh.geometry,p=g.getAttribute('position'),flip=mesh.matrixWorld.determinant()<0,count=g.index?g.index.count:p.count;
  for(let i=0;i<count;i+=3){const v=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,g.index?g.index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));if(flip)v.reverse();
   const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize(),centre=v[0].clone().add(v[1]).add(v[2]).divideScalar(3);out.push([...centre.toArray(),...normal.toArray()].map(n=>(Math.round(n*1e4)/1e4+0).toFixed(4)).join(','))}});
 return out.sort();
}
function car(){
 const root=new THREE.Group(),body=new THREE.Group(),steer=new THREE.Group(),spin=new THREE.Group(),shared=plastic();body.name='body_static';steer.name='front_left_steer';spin.name='front_left_spin';
 body.position.set(0,.3,0);body.rotation.y=.2;steer.position.set(-.9,.3,-1.3);steer.add(spin);root.add(body,steer);
 body.add(part('panel_a',shared,[0,0,0]),part('panel_b',plastic(),[.6,0,0]),part('panel_c',plastic(),[0,0,.7]));
 const mirrored=part('panel_mirrored',plastic(),[-.6,0,0]);mirrored.scale.x=-1;body.add(mirrored);
 spin.add(part('rim',plastic(),[0,0,0]),part('spokes',plastic(),[0,.1,0]));steer.add(part('upright',plastic(),[0,.2,0]));
 return{root,body,steer,spin};
}
test('parts that cannot move relative to each other and look the same become one; the picture does not change',()=>{
 const c=car(),before=triangles(c.root),sources=new Set<THREE.BufferGeometry>();c.root.traverse(o=>{if((o as THREE.Mesh).isMesh)sources.add((o as THREE.Mesh).geometry)});const vertices=[...sources].map(g=>Array.from(g.getAttribute('position').array));
 const {report}=mergeRigidParts(c.root,dynamic);assert.deepEqual(triangles(c.root),before,'every triangle is where it was, facing the way it faced (mirrored part included)');
 assert.equal(report.partsBefore,7);assert.equal(report.partsAfter,3,'four body panels -> 1, rim+spokes -> 1, the lone upright untouched: nothing joins across rigid bodies');assert.equal(report.joined,6);
 assert.deepEqual([...sources].map(g=>Array.from(g.getAttribute('position').array)),vertices,'the source geometry is shared with the player car and is never edited');
});
test('each rigid body keeps its own merged part, so wheels still steer, spin and travel',()=>{
 const c=car();mergeRigidParts(c.root,dynamic);const wheel=c.spin.children.filter(o=>(o as THREE.Mesh).isMesh),body=c.root.children.filter(o=>(o as THREE.Mesh).isMesh);
 assert.equal(wheel.length,1);assert.equal(body.length,1);assert.equal(wheel[0].parent,c.spin);assert.equal(c.body.children.length,0,'static folders are flattened into the car body');
 const before=triangles(c.spin);c.spin.rotation.x=1.1;c.steer.rotation.y=.4;assert.notDeepEqual(triangles(c.spin),before,'the merged wheel still moves with its node');assert.ok(c.root.getObjectByName('front_left_steer')&&c.root.getObjectByName('front_left_spin'));
});
test('anything addressed individually, layered as glass, hidden or multi-material is left exactly as it was',()=>{
 const c=car(),glassA=part('lens_a',new THREE.MeshStandardMaterial({transparent:true,opacity:.4}),[0,.5,0]),glassB=part('lens_b',new THREE.MeshStandardMaterial({transparent:true,opacity:.4}),[.2,.5,0]);
 const link=part('front_susp_link',plastic(),[0,.2,.2]);link.userData.frontLink={side:'left'};const control=part('steering_control',plastic(),[0,.4,.4]);
 const hiddenGroup=new THREE.Group();hiddenGroup.visible=false;hiddenGroup.add(part('stock_part_hidden_by_product',plastic(),[0,0,1]),part('stock_part_hidden_2',plastic(),[0,0,1.2]));
 const multi=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),[plastic(),plastic()]);multi.name='two_materials';c.body.add(glassA,glassB,link,control,hiddenGroup,multi);
 const {report}=mergeRigidParts(c.root,dynamic);for(const name of['lens_a','lens_b','front_susp_link','steering_control','stock_part_hidden_by_product','stock_part_hidden_2','two_materials'])assert.ok(c.root.getObjectByName(name),name+' survives');
 assert.equal(hiddenGroup.children.length,2,'a part hidden by a fitted product must not reappear inside a visible merged body');assert.deepEqual(report.left,{dynamic:2,transparent:2,other:3});
});
test('materials merge by how they render: names and ids never matter, a rival repaints paint by role, other colours do matter',()=>{
 const a=plastic(),b=plastic();a.name='mat_1_BodyPlastic_Tweeter';b.name='mat_2_BodyPlastic_CabSides';assert.equal(materialSignature(a),materialSignature(b));
 b.roughness=.2;assert.notEqual(materialSignature(a),materialSignature(b));
 const red=plastic(),blue=plastic();red.color.set(0xff0000);blue.color.set(0x0000ff);assert.notEqual(materialSignature(red),materialSignature(blue));
 red.userData.vehicleRole=blue.userData.vehicleRole='paint';assert.equal(materialSignature(red),materialSignature(blue),'both become the rival livery colour');
 blue.userData.vehicleRole='accent';assert.notEqual(materialSignature(red),materialSignature(blue));
 const lamp=plastic(),trim=plastic();lamp.userData.vehicleRole='brake';assert.notEqual(materialSignature(lamp),materialSignature(trim),'a lamp is never merged into trim: it is lit separately');
});
test('sub-texel parts are merged apart from the body so a drive can still stop them casting shadows',()=>{
 const c=car();for(let i=0;i<4;i++)c.body.add(part('bolt_'+i,plastic(),[i*.5-1,.4,0],.02));mergeRigidParts(c.root,dynamic);
 const bolts=c.root.children.find(o=>o.userData.subTexelParts) as THREE.Mesh;assert.ok(bolts,'the bolts are one part');assert.equal(bolts.userData.mergedParts,4);
 trimSmallCasters(c.root);assert.equal(bolts.castShadow,false,'spread across the car they are large as a group, but each is still too small to shade');assert.ok(c.root.children.some(o=>(o as THREE.Mesh).isMesh&&o.castShadow),'the body itself still casts');
});
