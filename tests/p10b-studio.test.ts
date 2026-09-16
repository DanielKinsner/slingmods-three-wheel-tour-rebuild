import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SignatureFinishPresenter } from '../src/presentation/signature-art';
import { TOUR_WALL, STUDIO_LOOKS, createStudioReflectionEnvironment, createStudioContactOcclusion, loadTourWall } from '../src/signature/studio-look';

test('P10B showroom paint is opt-in, finish-aware and restores source/rival identity', async () => {
 const original = new THREE.MeshStandardMaterial({color:'#2470b0',roughness:.3,metalness:.4}); original.name='Radar_Blue';original.map=new THREE.Texture();original.map.channel=1;original.roughnessMap=new THREE.Texture();
 const root=new THREE.Group(), mesh=new THREE.Mesh(new THREE.BoxGeometry(),original);root.add(mesh);const rival=mesh.clone();
 const legacy=new SignatureFinishPresenter(root);await legacy.set('blue-orange');assert.ok(!(mesh.material instanceof THREE.MeshPhysicalMaterial));assert.equal(mesh.material.roughness,.3);legacy.dispose();
 const studio=new SignatureFinishPresenter(root,{studio:true});const old=THREE.TextureLoader.prototype.loadAsync;THREE.TextureLoader.prototype.loadAsync=async()=>new THREE.Texture();
 try {for(const finish of ['blue-orange','black-red','white-graphite','graphite-red','blue-orange'] as const){await studio.set(finish);assert.ok(mesh.material instanceof THREE.MeshPhysicalMaterial);assert.equal(mesh.material.clearcoat,finish==='graphite-red'?.12:.7);assert.equal(mesh.material.metalness,.18);assert.equal(mesh.material.map?.channel,1,'Keep the actual paint atlas UV channel');assert.equal(mesh.material.roughness,finish==='graphite-red'?.48:1,'Do not multiply authored .25 ORM roughness by another .24');assert.equal(mesh.material.roughnessMap,finish==='graphite-red'?null:original.roughnessMap);assert.equal(rival.material,original);assert.equal(original.roughness,.3)}studio.dispose();assert.equal(mesh.material,original)}finally{THREE.TextureLoader.prototype.loadAsync=old;studio.dispose()}
});
test('Tour Wall occupies the existing uninterrupted negative-X wall, excludes door/cabinet envelope',()=>{
 assert.equal(TOUR_WALL.sourceMesh,'studio_left_wall');assert.deepEqual(TOUR_WALL.normal,[1,0,0]);assert.ok(TOUR_WALL.center[0]>-5.91&&TOUR_WALL.center[0]<-5.8);assert.ok(TOUR_WALL.center[2]+TOUR_WALL.width/2<6.96);assert.equal(TOUR_WALL.text,'BUILT TO BE YOURS.');assert.ok(STUDIO_LOOKS.lights.environment<STUDIO_LOOKS.studio.environment);
 const environment=createStudioReflectionEnvironment();assert.equal(environment.children.length,6);assert.ok(!environment.getObjectByName('vehicle'));const contact=createStudioContactOcclusion();assert.equal(contact.geometry.index?.count,30);
});
test('Optional mural and lettering failures preserve an owned non-emissive fallback',async()=>{
 const old=THREE.TextureLoader.prototype.loadAsync;THREE.TextureLoader.prototype.loadAsync=async()=>{throw Error('deliberate optional texture 503')};
 try {const result=await loadTourWall({loadAsync:async()=>{throw Error('deliberate details 503')}} as any);assert.equal(result.inspect().fallback,true);assert.equal(result.inspect().plateLoaded,false);const plate=result.group.getObjectByName('matte_coast_to_ridge_print') as THREE.Mesh;assert.ok(plate.material instanceof THREE.MeshStandardMaterial);assert.equal(plate.material.emissive.getHex(),0);result.setLook('lights');assert.equal((result.group.getObjectByName('Tour Wall warm practical wash') as THREE.SpotLight).intensity,5)}finally{THREE.TextureLoader.prototype.loadAsync=old}
});
