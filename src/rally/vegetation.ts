import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadKTX2} from '../presentation/ktx2';
import {sceneryGeometryURL} from '../presentation/p11-assets';
import {disposeGraph} from '../presentation/scene-lifetime';
import {forestCardGeometry} from '../ridge/forest';
import {RALLY_ROUTE,rallyPoint} from './route';
import {projectRoad,type CourseBox} from '../course/environment';

/** Reuses the licensed P11 broadleaf trees and understory alongside the new authored pine/rock kit. */
export async function loadRallyVegetation(renderer:THREE.WebGLRenderer,ground:(x:number,z:number)=>number){
  const root=new THREE.Group();root.name='Rally_understory';const textures:THREE.Texture[]=[],sources:THREE.Group[]=[],batches:{mesh:THREE.InstancedMesh;species:number;lod:number}[]=[],loader=new GLTFLoader();
  const trees:{x:number;y:number;z:number;scale:number;yaw:number;species:number}[]=[],cover:typeof trees=[],crowns=[new THREE.Box3(),new THREE.Box3()];
  let seed=91823;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let s=0;s<RALLY_ROUTE.length;s+=4){for(const side of [-1,1]){
    const offset=side*(16+random()*15),p=rallyPoint(s,offset);if(projectRoad(RALLY_ROUTE,p.x,p.z).distance<15)continue;
    cover.push({...p,scale:.6+random()*1.1,yaw:random()*6.28,species:0});
    if(random()<.20)trees.push({...p,scale:.55+random()*.5,yaw:random()*6.28,species:random()>.5?1:0});
  }}
  for(let i=0;i<180;i++){const x=-100+random()*820,z=-550+random()*850;if(projectRoad(RALLY_ROUTE,x,z).distance<35)continue;trees.push({x,y:ground(x,z),z,scale:.6+random()*.6,yaw:random()*6.28,species:i%2});}
  const texture=async(url:string,srgb:boolean)=>{const t=await loadKTX2(renderer,url,{srgb,anisotropy:4,repeat:!url.includes('leaves')&&!url.includes('cards')});textures.push(t);return t;};
  await Promise.all(['oak','sycamore'].map(async(name,species)=>{
    const prefix='/assets/p11/ridge-trees/'+name;
    const [barkMap,barkNormal,leafMap]=await Promise.all([texture(prefix+'-bark-baseColor.ktx2',true),texture(prefix+'-bark-normal.ktx2',false),texture(prefix+'-leaves-baseColor.ktx2',true)]);
    const bark=new THREE.MeshStandardMaterial({map:barkMap,normalMap:barkNormal,roughness:1}),leaves=new THREE.MeshStandardMaterial({map:leafMap,alphaTest:.4,side:THREE.DoubleSide,roughness:1,color:'#d2cbae'});
    for(const lod of [1,2]){const source=(await loader.loadAsync(sceneryGeometryURL(prefix+'-lod'+lod+'.glb'))).scene;sources.push(source);source.updateMatrixWorld(true);if(lod===1)source.traverse(o=>{if(o instanceof THREE.Mesh&&(o.material as THREE.Material).name.includes('leaf'))crowns[species].union(new THREE.Box3().setFromObject(o))});source.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const leaf=(o.material as THREE.Material).name.includes('leaf'),mesh=new THREE.InstancedMesh(o.geometry.clone().applyMatrix4(o.matrixWorld),leaf?leaves:bark,trees.length);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=lod===1;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);batches.push({mesh,species,lod});});}
  }));
  const cards=await texture('/assets/p11/ground-cover/cards-baseColor.ktx2',true),grass=new THREE.InstancedMesh(forestCardGeometry(0),new THREE.MeshStandardMaterial({map:cards,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:'#d8c79b'}),cover.length);grass.count=0;grass.frustumCulled=false;grass.receiveShadow=true;grass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(grass);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),last=new THREE.Vector3(Infinity,0,0);let lastQuality='';
  function fill(mesh:THREE.InstancedMesh,p:typeof trees[number]){rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);matrix.compose(position.set(p.x,p.y,p.z),rotation,scale.setScalar(p.scale));mesh.setMatrixAt(mesh.count++,matrix);}
  const obstacles:CourseBox[]=trees.map((p,i)=>({id:'rally-broadleaf-'+i,center:[p.x,p.y+4*p.scale,p.z],size:[.38*p.scale,8*p.scale,.38*p.scale]}));
  return {root,obstacles,trees,crowns:crowns.map(c=>({low:c.min.y,high:c.max.y,radius:Math.max(c.max.x-c.min.x,c.max.z-c.min.z)*.4})),update(camera:THREE.Vector3,quality:string){if(last.distanceToSquared(camera)<9&&lastQuality===quality)return;last.copy(camera);lastQuality=quality;const far=quality==='low'?180:quality==='medium'?280:420;for(const b of batches)b.mesh.count=0;grass.count=0;
    for(const p of trees){const d=Math.hypot(p.x-camera.x,p.z-camera.z);if(d>far)continue;for(const b of batches)if(b.species===p.species&&b.lod===(d<105?1:2))fill(b.mesh,p);}
    for(const p of cover)if(Math.hypot(p.x-camera.x,p.z-camera.z)<(quality==='low'?45:100))fill(grass,p);
    for(const m of [grass,...batches.map(b=>b.mesh)]){m.visible=m.count>0;m.instanceMatrix.needsUpdate=true;}
  },inspect:()=>({trees:trees.length,understory:cover.length,batches:batches.length+1}),dispose(){root.removeFromParent();for(const b of batches)b.mesh.dispose();grass.dispose();disposeGraph(root);sources.forEach(disposeGraph);textures.forEach(t=>t.dispose());}};
}
