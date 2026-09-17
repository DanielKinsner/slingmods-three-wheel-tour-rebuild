import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {FrontLinks} from '../src/presentation/front-links';
import {RearPresenter} from '../src/presentation/rear';
import {SignatureFinishPresenter} from '../src/presentation/signature-art';
import {CURRENT_VEHICLE_URL,PRODUCT_FITMENT_LABEL} from '../src/presentation/vehicle-asset';
import {visitorSearch} from '../src/demo/profile';
import {freshRecipe,validateRecipe,buildSummary} from '../src/signature/config';
const bytes=fs.readFileSync('public/assets/model02/slingshot-2026.glb');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
const layout=JSON.parse(fs.readFileSync('public/assets/slingshot-contact-layout.json','utf8'));
function scene(){
 const root=new THREE.Group(),nodes:THREE.Object3D[]=gltf.nodes.map((n:any)=>{const o=new THREE.Object3D();o.name=n.name;o.userData=n.extras??{};if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale)}return o});
 gltf.nodes.forEach((n:any,i:number)=>n.children?.forEach((j:number)=>nodes[i].add(nodes[j])));gltf.scenes[gltf.scene??0].nodes.forEach((i:number)=>root.add(nodes[i]));root.updateMatrixWorld(true);return{root,nodes};
}
test('all supplied 2026 files remain byte-identical and runtime retains the actual newer shell',()=>{
 const notes=JSON.parse(fs.readFileSync('assets/blender/model02/build-notes.json','utf8'));assert.equal(Object.keys(notes.sourceFiles).length,81);
 for(const [name,hash]of Object.entries(notes.sourceFiles))assert.equal(createHash('sha256').update(fs.readFileSync('assets/source/model02/2026 model/'+name)).digest('hex'),hash,name);
 const {root}=scene();for(const name of ['VentedHood_VentedHood_2','model02_2026_foundation','steering_control','display_mount','signature_seat_driver','signature_storage_door_left'])assert.ok(root.getObjectByName(name),name);
 assert.ok(!root.getObjectByName('josh_donor_foundation'));assert.ok(!gltf.nodes.some((n:any)=>n.camera!==undefined));
 const lens=gltf.materials.find((m:any)=>m.name==='Model02_instrument_clear_lens');assert.equal(lens.alphaMode,'BLEND');assert.ok(lens.pbrMetallicRoughness.baseColorFactor[3]<.1);
});
test('2026 tire geometry matches unchanged contacts; calipers stay out of spinning groups; Josh tread uses its own UV channel',()=>{
 const {root,nodes}=scene();
 for(const wheel of layout.wheels){const name='Model02_'+wheel.id+'_tire',index=gltf.nodes.findIndex((n:any)=>n.name===name),node=nodes[index];assert.equal(node.parent!.name,wheel.id+'_spin');
  const primitive=gltf.meshes[gltf.nodes[index].mesh].primitives[0],position=gltf.accessors[primitive.attributes.POSITION],bounds=new THREE.Box3(new THREE.Vector3().fromArray(position.min),new THREE.Vector3().fromArray(position.max)).applyMatrix4(node.matrixWorld);
  assert.ok(bounds.getCenter(new THREE.Vector3()).distanceTo(new THREE.Vector3().fromArray(wheel.center))<.001);const size=bounds.getSize(new THREE.Vector3());assert.ok(Math.abs(size.y-wheel.radius*2)<.001);assert.ok(Math.abs(size.x-wheel.width)<.001);
  assert.equal(gltf.materials[primitive.material].normalTexture.texCoord,1);assert.ok(primitive.attributes.TEXCOORD_1!==undefined);
 }
 for(const n of nodes.filter(n=>/brakeCalipers|rearCaliper/.test(n.name)))for(let p=n.parent;p;p=p.parent)assert.ok(!p.name.endsWith('_spin'),n.name);
 assert.ok(root.getObjectByName('rear_spin'));
});
test('actual 2026 front links retain fixed ends, tie rods follow steer, and rear groups close over full travel',()=>{
 const {root,nodes}=scene(),presenter=new FrontLinks(root),rig=JSON.parse(fs.readFileSync('public/assets/model02/rear-rig.json','utf8')),rear=new RearPresenter(root,rig);
 const checks=nodes.filter(n=>n.userData.frontLink).map(node=>{const link=node.userData.frontLink;return{node,link,a:new THREE.Vector3().fromArray(link.a),b:new THREE.Vector3().fromArray(link.b),localA:node.worldToLocal(new THREE.Vector3().fromArray(link.a)),localB:node.worldToLocal(new THREE.Vector3().fromArray(link.b))}});assert.ok(checks.length>=12);
 for(const travel of [-.16,0,.16]){const wheels=layout.wheels.map((w:any,i:number)=>({localCenter:{x:w.center[0],y:w.center[1]+travel,z:w.center[2]},steer:i<2?.55:0,spin:2}));presenter.update(wheels);root.getObjectByName('rear_spin')!.position.y=wheels[2].localCenter.y;rear.update(wheels[2]);root.updateMatrixWorld(true);
  for(const c of checks){assert.ok(c.node.localToWorld(c.localA.clone()).distanceTo(c.a)<1e-6);const end=c.b.clone();if(c.link.steered){const center=new THREE.Vector3(c.link.side==='left'?-.8775:.8775,.32985,-1.3335);end.sub(center).applyAxisAngle(new THREE.Vector3(0,1,0),.55).add(center)}end.y+=travel;assert.ok(c.node.localToWorld(c.localB.clone()).distanceTo(end)<1e-6)}
  assert.ok(rear.inspect().shockEndpointError<1e-6);assert.ok(rear.inspect().armEndpointError<1e-6);
 }
});
test('four finishes recolor 2026 native decal accents without altering protected tire materials',async()=>{
 const car=new THREE.Group(),paint=new THREE.MeshStandardMaterial(),decal=new THREE.MeshStandardMaterial(),rubber=new THREE.MeshStandardMaterial();paint.name='Model02_Radar_Blue_body';decal.name='Model02_AccentDecal_front';rubber.name='Model02_Josh_tire_tread';decal.map=new THREE.Texture();
 const meshes=[paint,decal,rubber].map(m=>new THREE.Mesh(new THREE.BufferGeometry(),m));car.add(...meshes);const presenter=new SignatureFinishPresenter(car),old=THREE.TextureLoader.prototype.loadAsync,urls:string[]=[];
 THREE.TextureLoader.prototype.loadAsync=async(url:string)=>{urls.push(url);return new THREE.Texture()};
 try{for(const finish of ['black-red','white-graphite','graphite-red','blue-orange']as const){await presenter.set(finish);assert.equal(presenter.inspect().finish,finish);assert.equal(meshes[2].material,rubber);assert.equal((meshes[1].material as THREE.MeshStandardMaterial).color.getHexString(),'ffffff')}assert.equal((meshes[1].material as THREE.MeshStandardMaterial).map,decal.map);assert.equal(urls.length,3);assert.ok(urls.every(u=>u.startsWith('/assets/model02/decal-front-')))}finally{presenter.dispose();THREE.TextureLoader.prototype.loadAsync=old}
});
test('2026 is the visual default while existing save identities and honest product fitment remain intact',()=>{
 assert.equal(CURRENT_VEHICLE_URL,'/assets/model02/slingshot-2026.glb');assert.equal(new URLSearchParams(visitorSearch('?visual=2026&asset=private')).get('visual'),'2026');
 const saved=freshRecipe();assert.equal(saved.vehicleId,'slingshot-r-2024');assert.deepEqual(validateRecipe(saved),saved);assert.match(PRODUCT_FITMENT_LABEL,/unverified/);assert.match(buildSummary(saved),/2026 Slingshot R/);
});
