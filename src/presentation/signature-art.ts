import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SIGNATURE_ACCENTS,type SignatureFinish} from './signature-palette';
export type {SignatureFinish} from './signature-palette';
export const SIGNATURE_VEHICLE_URL='/assets/p08b/slingshot-signature.glb';
export const SIGNATURE_SHOWROOM_URL='/assets/p08b/showroom-refinement/signature-showroom-refined.glb';
export const SIGNATURE_PRODUCTS_URL='/assets/p08b/signature-products.glb';
export const SIGNATURE_MOUNT_VIEWS={exhaust:{position:[2.7,1.3,3.9],target:[0,.65,1.3]},wing:{position:[2.8,1.9,3.3],target:[0,1.25,1.2]},storage:{position:[-1.6,2.1,-.3],target:[-.2,.48,.95]}} as const;
/** Clone only each car's painted material slots. No rival/shared material mutation. */
export class SignatureFinishPresenter {
 private slots:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];owned:THREE.Material|THREE.Material[]}[]=[];
 private materials:{material:THREE.MeshStandardMaterial;map:THREE.Texture|null;color:THREE.Color;roughness:number;node:string;role:'paint'|'accent'}[]=[];
 private textures=new Map<SignatureFinish,THREE.Texture>();private current:SignatureFinish='blue-orange';private generation=0;private dead=false;
 constructor(private car:THREE.Object3D){
  car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const original=o.material;const mats=Array.isArray(original)?original:[original];let changed=false;
   const owned=mats.map(m=>{if(!(m instanceof THREE.MeshStandardMaterial))return m;
    let rearArm=false;for(let node:THREE.Object3D|null=o;node;node=node.parent)if(/^rear_arm_visual(?:__|$)/.test(node.name)){rearArm=true;break}
    const paint=/Radar_Blue/.test(m.name),accent=/Orange_Accent/.test(m.name)&&(/^body_static(?:__|$)/.test(o.name)||rearArm);if(!paint&&!accent)return m;
    changed=true;const c=m.clone();this.materials.push({material:c,map:m.map,color:m.color.clone(),roughness:m.roughness,node:o.name,role:paint?'paint':'accent'});return c;
   });if(changed){o.material=Array.isArray(original)?owned:owned[0];this.slots.push({mesh:o,original,owned:o.material})}
  });
 }
 async set(finish:SignatureFinish){
  if(!['blue-orange','black-red','white-graphite','graphite-red'].includes(finish))throw Error('Unknown finish');const ticket=++this.generation;
  let texture:THREE.Texture|undefined;
  if(finish!=='blue-orange'){
   texture=this.textures.get(finish);if(!texture){texture=await new THREE.TextureLoader().loadAsync(finish==='white-graphite'?'/assets/p08b/showroom-refinement/finish-white-graphite.png':'/assets/p08b/finish-'+finish+'.png');texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.anisotropy=4;if(this.dead){texture.dispose();return}const old=this.textures.get(finish);if(old){texture.dispose();texture=old}else this.textures.set(finish,texture)}
  }
  if(this.dead||ticket!==this.generation)return;this.current=finish;
  for(const s of this.materials){const m=s.material;if(finish==='blue-orange'){m.map=s.map;m.color.copy(s.color);m.roughness=s.roughness}else if(s.role==='paint'){m.map=texture!;m.color.set(0xffffff);m.roughness=finish==='graphite-red'?.44:finish==='white-graphite'?.24:.19}else{m.color.set(SIGNATURE_ACCENTS[finish]);m.map=null}m.needsUpdate=true}
 }
 inspect(){return{finish:this.current,accent:SIGNATURE_ACCENTS[this.current],paintedAccents:this.materials.filter(s=>s.role==='accent').map(s=>({node:s.node,color:s.material.color.getHexString()})),isolatedMaterialSlots:this.materials.length,mask:'Paint atlas and explicitly painted body/rear-arm accents only; rubber/seats/glass/lamps/metals/shock springs unchanged',textureCount:this.textures.size}}
 dispose(){if(this.dead)return;this.dead=true;this.generation++;for(const s of this.slots)s.mesh.material=s.original;for(const s of this.materials)s.material.dispose();this.textures.forEach(t=>t.dispose());this.textures.clear()}
}
/** Original separately editable catalog meshes are mounted in canonical vehicle coordinates. */
export class SignatureProducts {
 private stock:THREE.Object3D|undefined;private stockVisible=true;private selected=new Set<string>();private saved=new Map<THREE.Object3D,{visible:boolean;rotation:THREE.Euler}>();private root:THREE.Group;
 static async load(loader:GLTFLoader,car:THREE.Object3D){const gltf=await loader.loadAsync(SIGNATURE_PRODUCTS_URL);return new SignatureProducts(car,gltf.scene)}
 constructor(private car:THREE.Object3D,source:THREE.Group){this.root=source;source.name='signature_catalog_products';car.add(source);this.stock=car.getObjectByName('stock_exhaust');this.stockVisible=this.stock?.visible??true;source.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});this.set([])}
 set(ids:Iterable<string>){this.selected=new Set(ids);for(const id of ['SM-7720','SM-26801','SM-28919']){const part=this.root.getObjectByName('product_'+id);if(!part)throw Error('Missing authored product '+id);part.visible=this.selected.has(id)}if(this.stock)this.stock.visible=this.selected.has('SM-7720')?false:this.stockVisible;if(!this.selected.has('SM-28919'))this.inspectStorage(false)}
 inspectStorage(enabled:boolean){
  for(const[o,state]of this.saved){o.visible=state.visible;o.rotation.copy(state.rotation)}this.saved.clear();if(!enabled)return;
  for(const side of ['left','right']){const door=this.car.getObjectByName('signature_storage_door_'+side);if(door){this.saved.set(door,{visible:door.visible,rotation:door.rotation.clone()});door.rotation.x=-Math.PI*.43}}
  // Seats are the necessary covers in front of the behind-seat compartments. Keep body and mounts visible.
  for(const label of ['driver','passenger']){const seat=this.car.getObjectByName('signature_seat_'+label);if(seat){this.saved.set(seat,{visible:seat.visible,rotation:seat.rotation.clone()});seat.visible=false}}
 }
 inspect(){return{selected:[...this.selected],storageInspection:this.saved.size>0,inspectionMethod:'Only seats temporarily removed; original doors hinge open. Complete car visibility restored on exit.',mounts:SIGNATURE_MOUNT_VIEWS,productRoot:this.root.name}}
 dispose(){this.inspectStorage(false);if(this.stock)this.stock.visible=this.stockVisible;this.root.removeFromParent();disposeSignatureObject(this.root)}
}
export async function loadSignatureShowroom(loader=new GLTFLoader()){
 const gltf=await loader.loadAsync(SIGNATURE_SHOWROOM_URL);const room=gltf.scene;room.name='SlingMods_Signature_Showroom';room.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial){m.envMapIntensity=.55;for(const texture of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap])if(texture)texture.anisotropy=8}}});room.userData.signature={source:'assets/blender/p08b/showroom-refinement/signature-showroom-refined.blend',inferredDimensionsMetres:[12,4.2,13],noHarborDependency:true,sourcePhotos:9};return room;
}
export function disposeSignatureObject(root:THREE.Object3D){const g=new Set<THREE.BufferGeometry>(),m=new Set<THREE.Material>(),t=new Set<THREE.Texture>();root.traverse(o=>{if(o instanceof THREE.Mesh){g.add(o.geometry);for(const x of Array.isArray(o.material)?o.material:[o.material]){m.add(x);for(const y of Object.values(x))if(y instanceof THREE.Texture)t.add(y)}}});g.forEach(x=>x.dispose());m.forEach(x=>x.dispose());t.forEach(x=>x.dispose())}
