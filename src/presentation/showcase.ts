import * as THREE from 'three';
import {loadBranding} from './branding';
import {createHarborWater,createBoatBob,harborWaterGeometry,type HarborWaterOptions} from './harbor-water';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Placement={module:string;position:[number,number,number];yaw:number;scale:number|[number,number,number];district:string};
type Layout={version:string;routeSHA256:string;spatialChunkMetres:number;instances:Placement[];districts:{id:string;distance:number[]}[];garage:unknown;lod?:{distancesMetres:number[];[module:string]:string[]|number[]}};
type Piece={geometry:THREE.BufferGeometry;material:THREE.Material;name:string};
const prefix='/assets/showcase-quality/';

/**
 * Groups placements into instanced batches by module and spatial cell. Cells exist for culling, but at the authored 45 m
 * almost every cell held ONE placement, so instancing batched nothing and the harbor cost ~420 draw calls for 245k
 * triangles. Palms keep 90 m cells because their LOD is chosen per cell; everything else is cheap enough that 180 m cells
 * cost fewer calls than they add triangles.
 */
export function batchPlacements<P extends{module:string;position:number[]}>(layout:{spatialChunkMetres:number;lod?:Record<string,unknown>},placements:P[]){
 const batches=new Map<string,P[]>();
 for(const p of placements){const cell=layout.spatialChunkMetres*(Array.isArray(layout.lod?.[p.module])?2:4),key=[p.module,Math.floor(p.position[0]/cell),Math.floor(p.position[2]/cell)].join(':');const list=batches.get(key)??[];list.push(p);batches.set(key,list)}
 return batches;
}
/** Reuses Blender-authored modules inside bounded spatial instance cells. No physics mutation. */
export async function loadShowcaseHarbor(scene:THREE.Scene,legacyHarbor:THREE.Object3D,preset:'day'|'night',stage:'sample'|'full'='full',water:HarborWaterOptions={}){
 const loader=new GLTFLoader();
 const [kit,foundation,layout,branding]=await Promise.all([loadBoundAsset(loader,prefix+'kit.glb'),loadBoundAsset(loader,prefix+'foundation.glb'),fetch(prefix+'scene-layout.json').then(r=>{if(!r.ok)throw Error('Environment layout unavailable');return r.json() as Promise<Layout>}),loadBranding('harbor',loader)]);
 const root=new THREE.Group();root.name='Harbor_'+layout.version;scene.add(root);root.add(foundation.scene,branding);
 // Remove superseded batches from preparation traversal, not just drawing: otherwise the
 // loading prewarm would upload all hidden legacy textures in addition to the new scene.
 const previousVisible=legacyHarbor.visible,previousParent=legacyHarbor.parent;legacyHarbor.visible=false;legacyHarbor.removeFromParent();
 shareIdenticalMaterials([foundation.scene,kit.scene]);
 const library=readLibrary(kit.scene,preset),instances:THREE.InstancedMesh[]=[];
 // The authored water is one quad; the swell needs vertices, so the visible basin becomes a 2 m grid (Medium and up).
 if(water.swell!==false&&water.motion!==false)for(const piece of library.get('water')??[]){const quad=piece.geometry;piece.geometry=harborWaterGeometry(quad);quad.dispose()}
 const bayPieces=library.get('bay')??[];library.delete('bay');disposePieces(bayPieces,[...library.values()].flat(),foundation.scene);
 const use=layout.instances.filter(p=>stage==='full'||['terminal','water','horizon'].includes(p.district)||(p.district==='marina'&&p.position[2]>-165));
 const batches=batchPlacements(layout,use);
 const lodGroups=new Map<string,{sphere:THREE.Sphere;meshes:THREE.InstancedMesh[]}>();
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
 for(const [key,placements]of batches){
  const variants=(layout.lod?.[placements[0].module] as string[]|undefined)??[placements[0].module];const groupMeshes:THREE.InstancedMesh[]=[];
  for(const [level,variant]of variants.entries())for(const piece of library.get(variant)??[]){
   const mesh=new THREE.InstancedMesh(piece.geometry,piece.material,placements.length);mesh.name='showcase_chunk_'+key+'__lod'+level+'__'+piece.name;
   mesh.receiveShadow=placements[0].module!=='water';mesh.castShadow=(['terminal','warehouse','pavilion','gantry'].includes(placements[0].module)||placements[0].module.startsWith('palm')||placements[0].module.startsWith('waterfrontHall'))&&level===0;mesh.frustumCulled=true;
   placements.forEach((p,i)=>{position.fromArray(p.position);rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);if(Array.isArray(p.scale))scale.fromArray(p.scale);else scale.setScalar(p.scale);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix)});
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.userData.module=placements[0].module;mesh.userData.lodLevel=level;mesh.userData.lodCount=variants.length;mesh.userData.prewarmLOD=variants.length>1;root.add(mesh);instances.push(mesh);groupMeshes.push(mesh);
  }
  if(variants.length>1){const union=new THREE.Box3();for(const mesh of groupMeshes)if(mesh.boundingBox)union.union(mesh.boundingBox);lodGroups.set(key,{sphere:union.getBoundingSphere(new THREE.Sphere()),meshes:groupMeshes})}
 }
 foundation.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){const m=material as THREE.MeshStandardMaterial;if(m.map)m.map.anisotropy=4;if(m.normalMap)m.normalMap.anisotropy=4}}});
 let foundationTriangles=0;foundation.scene.traverse(o=>{if(o instanceof THREE.Mesh)foundationTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});
 const instancedTrianglesAllPlacements=instances.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3*m.count,0);
 const waterMaterials=[...new Set([...library.values()].flat().map(p=>p.material))].filter(m=>m.name==='Showcase_Moving_Water') as THREE.MeshStandardMaterial[];
 // Lit windows on the far bank streak in the water at night with the road lamps: one warm point per shore building.
 const shoreLights=use.filter(p=>p.module.startsWith('shore')&&p.module!=='shoreland').map(p=>{const s=Array.isArray(p.scale)?p.scale[0]:p.scale,offset=new THREE.Vector3(0,4.2*s,7.6*s).applyAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);return{position:[p.position[0]+offset.x,p.position[1]+offset.y,p.position[2]+offset.z],color:[1,.86,.62]}});
 const harborWater=createHarborWater(waterMaterials,{...water,lamps:[...(water.lamps??[]),...shoreLights]});
 // Boats in the water bob (harbor-water.ts); cradled skiffs stay put. Off under reduced motion, with the swell.
 const bob=createBoatBob(water.motion!==false&&water.swell!==false?instances.filter(m=>m.userData.module==='skiff'):[]);
 const actualMaterials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])actualMaterials.add(m)});
 const materialBindings=[...actualMaterials].map(m=>{const p=m as THREE.MeshStandardMaterial;return{name:m.name,packedImageBindings:m.userData.p06bImageBindings,materialSource:m.userData.p06bMaterialBinding,basecolor:p.map?.name??null,normal:p.normalMap?.name??null,roughness:p.roughnessMap?.name??null,occlusion:p.aoMap?.name??null,normalScale:p.normalScale?.toArray(),colorSpace:p.map?.colorSpace,side:m.side,alphaTest:m.alphaTest,transparent:m.transparent,depthWrite:m.depthWrite}});
 let cameraDistance=0;
 return{
  root,
  update(cameraPosition:THREE.Vector3,timeSeconds:number){cameraDistance=cameraPosition.length();for(const group of lodGroups.values()){const distance=Math.max(0,cameraPosition.distanceTo(group.sphere.center)-group.sphere.radius);const thresholds=layout.lod?.distancesMetres??[45,100];const level=distance<thresholds[0]?0:distance<thresholds[1]?1:2;for(const mesh of group.meshes)mesh.visible=mesh.userData.lodLevel===level}harborWater.update(timeSeconds,cameraPosition);bob.update(timeSeconds)},
  inspect:()=>({version:layout.version,stage,materialBindings,routeSHA256:layout.routeSHA256,districts:layout.districts,placementCount:use.length,instanceGroups:instances.length,foundationTriangles,instancedTrianglesAllPlacements,totalAuthoredSceneTriangles:foundationTriangles+instancedTrianglesAllPlacements,triangleCensusMethod:'All placed source triangles including instance multiplicity; actual culled and shadow-pass submission measured separately with renderer.info',spatialChunkMetres:layout.spatialChunkMetres,culledBy:'per-cell InstancedMesh computed sphere and frustum; no whole-harbor instance bounds',geometryLOD:{cells:[...lodGroups.entries()].map(([key,g])=>({key,center:g.sphere.center.toArray(),radius:g.sphere.radius})),method:'Authored near/mid/far palm geometry, same root and crown envelopes, selected per spatial cell at nearest bound distance',thresholdsMetres:layout.lod?.distancesMetres??[],preparation:'All LOD buffers and material variants prepared behind loading veil'},groups:instances.map(m=>({name:m.name,count:m.count,bounds:m.boundingSphere?{center:m.boundingSphere.center.toArray(),radius:m.boundingSphere.radius}:null,trianglesPerInstance:(m.geometry.index?.count??m.geometry.attributes.position.count)/3,castsShadow:m.castShadow,lod:m.userData.lodLevel,visible:m.visible})),cameraDistance,water:{...harborWater.inspect(),bobbingBoatParts:bob.count},source:layout.version.startsWith('P06C')?'assets/blender/showcase-quality/built-waterfront.blend':'assets/blender/showcase-quality/quality-kit.blend',foundation:layout.version.startsWith('P06C')?'Presentation-only replacement; exact physical source checks in P06C/source-clearance.json':'Presentation-only replacement; protected physical route/colliders recorded separately in P06B/preservation-final.json'}),
  dispose(){legacyHarbor.visible=previousVisible;if(previousParent)previousParent.add(legacyHarbor);scene.remove(root);harborWater.dispose();disposeLibrary(library,root);instances.forEach(m=>m.dispose())},
 };
}

