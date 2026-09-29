import * as THREE from 'three';
import {RALLY_KIT,RALLY_TEXTURES} from './assets';
import {loadRallyVegetation} from './vegetation';
import type {GroundCaster} from '../presentation/ground-light';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadKTX2} from '../presentation/ktx2';
import {disposeGraph} from '../presentation/scene-lifetime';
import {projectRoad,type CourseBox} from '../course/environment';
import {RALLY_ROUTE,RALLY_SURFACES,rallyPoint,rallyRibbon,rallyCrossHeight,RALLY_SECTORS} from './route';

type Placement={x:number;y:number;z:number;scale:number;yaw:number;stretch?:number;/** Visual only (graphics pass 3): per-rock proportions and lean; colliders keep scale/stretch. */shape?:[number,number,number];tilt?:number};
const KIT=RALLY_KIT;
function seeded(){let seed=0x725411;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function ribbon(data:ReturnType<typeof rallyRibbon>){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(data.colors,3));g.setIndex(data.indices);g.computeVertexNormals();return g;}
function labelTexture(text:string,small:string,color='#e69b45'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d')!;
  g.fillStyle='#17221d';g.fillRect(0,0,1024,256);g.fillStyle=color;g.fillRect(0,0,16,256);g.fillRect(1008,0,16,256);
  g.textAlign='center';g.fillStyle='#f6edda';g.font='900 82px sans-serif';g.fillText(text,512,122);g.fillStyle=color;g.font='600 30px sans-serif';g.fillText(small,512,196);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** Shared near/far instancing for the original Blender kit; density adds instances rather than a draw per prop. */
export async function loadRallyPresentation(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
  const root=new THREE.Group();root.name='Redstone_Rally';scene.add(root);
  // Canyon haze. The race re-applies it after the shared lighting rig, which would otherwise install Harbor's fog.
  // Warm dust keeps the distant mesas sandstone-red instead of washing them to pale grey.
  const fog=new THREE.FogExp2('#a88a70',.00135);scene.fog=fog;
  const textures:THREE.Texture[]=[],loader=new GLTFLoader(),random=seeded();
  const ground='/assets/p11/ground-cover/';
  const [dirt,normal,gravel,soil,soilNormal,rock]=await Promise.all(RALLY_TEXTURES.map(async(n)=>{const t=await loadKTX2(renderer,ground+n+'.ktx2',{srgb:n.endsWith('baseColor')});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;textures.push(t);return t;}));
  const dirtMat=new THREE.MeshStandardMaterial({map:dirt,normalMap:normal,normalScale:new THREE.Vector2(.75,.75),roughness:1,vertexColors:true,color:'#e3c3a0'});
  // Worn racing line and narrow, irregular wheel ruts follow physical metres along the route UVs.
  dirtMat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    float offset=vMapUv.x*5.;float along=vMapUv.y*5.;
    float line=1.-smoothstep(2.,8.,abs(offset+sin(along*.019)*1.5));
    float ruts=exp(-pow((abs(offset+sin(along*.035)*.22)-1.55)*5.,2.));
    diffuseColor.rgb*=mix(.82,1.08,line)*(1.-ruts*.105);
  `);};
  dirtMat.customProgramCacheKey=()=> 'rally-dirt-ruts-v1';
  const shoulder=new THREE.MeshStandardMaterial({map:gravel,normalMap:normal,normalScale:new THREE.Vector2(.5,.5),roughness:1,color:'#fff0ce',vertexColors:true});
  const earth=new THREE.MeshStandardMaterial({map:soil,normalMap:soilNormal,roughness:1,color:'#9c9271',vertexColors:true});
  const addRibbon=(name:string,data:ReturnType<typeof rallyRibbon>,mat:THREE.Material)=>{const m=new THREE.Mesh(ribbon(data),mat);m.name=name;m.receiveShadow=true;root.add(m);};
  addRibbon('Rally_compacted_dirt',RALLY_SURFACES.road,dirtMat);
  RALLY_SURFACES.shoulders.forEach((d,i)=>addRibbon('Rally_loose_gravel_'+i,d,shoulder));
  RALLY_SURFACES.terrain.forEach((d,i)=>addRibbon('Rally_earth_bank_'+i,d,earth));
  // Continuous scenic terrain follows the nearest road height and stays beneath its exact support ribbons.
  const scenicHeight=(x:number,z:number)=>{const p=projectRoad(RALLY_ROUTE,x,z),d=p.distance;return rallyCrossHeight(p.progress,d)-.75+Math.max(0,Math.min(32,(d-32)*.23))*(.72+.28*Math.sin(x*.017)*Math.cos(z*.019));};
  const basinGeo=new THREE.PlaneGeometry(2300,2200,256,256);basinGeo.rotateX(-Math.PI/2);const bp=basinGeo.getAttribute('position'),bu=basinGeo.getAttribute('uv');
  for(let i=0;i<bp.count;i++){const x=bp.getX(i)+240,z=bp.getZ(i)-120;bp.setXYZ(i,x,scenicHeight(x,z),z);bu.setXY(i,x/7,z/7);}basinGeo.computeVertexNormals();
  const basin=new THREE.Mesh(basinGeo,new THREE.MeshStandardMaterial({map:soil,normalMap:soilNormal,color:'#b5ae89',roughness:1}));basin.name='Rally_basin';basin.receiveShadow=true;root.add(basin);
  const placements=Object.fromEntries(KIT.map(k=>[k,[] as Placement[]]));
  const place=(kind:string,s:number,offset:number,scale:number,yaw=random()*Math.PI*2)=>{const p=rallyPoint(s,offset),near=projectRoad(RALLY_ROUTE,p.x,p.z);if(near.distance<17)return;placements[kind].push({...p,scale,yaw});};
  for(let s=0;s<RALLY_ROUTE.length;s+=8){for(const side of [-1,1]){
    const quarry=s/RALLY_ROUTE.length>.25&&s/RALLY_ROUTE.length<.52;
    if(random()<(quarry?.35:.91))place('ponderosa-'+(random()>.5?1:0),s,side*(21+random()*10),.7+random()*.6);
    if(random()<.28)place('deadwood',s,side*(24+random()*6),.55+random()*.7);
    if(random()<(quarry?.9:.3))place('redstone-'+Math.floor(random()*3),s,side*(21+random()*9),quarry?1.2+random()*2.2:.3+random()*.6);
  }}
  // Distant pine stands and red buttes, deliberately kept clear of every road branch.
  for(let i=0;i<700;i++){const x=-230+random()*1020,z=-660+random()*1090,p=projectRoad(RALLY_ROUTE,x,z);if(p.distance<40)continue;placements['ponderosa-'+i%2].push({x,y:scenicHeight(x,z),z,scale:.7+random()*1.2,yaw:random()*6.28});}
  for(let i=0;i<27;i++){const a=i*Math.PI*2/27+random()*.08,x=250+Math.cos(a)*(700+random()*100),z=-100+Math.sin(a)*(700+random()*100);placements['redstone-'+i%3].push({x,y:scenicHeight(x,z)-8,z,scale:7+random()*11,stretch:1.8+random()*2.5,yaw:random()*6.28});}
  place('marshal-hut',70,-23,1,Math.PI/2);place('marshal-hut',RALLY_ROUTE.length*.70,24,.85,-Math.PI/2);
  place('quarry-gantry',RALLY_ROUTE.length*.35,-29,1.5,1.1);
  for(let i=0;i<7;i++)place('log-stack',RALLY_ROUTE.length*.59+i*8,-21,1,Math.PI*.2);
  // Graphics pass 3: every sandstone rock gets its own proportions and a slight lean, so the kit's three buttes stop reading
  // as a row of identical barrels. Deterministic per placement; visual only (the colliders below still use scale/stretch).
  const hash=(i:number,k:number)=>{const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v)};
  for(const kind of ['redstone-0','redstone-1','redstone-2'])placements[kind].forEach((p,i)=>{if(p.stretch)return;const n=i+kind.length*97+Number(kind.slice(-1))*1013;p.shape=[.82+hash(n,1)*.4,.75+hash(n,2)*.6,.82+hash(n,3)*.4];p.tilt=(hash(n,4)-.5)*.16});
  const batches:{mesh:THREE.InstancedMesh;placements:Placement[];near:boolean}[]=[],sources:THREE.Group[]=[],shapes:Record<string,{leaf:THREE.Box3;solid:THREE.Box3}>={};
  await Promise.all(KIT.map(async key=>{
    const source=(await loader.loadAsync('/assets/rally/'+key+'.glb')).scene;sources.push(source);source.updateMatrixWorld(true);
    const shape={leaf:new THREE.Box3(),solid:new THREE.Box3()};shapes[key]=shape;source.traverse(o=>{if(o instanceof THREE.Mesh)shape[(o.material as THREE.Material).name.includes('needles')?'leaf':'solid'].union(new THREE.Box3().setFromObject(o))});
    const pieces=new Map<string,{material:THREE.MeshStandardMaterial;geometry:THREE.BufferGeometry[]}>();
    source.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const original=o.material as THREE.MeshStandardMaterial,leaf=original.name.includes('needles'),kind=leaf?'leaf':'solid',g=o.geometry.clone().applyMatrix4(o.matrixWorld);
      for(const a of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(a))g.deleteAttribute(a);
      const pos=g.getAttribute('position'),norm=g.getAttribute('normal'),authored=g.getAttribute('color'),colors:number[]=[],uv:number[]=[];
      // Authored vertex colour (the v2 sandstone strata) is kept, tinted by the material; other kit pieces use their material colour.
      for(let i=0;i<pos.count;i++){colors.push(original.color.r*(authored?authored.getX(i):1),original.color.g*(authored?authored.getY(i):1),original.color.b*(authored?authored.getZ(i):1));uv.push((Math.abs(norm.getY(i))>.7?pos.getX(i):pos.getX(i)+pos.getZ(i))*.3,(Math.abs(norm.getY(i))>.7?pos.getZ(i):pos.getY(i))*.3);}
      g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));if(!leaf||!g.getAttribute('uv'))g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      let group=pieces.get(kind);if(!group){const material=leaf?original.clone():new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:key.startsWith('redstone')?rock:null});
        if(leaf){material.alphaTest=.22;material.alphaToCoverage=true;material.emissiveMap=material.map;material.emissive.set('#ffffff');material.emissiveIntensity=.3;material.transparent=false;material.depthWrite=true;material.side=THREE.DoubleSide;material.roughness=1;material.color.set('#e4edce');}
        group={material,geometry:[]};pieces.set(kind,group);}
      group.geometry.push(g.index?g.toNonIndexed():g);
    });
    for(const {material,geometry:parts} of pieces.values()){const geometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());
      for(const near of [true,false]){const inst=new THREE.InstancedMesh(geometry,material,placements[key].length);inst.name='Rally_'+key;inst.frustumCulled=false;inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);inst.count=0;inst.castShadow=near;inst.receiveShadow=true;root.add(inst);batches.push({mesh:inst,placements:placements[key],near});}
    }
  }));
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),euler=new THREE.Euler(),position=new THREE.Vector3(),scale=new THREE.Vector3(),lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);let lastQuality='';
  const postMat=new THREE.MeshStandardMaterial({color:'#614831',roughness:1}),flagMat=new THREE.MeshStandardMaterial({color:'#dd722b',roughness:1,side:THREE.DoubleSide}),white=new THREE.MeshStandardMaterial({color:'#ece1c4',roughness:1});
  const markerGeos=[new THREE.CylinderGeometry(.065,.09,1.5,6),new THREE.PlaneGeometry(.48,.34)];
  for(let s=8;s<RALLY_ROUTE.length;s+=22){for(const side of [-1,1]){const p=rallyPoint(s,side*13.5),post=new THREE.Mesh(markerGeos[0],postMat);post.position.set(p.x,p.y+.75,p.z);root.add(post);const flag=new THREE.Mesh(markerGeos[1],side===1?flagMat:white);flag.position.set(p.x,p.y+1.28,p.z);flag.rotation.y=Math.atan2(p.dx,p.dz);root.add(flag);}}
  function board(s:number,offset:number,text:string,sub:string,width=5){const p=rallyPoint(s,offset),t=labelTexture(text,sub);textures.push(t);const g=new THREE.Group(),face=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshStandardMaterial({map:t,roughness:1,side:THREE.DoubleSide}));face.position.y=3;g.add(face);for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.14,3.7,.14),postMat);post.position.set(side*(width/2-.2),1.85,0);g.add(post);}g.position.set(p.x,p.y,p.z);g.rotation.y=Math.atan2(-p.dx,-p.dz);root.add(g);}
  for(const s of RALLY_SECTORS.slice(1))board(s.at*RALLY_ROUTE.length-35,-16,s.name.toUpperCase(),'BRAKE  /  ROTATE  /  RELEASE',5.5);
  // A clear physical start line; the gantry feet sit beyond the rally corridor.
  const banner=labelTexture('REDSTONE RALLY','RYKER EXCLUSIVE   /   DIRT STAGE');textures.push(banner);
  const gate=new THREE.Mesh(new THREE.BoxGeometry(31,2,.4),new THREE.MeshStandardMaterial({map:banner,roughness:.9}));gate.position.set(0,6,0);root.add(gate);
  for(const x of [-15.3,15.3]){const pole=new THREE.Mesh(new THREE.BoxGeometry(.5,6,.5),postMat);pole.position.set(x,3,0);pole.castShadow=true;root.add(pole);}
  for(let i=0;i<18;i++){const tile=new THREE.Mesh(new THREE.PlaneGeometry(1,1.1).rotateX(-Math.PI/2),i%2?white:postMat);tile.position.set(i-8.5,.018,0);root.add(tile);}
  // Signs/flags are static and merged by material, preserving a small scenery draw budget.
  const staticGroups=new Map<THREE.Material,THREE.Mesh[]>();root.updateMatrixWorld(true);root.traverse(o=>{if(o instanceof THREE.Mesh&&!(o instanceof THREE.InstancedMesh)&&o.geometry!==basinGeo&&o.material!==dirtMat&&o.material!==shoulder&&o.material!==earth){const list=staticGroups.get(o.material as THREE.Material)??[];list.push(o);staticGroups.set(o.material as THREE.Material,list);}});
  for(const [mat,meshes] of staticGroups){if(meshes.length<2)continue;const geos=meshes.map(m=>{const g=m.geometry.clone().applyMatrix4(m.matrixWorld);return g.index?g.toNonIndexed():g;});const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(!merged)continue;meshes.forEach(m=>m.removeFromParent());const mesh=new THREE.Mesh(merged,mat);mesh.receiveShadow=true;root.add(mesh);}
  const courseHeight=RALLY_ROUTE.heightAt!;RALLY_ROUTE.heightAt=(x,z)=>projectRoad(RALLY_ROUTE,x,z).distance<=32?courseHeight(x,z):scenicHeight(x,z);
  const vegetation=await loadRallyVegetation(renderer,scenicHeight);root.add(vegetation.root);
  const obstacles:CourseBox[]=[];
  for(const [kind,list] of Object.entries(placements))for(const [i,p] of list.entries()){
    const k=p.scale,w=p.stretch??1,id=`rally-${kind}-${i}`;
    if(kind.startsWith('redstone'))obstacles.push({id,center:[p.x,p.y+2.8*k,p.z],size:[3.5*k*w,5.6*k,2.3*k*w],yaw:p.yaw});
    else if(kind.startsWith('ponderosa')||kind==='deadwood')obstacles.push({id,center:[p.x,p.y+3*k,p.z],size:[.32*k,6*k,.32*k]});
    else if(kind==='marshal-hut')obstacles.push({id,center:[p.x,p.y+1.4*k,p.z],size:[4.4*k,2.7*k,3.6*k],yaw:p.yaw});
    else if(kind==='log-stack')obstacles.push({id,center:[p.x,p.y+.6*k,p.z],size:[1.8*k,1.2*k,4.4*k],yaw:p.yaw});
    else if(kind==='quarry-gantry')for(const x of [-3.6,3.6])for(const z of [-2.2,2.2])obstacles.push({id:id+x+z,center:[p.x+(x*Math.cos(p.yaw)+z*Math.sin(p.yaw))*k,p.y+2*k,p.z+(-x*Math.sin(p.yaw)+z*Math.cos(p.yaw))*k],size:[.4*k,4*k,.4*k]});
  }
  obstacles.push(...vegetation.obstacles);
  // Ground light (src/presentation/ground-light.ts): what casts baked shade on the stage; the backdrop mesas are too far to matter.
  const casters:GroundCaster[]=[],body=(b:THREE.Box3)=>({low:Math.max(0,b.min.y),high:b.max.y,radius:Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*.4});
  const density:Record<string,number>={deadwood:.3,'quarry-gantry':.4,'log-stack':.8,'marshal-hut':.85};
  for(const [kind,list] of Object.entries(placements)){const s=shapes[kind];if(!s)continue;const tree=!s.leaf.isEmpty(),b=body(tree?s.leaf:s.solid),opacity=tree?.78:density[kind]??.85;
    for(const p of list){if(p.stretch)continue;const r=b.radius*p.scale;casters.push({x:p.x,z:p.z,low:b.low*p.scale,high:b.high*p.scale,radius:r,opacity,contact:.6,contactRadius:tree?Math.max(1.2,r*.4):r*1.15})}}
  for(const p of vegetation.trees){const c=vegetation.crowns[p.species],r=c.radius*p.scale;casters.push({x:p.x,z:p.z,low:c.low*p.scale,high:c.high*p.scale,radius:r,opacity:.78,contact:.6,contactRadius:Math.max(1.2,r*.4)})}
  const groundMeshes=root.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&/^Rally_(compacted_dirt|loose_gravel|earth_bank|basin)/.test(o.name));
  const support={vertices:Array.from(bp.array),indices:Array.from(basinGeo.index!.array)};
  return {root,support,obstacles,fog,ground:{meshes:groundMeshes,casters},update(camera:THREE.Vector3,quality='high'){
    vegetation.update(camera,quality);
    if(lastCamera.distanceToSquared(camera)<9&&quality===lastQuality)return;lastCamera.copy(camera);lastQuality=quality;const distance=quality==='low'?260:quality==='medium'?370:quality==='ultra'?600:490;
    for(const b of batches){b.mesh.count=0;for(const p of b.placements){const d=Math.hypot(p.x-camera.x,p.z-camera.z),isNear=d<120;if(isNear!==b.near||d>distance&&!p.stretch)continue;
      if(p.tilt)rotation.setFromEuler(euler.set(p.tilt,p.yaw,0,'YXZ'));else rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);const sh=p.shape;matrix.compose(position.set(p.x,p.y,p.z),rotation,scale.set(p.scale*(p.stretch??1)*(sh?sh[0]:1),p.scale*(sh?sh[1]:1),p.scale*(p.stretch??1)*(sh?sh[2]:1)));b.mesh.setMatrixAt(b.mesh.count++,matrix);}
      b.mesh.visible=b.mesh.count>0;b.mesh.castShadow=b.near&&quality!=='low';b.mesh.instanceMatrix.needsUpdate=true;
    }
  },inspect(){return {name:RALLY_ROUTE.name,vegetation:vegetation.inspect(),physicalProps:obstacles.length,assets:KIT.length,instances:Object.values(placements).reduce((n,p)=>n+p.length,0),batches:batches.length,visibleBatches:batches.filter(b=>b.mesh.visible).length,surface:'canyon dirt / normal maps / racing-line ruts',length:RALLY_ROUTE.length};},dispose(){vegetation.dispose();root.removeFromParent();batches.forEach(b=>b.mesh.dispose());disposeGraph(root);sources.forEach(disposeGraph);textures.forEach(t=>t.dispose());}};
}
