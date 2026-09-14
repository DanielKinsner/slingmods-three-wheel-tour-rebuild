import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DriverPresenter,type DriverAttachment} from './driver';
import {RearPresenter,type RearRig} from './rear';
import {CURRENT_VEHICLE,CURRENT_REAR_RIG} from './vehicle-asset';
import {assetStatistics} from './statistics';
import {configureShadows} from './shadows';
import type {VehicleTelemetry} from '../simulation';
/** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
export async function loadDrivingHero(loader:GLTFLoader){
 const [asset,person,attachment,rig]=await Promise.all([loader.loadAsync('/assets/vehicles/'+CURRENT_VEHICLE),loader.loadAsync('/assets/drivers/test-driver.glb'),fetch('/assets/drivers/test-driver-attachment.json').then(r=>r.json() as Promise<DriverAttachment>),fetch(CURRENT_REAR_RIG).then(r=>r.json() as Promise<RearRig>)]);
 return bindDrivingHero(asset.scene,person.scene,attachment,rig);
}
function bindDrivingHero(car:THREE.Group,body:THREE.Group,attachment:DriverAttachment,rig:RearRig){
 const asset={scene:car},person={scene:body};
 const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
 const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
 const rear=new RearPresenter(asset.scene,rig),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
 const driver=new DriverPresenter(person.scene,root,wheel,attachment);
 return{cloneRival(paint:string,accent:string){
 const carClone=cloneRig(car) as THREE.Group,bodyClone=cloneRig(body) as THREE.Group,owned=new Map<THREE.Material,THREE.Material>();
 for(const tree of [carClone,bodyClone])tree.traverse(o=>{if(o instanceof THREE.Mesh){const single=!Array.isArray(o.material);const mats=(single?[o.material]:o.material) as THREE.Material[];o.material=mats.map(m=>{let copy=owned.get(m);if(!copy){copy=m.clone();owned.set(m,copy);if(copy instanceof THREE.MeshStandardMaterial){if(/Radar_Blue|paint/i.test(copy.name)){copy.color.set(paint);copy.map=null}if(/helmet|textile|accent/i.test(copy.name)){copy.color.set(accent)}if(/lamp|lens|light/i.test(copy.name)&&copy.emissive){copy.emissive.set('#ffd7a0');copy.emissiveIntensity=.7}}}return copy});if(single)o.material=o.material[0]}});
 const result=bindDrivingHero(carClone,bodyClone,attachment,rig);return {...result,dispose(){result.root.removeFromParent();const skeletons=new Set<THREE.Skeleton>();result.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton)});skeletons.forEach(s=>s.dispose());owned.forEach(m=>m.dispose())}};
 },root,asset:asset.scene,driver,rear,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
 root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 rear.update(t.wheels[2]);
 wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
 }};
}