/** Bay mesh uses established vehicle origin and permits the same inspection orbit. */
export async function loadShowcaseBay(loader=new GLTFLoader()){
 const [kit,branding]=await Promise.all([loadBoundAsset(loader,prefix+'bay.glb'),loadBranding('bay',loader)]);const library=readLibrary(kit.scene,'day');const root=new THREE.Group();root.name='Showcase_Compact_Garage';root.add(branding);
 disposePieces([...library.entries()].filter(([name])=>name!=='bay').flatMap(([,pieces])=>pieces),library.get('bay')??[]);
 for(const p of library.get('bay')??[]){const mesh=new THREE.Mesh(p.geometry,p.material);mesh.name='showcase_bay_'+p.name;mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh)}
 root.userData.showcase={vehicleOrigin:[0,0,0],floorTop:0,ceilingHeight:3.845,neutralInspectionPreserved:true};return root;
}

const disposedBays=new WeakSet<THREE.Object3D>();
/** This room owns its cloned module geometry/materials after discarded kit pieces are pruned. */
export function disposeShowcaseBay(root:THREE.Object3D){
 if(disposedBays.has(root))return;
 disposedBays.add(root);root.removeFromParent();disposeLibrary(new Map(),root);
}

function readLibrary(source:THREE.Object3D,preset:'day'|'night'){
 source.updateMatrixWorld(true);const grouped=new Map<string,Map<THREE.Material,THREE.BufferGeometry[]>>();
 source.traverse(o=>{if(!(o instanceof THREE.Mesh)||!o.name.startsWith('kit_'))return;const module=o.name.slice(4).split('__')[0];const materials=Array.isArray(o.material)?o.material:[o.material];
  // The Blender exporter uses one material per named primitive; reject accidental multi-material authoring.
  if(materials.length!==1)throw new Error('Showcase module requires one material per export primitive: '+o.name);
  // These two isolated meshes are the old typed wordmarks, replaced by the actual approved artwork.
  if(['kit_bay__Quality_Painted_White','kit_gantry__Quality_Painted_White'].includes(o.name)){o.geometry.dispose();return}
  const material=materials[0] as THREE.MeshStandardMaterial;
  if(material.name==='Showcase_Practical_Atlas')material.emissiveIntensity=preset==='night'?1.1:.12;
  if(material.name==='Showcase_Moving_Water')material.envMapIntensity=.75;
  if(material.normalMap){material.normalMap.wrapS=THREE.RepeatWrapping;material.normalMap.wrapT=THREE.RepeatWrapping}
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);o.geometry.dispose();const byMaterial=grouped.get(module)??new Map<THREE.Material,THREE.BufferGeometry[]>();const list=byMaterial.get(material)??[];list.push(geometry);byMaterial.set(material,list);grouped.set(module,byMaterial);
 });
 const library=new Map<string,Piece[]>();
 for(const [module,byMaterial]of grouped){const pieces:Piece[]=[];for(const [material,geometries]of byMaterial){const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);if(geometries.length>1)geometries.forEach(g=>g.dispose());if(!geometry)throw new Error('Showcase compatible module geometry required');geometry.computeBoundingBox();geometry.computeBoundingSphere();pieces.push({geometry,material,name:material.name})}library.set(module,pieces)}
 return library;
}
function objectResources(root?:THREE.Object3D){const materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>();root?.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});return{materials,geometries}}
function disposePieces(discard:Piece[],retain:Piece[]=[],retainedObject?:THREE.Object3D){
 const kept=objectResources(retainedObject);for(const p of retain){kept.materials.add(p.material);kept.geometries.add(p.geometry)}
 const keptTextures=new Set<THREE.Texture>();for(const m of kept.materials)for(const v of Object.values(m))if(v instanceof THREE.Texture)keptTextures.add(v);
 const materials=new Set(discard.map(p=>p.material)),geometries=new Set(discard.map(p=>p.geometry)),textures=new Set<THREE.Texture>();
 for(const g of geometries)if(!kept.geometries.has(g))g.dispose();for(const m of materials)if(!kept.materials.has(m)){for(const v of Object.values(m))if(v instanceof THREE.Texture&&!keptTextures.has(v))textures.add(v);m.dispose()}for(const t of textures)t.dispose();
}
function disposeLibrary(library:Map<string,Piece[]>,extra?:THREE.Object3D){const resources=objectResources(extra);for(const p of [...library.values()].flat()){resources.geometries.add(p.geometry);resources.materials.add(p.material)}const textures=new Set<THREE.Texture>();for(const g of resources.geometries)g.dispose();for(const m of resources.materials){for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);m.dispose()}textures.forEach(t=>t.dispose())}

