import {hasMaterialBindings,recolorRivalMaterial,VehicleOptics} from './vehicle-materials';
import {restoreConsoleDetail} from './console-detail';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DriverPresenter,type DriverAttachment} from './driver';
import {RearPresenter,type RearRig} from './rear';
import {FrontLinks} from './front-links';
import {CURRENT_VEHICLE,CURRENT_REAR_RIG,CURRENT_VEHICLE_URL,CURRENT_DRIVER_ATTACHMENT} from './vehicle-asset';
import {assetStatistics} from './statistics';
import {configureShadows} from './shadows';
import type {VehicleTelemetry} from '../simulation';
/** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
export async function loadDrivingHero(loader:GLTFLoader){
 const [asset,person,attachment,rig]=await Promise.all([loader.loadAsync(CURRENT_VEHICLE_URL),loader.loadAsync('/assets/drivers/test-driver.glb'),fetch(CURRENT_DRIVER_ATTACHMENT).then(r=>r.json() as Promise<DriverAttachment>),fetch(CURRENT_REAR_RIG).then(r=>r.json() as Promise<RearRig>)]);
 restoreConsoleDetail(asset.scene);
 return bindDrivingHero(asset.scene,person.scene,attachment,rig);
}
function bindDrivingHero(car:THREE.Group,body:THREE.Group,attachment:DriverAttachment,rig:RearRig){
 if(attachment.rootOffset)body.position.fromArray(attachment.rootOffset);
 const asset={scene:car},person={scene:body};
 const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
 const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
 const rear=new RearPresenter(asset.scene,rig),frontLinks=new FrontLinks(asset.scene),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
 const driver=new DriverPresenter(person.scene,root,wheel,attachment);
 return{cloneRival(paint:string,accent:string,preset:'day'|'night'='day'){
 const semantic=hasMaterialBindings(car),decalMaps:THREE.Texture[]=[];
 const carClone=cloneRig(car) as THREE.Group,bodyClone=cloneRig(body) as THREE.Group,owned=new Map<THREE.Material,THREE.Material>();
 for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){const single=!Array.isArray(o.material);const mats=(single?[o.material]:o.material) as THREE.Material[];o.material=mats.map(m=>{let copy=owned.get(m);if(!copy){copy=m.clone();owned.set(m,copy);if(copy instanceof THREE.MeshStandardMaterial){const map=recolorRivalMaterial(copy,paint,accent,semantic);if(map)decalMaps.push(map);}}return copy});if(single)o.material=o.material[0]}});
 const sourceGeometry=new Set<THREE.BufferGeometry>(),sourceMaterials=new Set<THREE.Material>(),sourceTextures=new Set<THREE.Texture>();for(const tree of [car,body])tree.traverse(o=>{if(o instanceof THREE.Mesh){sourceGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){sourceMaterials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)sourceTextures.add(value)}}});let sharedGeometry=0,sharedMaterials=0;const sharedTextures=new Set<THREE.Texture>();for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){if(sourceGeometry.has(o.geometry))sharedGeometry++;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(sourceMaterials.has(m))sharedMaterials++;for(const value of Object.values(m))if(value instanceof THREE.Texture&&sourceTextures.has(value))sharedTextures.add(value)}}});
 const result=bindDrivingHero(carClone,bodyClone,attachment,rig),optics=semantic?new VehicleOptics(carClone,preset==='night'):undefined;return {...result,pose(...args:Parameters<typeof result.pose>){result.pose(...args);optics?.update(args[0].brake)},inspectOptics:()=>optics?.inspect()??{roles:[],brakeEmission:[]},resources:{sharedGeometry,sharedMaterials,sharedTextures:sharedTextures.size},dispose(){optics?.dispose();decalMaps.forEach(t=>t.dispose());result.root.removeFromParent();const skeletons=new Set<THREE.Skeleton>();result.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton)});skeletons.forEach(s=>s.dispose());owned.forEach(m=>m.dispose())}};
 },root,asset:asset.scene,driver,rear,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},inspectVisual(){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();return{asset:CURRENT_VEHICLE_URL,driver:driver.inspect(),rear:rear.inspect(),wheels:bindings.map(b=>({center:b.node?.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse).toArray(),steer:b.steer?.quaternion.toArray(),spin:b.spin?.quaternion.toArray()}))}},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
 root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 rear.update(t.wheels[2]);frontLinks.update(t.wheels);
 wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
 }};
}
