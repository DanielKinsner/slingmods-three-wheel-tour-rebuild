import {RivalMaterialPool,sharedRivalMaterial} from './rival-material-pool';
import {riderAssetURL,riderAttachmentURL} from './rider-asset';
import {finishVehicleSurfaces,loadVehicleSurfaceMaps} from './vehicle-surfaces';
import {hasMaterialBindings,recolorRivalMaterial,VehicleOptics,materialRole} from './vehicle-materials';
import {restoreConsoleDetail} from './console-detail';
import {isSpyder,SpyderMotion} from './spyder';
import {isRyker,RykerMotion} from './ryker';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DriverPresenter,type DriverAttachment} from './driver';
import {RearPresenter,type RearRig} from './rear';
import {FrontLinks} from './front-links';
import {CURRENT_VEHICLE,CURRENT_REAR_RIG,CURRENT_VEHICLE_URL} from './vehicle-asset';
import {assetStatistics} from './statistics';
import {configureShadows} from './shadows';
import {mergeRigidParts,type MergeReport} from './merge-rigid';
import {perfLegacy} from './perf-switches';
import {upgradeBrakeRotors} from './brake-rotors';
import {upgradeAmberLenses} from './lens-detail';
import {VehicleProxy,STAND_IN_LAYER} from './vehicle-proxy';import {WET_REFLECTION_LAYER} from './wet-reflection';
const LAMP_ROLES=new Set(['headlamp','running-brake','brake']);
import type {VehicleTelemetry} from '../simulation';
/** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
export async function loadDrivingHero(loader:GLTFLoader,options:{rivals?:boolean}={}){
 const [asset,person,attachment,rig,surfaceMaps]=await Promise.all([loader.loadAsync(CURRENT_VEHICLE_URL),loader.loadAsync(riderAssetURL()),fetch(riderAttachmentURL()).then(r=>r.json() as Promise<DriverAttachment>),fetch(CURRENT_REAR_RIG).then(r=>r.json() as Promise<RearRig>),loadVehicleSurfaceMaps()]);
 // Physically based surfaces before any rival is cloned from this car (vehicle-surfaces.ts; ?vehiclesurfaces=off compares).
 const surfaces=/[?&]vehiclesurfaces=off/.test(globalThis.location?.search??'')?undefined:finishVehicleSurfaces(asset.scene,surfaceMaps);
 if(!isRyker(asset.scene)&&!isSpyder(asset.scene))restoreConsoleDetail(asset.scene);
 upgradeBrakeRotors(asset.scene);upgradeAmberLenses(asset.scene);asset.scene.userData.assetURL=CURRENT_VEHICLE_URL;
 const hero={...bindDrivingHero(asset.scene,person.scene,attachment,rig),surfaces};
 if((!isRyker(asset.scene)&&!isSpyder(asset.scene))||!options.rivals)return hero;
 // Rivals are 2026 Slingshots: same rider asset where it matches the hero's, always the Slingshot fit.
 const fleetSearch=new URLSearchParams(globalThis.location?.search??'');fleetSearch.set('visual','2026');const fleetRider=riderAssetURL('?'+fleetSearch);
 const [fleet,fleetAttachment,fleetRig,fleetPerson]=await Promise.all([loader.loadAsync('/assets/model02/slingshot-2026.glb'),fetch(riderAttachmentURL('2026')).then(r=>r.json() as Promise<DriverAttachment>),fetch('/assets/model02/rear-rig.json').then(r=>r.json() as Promise<RearRig>),fleetRider===riderAssetURL()?Promise.resolve(person):loader.loadAsync(fleetRider)]);
 fleet.scene.userData.assetURL='/assets/model02/slingshot-2026.glb';restoreConsoleDetail(fleet.scene);upgradeBrakeRotors(fleet.scene);if(surfaces)finishVehicleSurfaces(fleet.scene,surfaceMaps);const rivals=bindDrivingHero(fleet.scene,cloneRig(fleetPerson.scene) as THREE.Group,fleetAttachment,fleetRig);return {...hero,cloneRival:rivals.cloneRival,rivalMaterialPool:rivals.rivalMaterialPool};
}
export function bindDrivingHero(car:THREE.Group,body:THREE.Group,attachment:DriverAttachment,rig:RearRig){
 if(attachment.rootOffset)body.position.fromArray(attachment.rootOffset);
 const asset={scene:car},person={scene:body};
 const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
 const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
 const ryker=isSpyder(car)?new SpyderMotion(car):isRyker(car)?new RykerMotion(car):undefined;
 const rear=ryker??new RearPresenter(asset.scene,rig),frontLinks=new FrontLinks(asset.scene),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
 const driver=new DriverPresenter(person.scene,root,wheel,attachment);
 // Rivals are drawn from one merged copy of the car (merge-rigid.ts): same look, about half the draw calls. Every node the
 // rig, steering, front links or mirrors address stays its own rigid body. Semantic (2026) car only; shared by all rivals.
 const rigidNames=new Set<string>([...Object.values(rig.groups),rig.drivePulley?.node??'','steering_control','rear_carrier','rear_swingarm','rear_arm_pivot','rear_hub','shock_upper','shock_lower','Mirrors_1','stock_exhaust']),dynamic=(o:THREE.Object3D)=>rigidNames.has(o.name)||/_(steer|spin)$/.test(o.name)||/^stock_(front_left|front_right|rear)_(spring|shock)$/.test(o.name)||!!(o.userData.frontLink??o.userData.model01FrontLink??o.userData.spyderMotion);
 let rivalTemplate:THREE.Group|undefined,rivalMerge:MergeReport|undefined;const materialPool=new RivalMaterialPool();
 let standIn:VehicleProxy|undefined;
 return{shadowStandIn(layerMask:number){if(!standIn)standIn=new VehicleProxy(car,dynamic,m=>{const mats=Array.isArray(m.material)?m.material:[m.material];return mats.some(x=>LAMP_ROLES.has(materialRole(x)??''))}).standIn(layerMask);return standIn.report},cloneRival(paint:string,accent:string,preset:'day'|'night'='day'){
 const semantic=hasMaterialBindings(car),decalMaps:THREE.Texture[]=[];
 if(semantic&&!rivalTemplate&&!/[?&]rivalmerge=off/.test(globalThis.location?.search??'')){rivalTemplate=cloneRig(car) as THREE.Group;rivalMerge=mergeRigidParts(rivalTemplate,dynamic).report}
 const carClone=cloneRig(rivalTemplate??car) as THREE.Group,bodyClone=cloneRig(body) as THREE.Group,owned=new Map<THREE.Material,THREE.Material>(),pooled=new Set<THREE.Material>();
 for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){const single=!Array.isArray(o.material);const mats=(single?[o.material]:o.material) as THREE.Material[];o.material=mats.map(m=>{let copy=owned.get(m);if(!copy){if(!perfLegacy('materials')&&sharedRivalMaterial(m,semantic)){copy=materialPool.acquire(m);pooled.add(m)}else copy=m.clone();owned.set(m,copy);if(copy instanceof THREE.MeshStandardMaterial){const map=recolorRivalMaterial(copy,paint,accent,semantic);if(map)decalMaps.push(map);}}return copy});if(single)o.material=o.material[0]}});
 const sourceGeometry=new Set<THREE.BufferGeometry>(),sourceMaterials=new Set<THREE.Material>(),sourceTextures=new Set<THREE.Texture>();for(const tree of [car,body])tree.traverse(o=>{if(o instanceof THREE.Mesh){sourceGeometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){sourceMaterials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)sourceTextures.add(value)}}});let sharedGeometry=0,sharedMaterials=0;const sharedTextures=new Set<THREE.Texture>();for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){if(sourceGeometry.has(o.geometry))sharedGeometry++;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(sourceMaterials.has(m))sharedMaterials++;for(const value of Object.values(m))if(value instanceof THREE.Texture&&sourceTextures.has(value))sharedTextures.add(value)}}});
 const result=bindDrivingHero(carClone,bodyClone,attachment,rig),optics=semantic?new VehicleOptics(carClone,preset==='night'):undefined;const proxy=semantic&&!perfLegacy('proxy')?new VehicleProxy(carClone,dynamic,m=>{const mats=Array.isArray(m.material)?m.material:[m.material];return mats.some(x=>LAMP_ROLES.has(materialRole(x)??''))}).shadowAndReflection((1<<STAND_IN_LAYER)|(1<<WET_REFLECTION_LAYER)):undefined;return {...result,pose(...args:Parameters<typeof result.pose>){result.pose(...args);optics?.update(args[0].brake)},detail:(distance:number)=>proxy?.update(distance)??false,warmDetail:(on:boolean)=>proxy?.warm(on),inspectProxy:()=>proxy?{...proxy.report,active:proxy.active}:undefined,inspectOptics:()=>optics?.inspect()??{roles:[],brakeEmission:[]},resources:{sharedGeometry,sharedMaterials,sharedTextures:sharedTextures.size,merge:rivalMerge},dispose(){proxy?.dispose();optics?.dispose();decalMaps.forEach(t=>t.dispose());result.root.removeFromParent();const skeletons=new Set<THREE.Skeleton>();result.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton)});skeletons.forEach(s=>s.dispose());owned.forEach((m,source)=>{if(pooled.has(source))materialPool.release(source);else m.dispose()});pooled.clear();owned.clear()}};
 },rivalMaterialPool:()=>materialPool.inspect(),root,asset:asset.scene,driver,rear,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},inspectVisual(){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();return{asset:car.userData.assetURL??CURRENT_VEHICLE_URL,driver:driver.inspect(),rear:rear.inspect(),wheels:bindings.map(b=>({center:b.node?.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse).toArray(),steer:b.steer?.quaternion.toArray(),spin:b.spin?.quaternion.toArray()}))}},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
 root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 if(ryker){ryker.pose(t);driver.update(t,dt,cockpit,reset);return}
 t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 rear.update(t.wheels[2],perfLegacy('rear'));frontLinks.update(t.wheels);
 wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
 }};
}