/** Hash the actual embedded image bytes, not labels, before sharing between exports. */
async function loadBoundAsset(loader:GLTFLoader,url:string){
 const response=await fetch(url);if(!response.ok)throw Error('Environment asset failed '+url+': '+response.status);const bytes=await response.arrayBuffer(),view=new DataView(bytes);let json:any,binOffset=0;
 for(let offset=12;offset<bytes.byteLength;){const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,offset+8,length)));if(type===0x004e4942)binOffset=offset+8;offset+=8+length}
 const imageHashes=await Promise.all((json.images??[]).map(async(image:any)=>{if(image.bufferView===undefined)throw Error('Packed environment image required');const b=json.bufferViews[image.bufferView],raw=bytes.slice(binOffset+(b.byteOffset??0),binOffset+(b.byteOffset??0)+b.byteLength);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(v=>v.toString(16).padStart(2,'0')).join('')}));
 const result=await loader.parseAsync(bytes,url.slice(0,url.lastIndexOf('/')+1));
 result.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){const association=result.parser.associations.get(material),source=json.materials[association?.materials??-1];if(!source)throw Error('Material source binding missing');const bindings=[source.pbrMetallicRoughness?.baseColorTexture,source.pbrMetallicRoughness?.metallicRoughnessTexture,source.normalTexture,source.occlusionTexture,source.emissiveTexture].map(t=>t?{sha256:imageHashes[json.textures[t.index].source],texCoord:t.texCoord??0,extensions:t.extensions??null}:null);material.userData.p06bImageBindings=bindings;const normalize=(value:any,key=''):any=>{if(value===null||typeof value!=='object')return value;if(Array.isArray(value))return value.map(v=>normalize(v));return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='index'&&key.endsWith('Texture')?{image:imageHashes[json.textures[v as number].source],sampler:json.samplers?.[json.textures[v as number].sampler]??{}}:normalize(v,k)]))};material.userData.p06bMaterialBinding=normalize(source)}});
 return result;
}
/** Both GLBs may reference the same authored PBR material. Share only equal bindings. */
function shareIdenticalMaterials(roots:THREE.Object3D[]){
 const materials=new Map<string,THREE.Material>();const discarded=new Set<THREE.Material>();
 const signature=(m:THREE.Material)=>JSON.stringify([m.type,m.userData.p06bMaterialBinding]);
 for(const root of roots)root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const replace=(m:THREE.Material)=>{const key=signature(m),existing=materials.get(key);if(existing){if(existing!==m)discarded.add(m);return existing}materials.set(key,m);return m};o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material)});
 const retainedTextures=new Set<THREE.Texture>();for(const m of materials.values())for(const v of Object.values(m))if(v instanceof THREE.Texture)retainedTextures.add(v);
 for(const m of discarded){for(const v of Object.values(m))if(v instanceof THREE.Texture&&!retainedTextures.has(v))v.dispose();m.dispose()}
}
