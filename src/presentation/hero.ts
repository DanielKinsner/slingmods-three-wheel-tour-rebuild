import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DriverPresenter,type DriverAttachment} from './driver';
import {assetStatistics} from './statistics';
import {configureShadows} from './shadows';
import type {VehicleTelemetry} from '../simulation';
/** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
export async function loadDrivingHero(loader:GLTFLoader){
 const [asset,person,attachment]=await Promise.all([loader.loadAsync('/assets/vehicles/slingshot-p03a2.glb'),loader.loadAsync('/assets/drivers/test-driver.glb'),fetch('/assets/drivers/test-driver-attachment.json').then(r=>r.json() as Promise<DriverAttachment>)]);
 const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
 const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
 const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
 const caliper=asset.scene.getObjectByName('suspension_rear__Brake_Caliper'),caliperBase=caliper?.position.clone(),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
 const driver=new DriverPresenter(person.scene,root,wheel,attachment);
 return{root,asset:asset.scene,driver,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
 root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 if(caliper&&caliperBase&&bindings[2].basePos){caliper.position.copy(caliperBase);caliper.position.y+=t.wheels[2].localCenter.y-bindings[2].basePos.y}
 wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
 }};
}
