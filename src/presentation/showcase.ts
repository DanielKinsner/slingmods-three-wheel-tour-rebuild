import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Placement={module:string;position:[number,number,number];yaw:number;scale:number|[number,number,number];district:string};
type Layout={version:string;routeSHA256:string;spatialChunkMetres:number;instances:Placement[];districts:{id:string;distance:number[]}[];garage:unknown};
type Piece={geometry:THREE.BufferGeometry;material:THREE.Material;name:string};
const prefix='/assets/showcase/';

/** Reuses Blender-authored modules inside bounded spatial instance cells. No physics mutation. */
export async function loadShowcaseHarbor(scene:THREE.Scene,legacyHarbor:THREE.Object3D,preset:'day'|'night',stage:'sample'|'full'='full'){
 const loader=new GLTFLoader();
 const [kit,foundation,layout]=await Promise.all([loader.loadAsync(prefix+'kit.glb'),loader.loadAsync(prefix+'foundation.glb'),fetch(prefix+'scene-layout.json').then(r=>r.json() as Promise<Layout>)]);
 const root=new THREE.Group();root.name='P06_Harbor_Showcase';scene.add(root);root.add(foundation.scene);
 // Remove superseded batches from preparation traversal, not just drawing: otherwise the
 // loading prewarm would upload all hidden legacy textures in addition to the new scene.
 const previousVisible=legacyHarbor.visible,previousParent=legacyHarbor.parent;legacyHarbor.visible=false;legacyHarbor.removeFromParent();
 const library=readLibrary(kit.scene,preset),instances:THREE.InstancedMesh[]=[];
 library.get('bay')?.forEach(p=>p.geometry.dispose());library.delete('bay');
 const batches=new Map<string,Placement[]>();
 const use=layout.instances.filter(p=>stage==='full'||['terminal','water','horizon'].includes(p.district)||(p.district==='marina'&&p.position[2]>-165));
 for(const p of use){const key=[p.module,Math.floor(p.position[0]/layout.spatialChunkMetres),Math.floor(p.position[2]/layout.spatialChunkMetres)].join(':');const list=batches.get(key)??[];list.push(p);batches.set(key,list)}
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
 for(const [key,placements]of batches){
  for(const piece of library.get(placements[0].module)??[]){
   const mesh=new THREE.InstancedMesh(piece.geometry,piece.material,placements.length);mesh.name='showcase_chunk_'+key+'__'+piece.name;
   mesh.receiveShadow=placements[0].module!=='water';mesh.castShadow=['terminal','warehouse','pavilion','gantry'].includes(placements[0].module);mesh.frustumCulled=true;
   placements.forEach((p,i)=>{position.fromArray(p.position);rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);if(Array.isArray(p.scale))scale.fromArray(p.scale);else scale.setScalar(p.scale);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix)});
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.userData.module=placements[0].module;root.add(mesh);instances.push(mesh);
  }
 }
 foundation.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){const m=material as THREE.MeshStandardMaterial;if(m.map)m.map.anisotropy=4;if(m.normalMap)m.normalMap.anisotropy=4}}});
 let foundationTriangles=0;foundation.scene.traverse(o=>{if(o instanceof THREE.Mesh)foundationTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});
 const instancedTrianglesAllPlacements=instances.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3*m.count,0);
 const waterMaterials=[...new Set([...library.values()].flat().map(p=>p.material))].filter(m=>m.name==='Showcase_Moving_Water') as THREE.MeshStandardMaterial[];
 let cameraDistance=0;
 return{
  root,
  update(cameraPosition:THREE.Vector3,timeSeconds:number){cameraDistance=cameraPosition.length();waterMaterials.forEach(m=>{if(m.normalMap)m.normalMap.offset.set((timeSeconds*.006)%1,(timeSeconds*.003)%1)})},
  inspect:()=>({version:layout.version,stage,routeSHA256:layout.routeSHA256,districts:layout.districts,placementCount:use.length,instanceGroups:instances.length,foundationTriangles,instancedTrianglesAllPlacements,totalAuthoredSceneTriangles:foundationTriangles+instancedTrianglesAllPlacements,triangleCensusMethod:'All placed source triangles including instance multiplicity; actual culled and shadow-pass submission measured separately with renderer.info',spatialChunkMetres:layout.spatialChunkMetres,culledBy:'per-cell InstancedMesh computed sphere and frustum; no whole-harbor instance bounds',geometryLOD:'No popping LOD. Low-poly source modules; distant shore coarse authored geometry.',groups:instances.map(m=>({name:m.name,count:m.count,bounds:m.boundingSphere?{center:m.boundingSphere.center.toArray(),radius:m.boundingSphere.radius}:null,trianglesPerInstance:(m.geometry.index?.count??m.geometry.attributes.position.count)/3,castsShadow:m.castShadow})),cameraDistance,water:{animatedNormal:true,repeatMetres:12,reflection:'existing single environment map; no scene reflection pass'},source:'assets/blender/showcase/showcase-kit.blend',foundation:'Exact retained source subset; see foundation-preservation.json'}),
  dispose(){legacyHarbor.visible=previousVisible;if(previousParent)previousParent.add(legacyHarbor);scene.remove(root);disposeLibrary(library);disposeObject(foundation.scene);instances.forEach(m=>m.dispose())},
 };
}

