import * as THREE from 'three';
export type VehicleMaterialRole='paint'|'accent'|'decal'|'headlamp'|'running-brake'|'brake'|'clear-cover'|'passive-reflector'|'interior'|'rubber'|'metal';
export const materialRole=(m:THREE.Material)=>m.userData.vehicleRole as VehicleMaterialRole|undefined;
export const hasMaterialBindings=(car:THREE.Object3D)=>car.getObjectByName('vehicle_root')?.userData.materialBindingsVersion===1||!!car.getObjectByName('spyder_foundation');
/** Source decal accent pixels only; white legends and original alpha stay intact. */
/** Preserve repeated native UVs and sampling without sharing mutable image data. */
export function decalTexture(source:THREE.Texture,canvas:HTMLCanvasElement){const map:THREE.Texture=new THREE.CanvasTexture(canvas),pixels=map.source;map.copy(source);map.source=pixels;map.needsUpdate=true;return map}
export function rivalDecal(source:THREE.Texture,color:string){
 const canvas=document.createElement('canvas'),im=source.image as HTMLImageElement;canvas.width=im.width;canvas.height=im.height;const c=canvas.getContext('2d')!;c.drawImage(im,0,0);const data=c.getImageData(0,0,canvas.width,canvas.height),tint=new THREE.Color(color).getHex();const rgb=[tint>>16&255,tint>>8&255,tint&255];
 for(let i=0;i<data.data.length;i+=4){const [r,g,b]=data.data.subarray(i,i+3);if(r>50&&r>g*1.45&&r>b*1.35)for(let j=0;j<3;j++)data.data[i+j]=Math.min(255,Math.round(rgb[j]*r/240))}
 c.putImageData(data,0,0);return decalTexture(source,canvas);
}
export function recolorRivalMaterial(m:THREE.MeshStandardMaterial,paint:string,accent:string,semantic:boolean){
 const role=materialRole(m);
 if(semantic){if(role==='paint')m.color.set(paint);if(role==='accent')m.color.set(accent);if(role==='decal'&&m.map){m.map=rivalDecal(m.map,accent);m.color.set(0xffffff);return m.map}}
 else{if(/Radar_Blue|paint/i.test(m.name)){m.color.set(paint);m.map=null}if(/helmet|textile|accent/i.test(m.name))m.color.set(accent);if(/lamp|lens|light/i.test(m.name)){m.emissive.set('#ffd7a0');m.emissiveIntensity=.7}}
 return undefined;
}
/** Clear covers and passive reflectors are excluded from illumination bindings. */
export class VehicleOptics {
 private slots:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[]}[]=[];private owned:THREE.Material[]=[];
 private emitters:{material:THREE.MeshStandardMaterial;role:'headlamp'|'running-brake'|'brake'}[]=[];
 constructor(car:THREE.Object3D,private night=false){
  const semantic=hasMaterialBindings(car);
  car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;let changed=false;const original=o.material,mats=(Array.isArray(original)?original:[original]).map(m=>{const role=semantic?materialRole(m):o.name.startsWith('lights_head__Optical_Lens')?'headlamp':o.name.startsWith('lights_brake__Tail_Lens')?'running-brake':undefined;if(!(m instanceof THREE.MeshStandardMaterial)||!['headlamp','running-brake','brake'].includes(role??''))return m;const copy=m.clone();copy.emissive.set(role==='headlamp'?0xdcefff:0xff1808);changed=true;this.owned.push(copy);this.emitters.push({material:copy,role:role as 'headlamp'|'running-brake'|'brake'});return copy});if(changed){this.slots.push({mesh:o,original});o.material=Array.isArray(original)?mats:mats[0]}});
  this.update(0);
 }
 update(brake:number,power=true){for(const e of this.emitters)e.material.emissiveIntensity=!power?0:e.role==='headlamp'?(this.night?2.6:.1):brake>.03?3.5:e.role==='brake'?0:this.night?.55:.15}
 inspect(){return{brakeEmission:this.emitters.filter(e=>e.role!=='headlamp').map(e=>e.material.emissiveIntensity),roles:this.emitters.map(e=>e.role)}}
 dispose(){for(const s of this.slots)s.mesh.material=s.original;this.owned.forEach(m=>m.dispose());this.slots=[];this.owned=[]}
}
