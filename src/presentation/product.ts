import {RectAreaLightUniformsLib}from'three/addons/lights/RectAreaLightUniformsLib.js';
import {isRyker} from './ryker';
import * as THREE from 'three';import type{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{COLORS,defaultAppearance,type Appearance}from'../career/catalog';import{CURRENT_UNDERGLOW}from'./vehicle-asset';
/** Artistic calibration in renderer nits at the existing default .6 UI brightness. Not OEM photometry. */
export const KIT_DEFAULT_NITS=900;
/** Additive chassis accessory. It never reads or writes simulation controls or contact data. */
export class ProductPresenter {
 private equipped=false;private appearance=defaultAppearance();private lights:THREE.RectAreaLight[]=[];private origins:THREE.Vector3[]=[];private diffusers:THREE.MeshStandardMaterial[]=[];private disposed=false;
 private constructor(readonly root:THREE.Group,private chassis:THREE.Object3D,private scene:THREE.Scene,readonly descriptor:any){
  root.name='TricLED_SM133_Base_Accessory';root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial&&/diffuser/i.test(m.name))this.diffusers.push(m)}});
  RectAreaLightUniformsLib.init();const origins=descriptor.lightOrigins??[[-.56,.14,0],[.56,.14,0]];
  for(const origin of origins.slice(0,2)){this.origins.push(new THREE.Vector3().fromArray(origin));const light=new THREE.RectAreaLight(0xffffff,0,.035,1.3);light.castShadow=false;light.name='SM133_reserved_emitter';this.scene.add(light);this.lights.push(light)}
 }
 static async load(loader:GLTFLoader,chassis:THREE.Object3D,scene:THREE.Scene){if(isRyker(chassis))return new ProductPresenter(new THREE.Group(),chassis,scene,{lightOrigins:[],vehicle:'ryker',supported:false});const [g,descriptor]=await Promise.all([loader.loadAsync(CURRENT_UNDERGLOW.glb),fetch(CURRENT_UNDERGLOW.attachment).then(r=>{if(!r.ok)throw Error('Accessory attachment unavailable');return r.json()})]);return new ProductPresenter(g.scene,chassis,scene,descriptor)}
 set(equipped:boolean,appearance:Appearance){if(this.disposed)return;equipped=equipped&&!isRyker(this.chassis);this.equipped=equipped;this.appearance={...appearance};if(equipped){if(!this.root.parent)this.chassis.add(this.root)}else this.root.removeFromParent();const lit=equipped&&appearance.enabled;
  for(const m of this.diffusers){m.color.set(lit?COLORS[appearance.color]:'#b5b9b7');m.emissive.set(lit?COLORS[appearance.color]:'#000000');m.emissiveIntensity=lit?appearance.brightness*2:0}
  this.lights.forEach(l=>{l.visible=true;l.color.set(COLORS[appearance.color]);l.intensity=lit?KIT_DEFAULT_NITS*(appearance.brightness/.6):0});this.update();
 }
 async prepare<T>(render:()=>Promise<T>){const visible=this.root.visible;this.chassis.add(this.root);this.root.visible=true;try{return await render()}finally{this.root.visible=visible;if(this.disposed||!this.equipped)this.root.removeFromParent();else this.chassis.add(this.root)}}
 update(){if(!this.equipped||this.disposed)return;this.chassis.updateWorldMatrix(true,false);this.lights.forEach((l,i)=>{const local=this.origins[i];l.position.copy(local).applyMatrix4(this.chassis.matrixWorld);l.quaternion.copy(this.chassis.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2))})}
 inspect(){let triangles=0,meshes=0;this.root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}});return {equipped:this.equipped,appearance:{...this.appearance},attached:!!this.root.parent,lights:this.lights.filter(l=>!!l.parent&&l.intensity>0).length,residentLights:this.lights.filter(l=>!!l.parent).length,emitterNits:this.lights.map(l=>l.intensity),nominalLumens:this.lights.map(l=>l.power),extraShadowMaps:0,meshes,triangles,lightOrigins:this.origins.map(v=>v.toArray()),method:'Two downward narrow rectangular area lights aligned with chassis-mounted side strips, plus emissive Blender diffusers. Actual receiver geometry/normals and distance falloff; no glow decal or new shadow maps. Artistic approximation: no fine underside/barrier occluder shadows, not measured photometry.'}}
 dispose(){if(this.disposed)return;this.disposed=true;this.root.removeFromParent();this.root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});this.lights.forEach(l=>{l.removeFromParent();l.dispose()})}
}