/** Bay mesh uses established vehicle origin and permits the same inspection orbit. */
export async function loadShowcaseBay(loader=new GLTFLoader()){
 const kit=await loader.loadAsync(prefix+'kit.glb');const library=readLibrary(kit.scene,'day');const root=new THREE.Group();root.name='Showcase_Compact_Garage';
 for(const [name,pieces]of library)if(name!=='bay')pieces.forEach(p=>p.geometry.dispose());
 for(const p of library.get('bay')??[]){const mesh=new THREE.Mesh(p.geometry,p.material);mesh.name='showcase_bay_'+p.name;mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh)}
 root.userData.showcase={vehicleOrigin:[0,0,0],floorTop:0,ceilingHeight:3.845,neutralInspectionPreserved:true};return root;
}

function readLibrary(source:THREE.Object3D,preset:'day'|'night'){
 source.updateMatrixWorld(true);const grouped=new Map<string,Map<THREE.Material,THREE.BufferGeometry[]>>();
 source.traverse(o=>{if(!(o instanceof THREE.Mesh)||!o.name.startsWith('kit_'))return;const module=o.name.slice(4).split('__')[0];const materials=Array.isArray(o.material)?o.material:[o.material];
  // The Blender exporter uses one material per named primitive; reject accidental multi-material authoring.
  if(materials.length!==1)throw new Error('Showcase module requires one material per export primitive: '+o.name);
  const material=materials[0] as THREE.MeshStandardMaterial;
  if(material.name==='Showcase_Practical_Atlas')material.emissiveIntensity=preset==='night'?1.1:.12;
  if(material.name==='Showcase_Moving_Water')material.envMapIntensity=.22;
  if(material.normalMap){material.normalMap.wrapS=THREE.RepeatWrapping;material.normalMap.wrapT=THREE.RepeatWrapping}
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);o.geometry.dispose();const byMaterial=grouped.get(module)??new Map<THREE.Material,THREE.BufferGeometry[]>();const list=byMaterial.get(material)??[];list.push(geometry);byMaterial.set(material,list);grouped.set(module,byMaterial);
 });
 const library=new Map<string,Piece[]>();
 for(const [module,byMaterial]of grouped){const pieces:Piece[]=[];for(const [material,geometries]of byMaterial){const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);if(!geometry)throw new Error('Showcase compatible module geometry required');geometry.computeBoundingBox();geometry.computeBoundingSphere();pieces.push({geometry,material,name:material.name})}library.set(module,pieces)}
 return library;
}
function disposeLibrary(library:Map<string,Piece[]>){const materials=new Set<THREE.Material>();const textures=new Set<THREE.Texture>();for(const p of [...library.values()].flat()){p.geometry.dispose();materials.add(p.material)}for(const m of materials){for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);m.dispose()}textures.forEach(t=>t.dispose())}
function disposeObject(root:THREE.Object3D){const materials=new Set<THREE.Material>();const textures=new Set<THREE.Texture>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});for(const m of materials){for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);m.dispose()}textures.forEach(t=>t.dispose())}
