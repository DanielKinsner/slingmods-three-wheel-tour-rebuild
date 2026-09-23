import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/**
 * Joins the parts of a vehicle that can never move relative to each other and look the same, so a rival costs a fraction
 * of the draw calls. The 2026 car is 224 parts in 132 materials, of which 53 are actually different; a race draws four of
 * them, twice (view + sun shadow). Used on a private copy for rivals only: the player's car and the showroom keep every
 * part, because products, mirrors and the workbench address parts individually.
 *
 * A part is left alone when anything might treat it individually: it is `dynamic` (addressed by the rig), has children,
 * is skinned/instanced/morphed, has several materials, is hidden, or is transparent (three sorts transparent parts per
 * object, so joining them would change how glass layers). Everything else is grouped by the nearest dynamic ancestor
 * (its rigid body), by material look, by vertex layout and by shadow flags, and baked into that ancestor's space.
 */
export interface MergeReport {partsBefore:number;partsAfter:number;joined:number;groups:number;left:{dynamic:number;transparent:number;other:number}}
const PAINTED=new Set(['paint','accent']);
// Never JSON.stringify a material extension directly: Texture.toJSON serializes its image, including a synchronous
// canvas PNG encode. The vehicle micro-surface extension holds six textures and used to repeat that for every part.
// Resource identity is sufficient for equality; exact scalar values avoid merging subtly different finishes.
function renderValue(value:unknown):string {
 if(value instanceof THREE.Texture)return 'texture:'+value.uuid;
 if(value instanceof THREE.Color)return 'color:'+value.r+','+value.g+','+value.b;
 if(value instanceof THREE.Vector2||value instanceof THREE.Vector3||value instanceof THREE.Vector4)return value.toArray().join(',');
 if(value instanceof THREE.Matrix3||value instanceof THREE.Matrix4)return value.elements.join(',');
 if(Array.isArray(value))return '['+value.map(renderValue).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+renderValue((value as Record<string,unknown>)[k])).join(',')+'}';
 return JSON.stringify(value)??String(value);
}
/** Two materials with the same signature render identically. Paint and accent ignore colour: a rival repaints them by role. */
export function materialSignature(material:THREE.Material){
 const parts:string[]=[material.type,material.customProgramCacheKey()],role=material.userData.vehicleRole as string|undefined;
 for(const key of Object.keys(material).sort()){if(key==='uuid'||key==='name'||key==='version'||key==='userData'||key[0]==='_'||key==='color'&&PAINTED.has(role??''))continue;
  const value=(material as unknown as Record<string,unknown>)[key];
  if(value===null||typeof value==='number'||typeof value==='string'||typeof value==='boolean')parts.push(key+'='+value);
  else if(typeof value==='function'||value===undefined)continue;else parts.push(key+'='+renderValue(value))}
 return parts.join(';')+';userData='+renderValue(material.userData);
}
const layout=(g:THREE.BufferGeometry)=>Object.keys(g.attributes).sort().map(k=>{const a=g.attributes[k] as THREE.BufferAttribute;return k+':'+a.itemSize+':'+a.array.constructor.name+':'+a.normalized}).join(',')+(g.index?'|indexed':'');
function bake(source:THREE.BufferGeometry,matrix:THREE.Matrix4){
 const g=source.clone();g.applyMatrix4(matrix);
 // A mirrored part (negative scale) is drawn with its winding flipped by the renderer; once baked, flip it for real.
 if(matrix.determinant()<0){if(g.index){const a=g.index.array;for(let i=0;i+2<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t}}else for(const name of Object.keys(g.attributes)){const at=g.attributes[name] as THREE.BufferAttribute,n=at.itemSize,a=at.array;for(let i=0;i+2<at.count;i+=3)for(let c=0;c<n;c++){const t=a[(i+1)*n+c];a[(i+1)*n+c]=a[(i+2)*n+c];a[(i+2)*n+c]=t}}}
 return g;
}
export function mergeRigidParts(car:THREE.Object3D,dynamic:(node:THREE.Object3D)=>boolean,smallMetres=.15){
 car.updateWorldMatrix(true,true);const groups=new Map<string,{root:THREE.Object3D;members:THREE.Mesh[];small:boolean}>(),report:MergeReport={partsBefore:0,partsAfter:0,joined:0,groups:0,left:{dynamic:0,transparent:0,other:0}},owned:THREE.BufferGeometry[]=[];
 car.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;report.partsBefore++;
  if(dynamic(o)){report.left.dynamic++;return}
  let shown=true;for(let p:THREE.Object3D|null=o;p&&shown;p=p===car?null:p.parent)shown=p.visible;
  const material=mesh.material;if(Array.isArray(material)||o.children.length||!shown||(o as THREE.SkinnedMesh).isSkinnedMesh||(o as THREE.InstancedMesh).isInstancedMesh||Object.keys(mesh.geometry.morphAttributes).length){report.left.other++;return}
  if(material.transparent){report.left.transparent++;return}
  let root:THREE.Object3D=car;for(let p=o.parent;p&&p!==car;p=p.parent)if(dynamic(p)){root=p;break}
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();const small=2*mesh.geometry.boundingSphere!.radius*o.matrixWorld.getMaxScaleOnAxis()<smallMetres;
  const key=[root.uuid,materialSignature(material),layout(mesh.geometry),o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask,o.frustumCulled,small].join('|'),group=groups.get(key)??{root,members:[],small};group.members.push(mesh);groups.set(key,group)});
 const inverse=new THREE.Matrix4(),local=new THREE.Matrix4();
 for(const {root,members,small} of groups.values()){if(members.length<2)continue;
  inverse.copy(root.matrixWorld).invert();const baked=members.map(m=>bake(m.geometry,local.multiplyMatrices(inverse,m.matrixWorld))),geometry=mergeGeometries(baked,false);baked.forEach(g=>g.dispose());if(!geometry)continue;
  const first=members[0],merged=new THREE.Mesh(geometry,first.material);merged.name='merged__'+(root===car?'body':root.name)+'__'+(first.material as THREE.Material).name;merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;merged.renderOrder=first.renderOrder;merged.layers.mask=first.layers.mask;merged.frustumCulled=first.frustumCulled;
  // Parts too small for the sun shadow map to resolve stay together, so a drive can still stop them casting (shadows.ts).
  merged.userData.mergedParts=members.length;merged.userData.subTexelParts=small;root.add(merged);for(const m of members)m.removeFromParent();owned.push(geometry);report.joined+=members.length;report.groups++}
 car.traverse(o=>{if((o as THREE.Mesh).isMesh)report.partsAfter++});
 return{report,dispose(){owned.forEach(g=>g.dispose())}};
}
