import {hasMaterialBindings,recolorRivalMaterial,VehicleOptics} from './vehicle-materials';
import {restoreConsoleDetail} from './console-detail';
import {isRyker,RykerMotion} from './ryker';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DriverPresenter,type DriverAttachment} from './driver';
import {RearPresenter,type RearRig} from './rear';
import {FrontLinks} from './front-links';
import {CURRENT_VEHICLE,CURRENT_REAR_RIG,CURRENT_VEHICLE_URL,CURRENT_DRIVER_ATTACHMENT} from './vehicle-asset';
import {assetStatistics} from './statistics';
import {configureShadows} from './shadows';
import {mergeRigidParts,type MergeReport} from './merge-rigid';
import {perfLegacy} from './perf-switches';
import type {VehicleTelemetry} from '../simulation';
/** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
export async function loadDrivingHero(loader:GLTFLoader,options:{rivals?:boolean}={}){
 const [asset,person,attachment,rig]=await Promise.all([loader.loadAsync(CURRENT_VEHICLE_URL),loader.loadAsync('/assets/drivers/test-driver.glb'),fetch(CURRENT_DRIVER_ATTACHMENT).then(r=>r.json() as Promise<DriverAttachment>),fetch(CURRENT_REAR_RIG).then(r=>r.json() as Promise<RearRig>)]);
 if(!isRyker(asset.scene))restoreConsoleDetail(asset.scene);
 asset.scene.userData.assetURL=CURRENT_VEHICLE_URL;
 const hero=bindDrivingHero(asset.scene,person.scene,attachment,rig);
 if(!isRyker(asset.scene)||!options.rivals)return hero;
 // Selecting a Ryker changes the player only; the established rival fleet remains Slingshots.
 const [fleet,fleetAttachment,fleetRig]=await Promise.all([loader.loadAsync('/assets/model02/slingshot-2026.glb'),fetch('/assets/model02/driver-attachment.json').then(r=>r.json() as Promise<DriverAttachment>),fetch('/assets/model02/rear-rig.json').then(r=>r.json() as Promise<RearRig>)]);
 fleet.scene.userData.assetURL='/assets/model02/slingshot-2026.glb';restoreConsoleDetail(fleet.scene);const rivals=bindDrivingHero(fleet.scene,cloneRig(person.scene) as THREE.Group,fleetAttachment,fleetRig);return {...hero,cloneRival:rivals.cloneRival};
}
function bindDrivingHero(car:THREE.Group,body:THREE.Group,attachment:DriverAttachment,rig:RearRig){
 if(attachment.rootOffset)body.position.fromArray(attachment.rootOffset);
 const asset={scene:car},person={scene:body};
 const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
 const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
 const ryker=isRyker(car)?new RykerMotion(car):undefined;
 const rear=ryker??new RearPresenter(asset.scene,rig),frontLinks=new FrontLinks(asset.scene),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
 const driver=new DriverPresenter(person.scene,root,wheel,attachment);
 // Rivals are drawn from one merged copy of the car (merge-rigid.ts): same look, about half the draw calls. Every node the
 // rig, steering, front links or mirrors address stays its own rigid body. Semantic (2026) car only; shared by all rivals.
 const rigidNames=new Set<string>([...Object.values(rig.groups),rig.drivePulley?.node??'','steering_control','rear_carrier','rear_arm_pivot','rear_hub','shock_upper','shock_lower','Mirrors_1','stock_exhaust']),dynamic=(o:THREE.Object3D)=>rigidNames.has(o.name)||/_(steer|spin)$/.test(o.name)||!!(o.userData.frontLink??o.userData.model01FrontLink);
 let rivalTemplate:THREE.Group|undefined,rivalMerge:MergeReport|undefined;
 return{cloneRival(paint:string,accent:string,preset:'day'|'night'='day'){
 const semantic=hasMaterialBindings(car),decalMaps:THREE.Texture[]=[];
 if(semantic&&!rivalTemplate&&!/[?&]rivalmerge=off/.test(globalThis.location?.search??'')){rivalTemplate=cloneRig(car) as THREE.Group;rivalMerge=mergeRigidParts(rivalTemplate,dynamic).report}
 const carClone=cloneRig(rivalTemplate??car) as THREE.Group,bodyClone=cloneRig(body) as THREE.Group,owned=new Map<THREE.Material,THREE.Material>();
 for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){const single=!Array.isArray(o.material);const mats=(single?[o.material]:o.material) as THREE.Material[];o.material=mats.map(m=>{let copy=owned.get(m);if(!copy){copy=m.clone();owned.set(m,copy);if(copy instanceof THREE.MeshStandardMaterial){const map=recolorRivalMaterial(copy,paint,accent,semantic);if(map)decalMaps.push(map);}}return copy});if(single)o.material=o.material[0]}});
 const sourceGeometry=new Set<THREE.BufferGeometry>(),sourceMaterials=new Set<THREE.Material>(),sourceTextures=new Set<THREE.Texture>();for(const tree of [car,body])tree.traverse(o=>{if(o instanceof THREE.Mesh){sourceGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){sourceMaterials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)sourceTextures.add(value)}}});let sharedGeometry=0,sharedMaterials=0;const sharedTextures=new Set<THREE.Texture>();for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){if(sourceGeometry.has(o.geometry))sharedGeometry++;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(sourceMaterials.has(m))sharedMaterials++;for(const value of Object.values(m))if(value instanceof THREE.Texture&&sourceTextures.has(value))sharedTextures.add(value)}}});
 const result=bindDrivingHero(carClone,bodyClone,attachment,rig),optics=semantic?new VehicleOptics(carClone,preset==='night'):undefined;return {...result,pose(...args:Parameters<typeof result.pose>){result.pose(...args);optics?.update(args[0].brake)},inspectOptics:()=>optics?.inspect()??{roles:[],brakeEmission:[]},resources:{sharedGeometry,sharedMaterials,sharedTextures:sharedTextures.size,merge:rivalMerge},dispose(){optics?.dispose();decalMaps.forEach(t=>t.dispose());result.root.removeFromParent();const skeletons=new Set<THREE.Skeleton>();result.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton)});skeletons.forEach(s=>s.dispose());owned.forEach(m=>m.dispose())}};
 },root,asset:asset.scene,driver,rear,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},inspectVisual(){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();return{asset:car.userData.assetURL??CURRENT_VEHICLE_URL,driver:driver.inspect(),rear:rear.inspect(),wheels:bindings.map(b=>({center:b.node?.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse).toArray(),steer:b.steer?.quaternion.toArray(),spin:b.spin?.quaternion.toArray()}))}},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
 root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 if(ryker){ryker.pose(t);driver.update(t,dt,cockpit,reset);return}
 t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 rear.update(t.wheels[2],perfLegacy('rear'));frontLinks.update(t.wheels);
 wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
 }};
}
