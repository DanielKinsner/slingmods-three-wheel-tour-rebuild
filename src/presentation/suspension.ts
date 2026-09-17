import * as THREE from 'three';
import type {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import layout from '../../public/assets/slingshot-contact-layout.json';
/** Separate replacement hardware; original car and rear presenter remain authoritative. */
export class SuspensionPresenter {
 private enabled=false;private root=new THREE.Group();private originals:THREE.Object3D[]=[];
 private shocks:{lower:THREE.Group;upper:THREE.Group;spring:THREE.Group}[]=[];
 private masks=new Map<THREE.Object3D,boolean>();private inspection:'front'|'rear'|null=null;
 private source:THREE.Group;private endpoints:number[][][]=[];
 static async load(loader:GLTFLoader,car:THREE.Object3D){const gltf=await loader.loadAsync('/assets/products/ddmworks-sm3223-silver.glb');return new SuspensionPresenter(car,gltf.scene)}
 constructor(private car:THREE.Object3D,source:THREE.Group){
  this.source=source;this.root.name='ddmworks_sm3223_installed';car.add(this.root);
  for(const name of ['suspension_front_left','suspension_front_right','shock_body_visual','shock_piston_visual','shock_spring_visual']){const o=car.getObjectByName(name);if(!o)throw Error('Missing stock suspension slot '+name);this.originals.push(o)}
  for(const side of ['left','right']){const c=source.getObjectByName('carrier_front_'+side);if(!c)throw Error('Missing suspension carrier');const carrier=c.clone(true);carrier.visible=!car.getObjectByName('josh_donor_foundation')&&!car.getObjectByName('model02_2026_foundation');this.root.add(carrier)}
  for(let i=0;i<3;i++){const parts={} as typeof this.shocks[number];for(const key of ['lower','upper','spring']as const){const group=new THREE.Group();const child=source.getObjectByName('ddm_'+key)!.clone(true);if(key==='spring')child.position.y-=.0855;group.add(child);this.root.add(group);parts[key]=group}this.shocks.push(parts)}
  this.root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});this.set(false);this.update();
 }
 set(value:boolean){this.enabled=value;this.root.visible=value;for(const o of this.originals)o.visible=!value;this.update()}
 inspectionView(side:'front'|'rear'|null){
  for(const [o,visible]of this.masks)o.visible=visible;this.masks.clear();this.inspection=side;if(!side)return;
  const index=side==='front'?0:2,allowed:THREE.Object3D[]=[...Object.values(this.shocks[index]),...this.originals.filter(o=>side==='front'?o.name==='suspension_front_left':o.name.startsWith('shock_'))];
  if(side==='front')allowed.push(this.root.getObjectByName('carrier_front_left')!);
  const belongs=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(allowed.includes(p))return true;return false};
  (this.car.parent??this.car).traverse(o=>{if(o instanceof THREE.Mesh&&!belongs(o)){this.masks.set(o,o.visible);o.visible=false}});
 }
 update(){if(!this.enabled)return;this.car.updateWorldMatrix(true,true);const inverse=this.car.matrixWorld.clone().invert(),point=(name:string)=>this.car.getObjectByName(name)!.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse);this.endpoints=[];
  for(let i=0;i<3;i++){let a:THREE.Vector3,b:THREE.Vector3;if(i===2){a=point('shock_lower');b=point('shock_upper')}else{const side=i===0?-1:1,node=point(i===0?'front_left_steer':'front_right_steer'),travel=node.y-layout.wheels[i].center[1];const authored=this.car.getObjectByName('vehicle_root')?.userData.frontShockMounts?.[i===0?'left':'right'];a=authored?new THREE.Vector3().fromArray(authored.lower):new THREE.Vector3(side*.76,.28,-1.3335);a.y+=travel;b=authored?new THREE.Vector3().fromArray(authored.upper):new THREE.Vector3(side*.48,.64,-1.31)}
   const delta=b.clone().sub(a),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize()),parts=this.shocks[i];
   for(const [key,group]of Object.entries(parts)){group.position.copy(key==='upper'?b.clone().addScaledVector(delta.clone().normalize(),-.45):key==='spring'?a.clone().addScaledVector(delta.clone().normalize(),.0855):a);group.quaternion.copy(q);group.scale.set(1,key==='spring'?(delta.length()-.1575)/.2925:1,1)}
   this.endpoints.push([a.toArray(),b.toArray()]);
  }
 }
 inspect(){return {equipped:this.enabled,inspection:this.inspection,stockVisible:this.originals.map(o=>({name:o.name,visible:o.visible})),endpoints:this.endpoints,model:'SM-3223 Silver (Standard), original approximation. Front carriers retained; rear vertical-raycast linkage approximation unchanged.'}}
 dispose(){this.inspectionView(null);this.set(false);this.root.removeFromParent();const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();this.source.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
}
