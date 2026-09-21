import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadKTX2} from './ktx2';import {TRACKSIDE_KIT as KIT} from './p11-assets';
import {placeAlongRoute,offsetRoute,type RoutePoint} from './place-route';
import {sampleRoad,type CourseRoute} from '../course/environment';

/** P11 trackside kit: visual set dressing only. It never adds collision; barriers are laid on the route's existing rail line. */
export type TracksideProp='armco-straight'|'jersey-plain'|'jersey-red-white'|'catch-fence'|'streetlight'|'distance-150'|'distance-100'|'distance-50';
export interface TracksidePlacement {prop:TracksideProp;x:number;y:number;z:number;yaw:number;scale?:number;stretch?:number}
/** Metres from the camera at which each prop drops a level of detail, then disappears. Tall lights carry furthest. */
const RANGE:Record<TracksideProp,[number,number,number]>={'armco-straight':[60,180,520],'jersey-plain':[60,180,520],'jersey-red-white':[60,180,520],'catch-fence':[70,200,480],streetlight:[90,260,900],'distance-150':[80,200,420],'distance-100':[80,200,420],'distance-50':[80,200,420]};

type Part={geometry:THREE.BufferGeometry;material:THREE.Material};
export async function loadTrackside(renderer:THREE.WebGLRenderer,placements:TracksidePlacement[],night:boolean){
 const props=[...new Set(placements.map(p=>p.prop))];
 // The GLBs point at 15-25 MB shared PNGs. The same sheets ship as KTX2 beside the kit, so the PNG requests are answered
 // with one transparent pixel and every mesh is rebound to a single compressed material below.
 const manager=new THREE.LoadingManager();manager.setURLModifier(url=>/shared-textures\/.*\.png$/.test(url)?'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=':url);
 const loader=new GLTFLoader(manager);
 const [map,normalMap,orm,chain,...files]=await Promise.all([loadKTX2(renderer,KIT+'trim-baseColor.ktx2',{srgb:true}),loadKTX2(renderer,KIT+'trim-normal.ktx2'),loadKTX2(renderer,KIT+'trim-ORM.ktx2'),loadKTX2(renderer,KIT+'chain-link.ktx2',{srgb:true}),...props.flatMap(p=>[0,1,2].map(l=>loader.loadAsync(`${KIT}${p}-lod${l}.glb`)))]);
 const trim=new THREE.MeshStandardMaterial({name:'P11_trackside_trim',map,normalMap,normalScale:new THREE.Vector2(1,-1),roughnessMap:orm,metalnessMap:orm,roughness:1,metalness:1,side:THREE.DoubleSide});
 const link=new THREE.MeshStandardMaterial({name:'P11_chain_link',map:chain,alphaTest:.35,roughness:.6,metalness:0,side:THREE.DoubleSide});
 const lamp=new THREE.MeshStandardMaterial({name:'P11_sodium_lamp',color:'#ff7017',emissive:'#ff7017',emissiveIntensity:night?6:.35,roughness:.3,metalness:0});
 const shared=(m:THREE.Material)=>/trackside trim/i.test(m.name)?trim:/chain link/i.test(m.name)?link:/sodium/i.test(m.name)?lamp:m;
 const placeholders=new Set<THREE.Texture>(),strays=new Set<THREE.Material>();
 const library=new Map<TracksideProp,Part[][]>();
 props.forEach((prop,i)=>library.set(prop,[0,1,2].map(l=>{
  const scene=files[i*3+l].scene,by=new Map<THREE.Material,THREE.BufferGeometry[]>();scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const source=(Array.isArray(o.material)?o.material[0]:o.material)as THREE.MeshStandardMaterial,material=shared(source);for(const v of Object.values(source))if(v instanceof THREE.Texture)placeholders.add(v);if(material!==source)source.dispose();else strays.add(source);const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);const list=by.get(material)??[];list.push(g);by.set(material,list);o.geometry.dispose()});
  return[...by].map(([material,list])=>{const geometry=list.length===1?list[0]:mergeGeometries(list)!;if(list.length>1)list.forEach(g=>g.dispose());return{geometry,material}});
 })));
 placeholders.forEach(t=>t.dispose());
 const group=new THREE.Group();group.name='P11_trackside';
 type Slot={prop:TracksideProp;items:TracksidePlacement[];matrices:THREE.Matrix4[];lods:THREE.InstancedMesh[][]};const slots:Slot[]=[],q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 for(const prop of props){
  const items=placements.filter(p=>p.prop===prop),matrices=items.map(p=>new THREE.Matrix4().compose(new THREE.Vector3(p.x,p.y,p.z),q.setFromAxisAngle(up,p.yaw),new THREE.Vector3((p.scale??1)*(p.stretch??1),p.scale??1,p.scale??1)));
  const lods=library.get(prop)!.map((parts,l)=>parts.map(part=>{const mesh=new THREE.InstancedMesh(part.geometry,part.material,items.length);mesh.name=`P11_${prop}_lod${l}`;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=l===0;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);return mesh}));
  slots.push({prop,items,matrices,lods});
 }
 let last:THREE.Vector3|undefined,disposed=false;const active=[0,0,0];
 return{group,
  /** Re-sort instances into detail levels whenever the camera has moved a few metres; the work is a few thousand distance checks. */
  update(camera:THREE.Vector3,force=false){
   if(!force&&last&&last.distanceToSquared(camera)<16)return;last=(last??new THREE.Vector3()).copy(camera);active.fill(0);
   for(const slot of slots){const range=RANGE[slot.prop],counts=[0,0,0];slot.items.forEach((p,i)=>{const d=Math.hypot(p.x-camera.x,p.z-camera.z),l=d<range[0]?0:d<range[1]?1:d<range[2]?2:-1;if(l<0)return;for(const mesh of slot.lods[l])mesh.setMatrixAt(counts[l],slot.matrices[i]);counts[l]++});
    slot.lods.forEach((meshes,l)=>{active[l]+=counts[l];for(const mesh of meshes){mesh.count=counts[l];mesh.instanceMatrix.needsUpdate=true}})}
  },
  inspect:()=>({placements:placements.length,byProp:Object.fromEntries(slots.map(s=>[s.prop,s.items.length])),active:[...active],drawCalls:slots.reduce((n,s)=>n+s.lods.reduce((m,meshes)=>m+meshes.filter(x=>x.count>0).length,0),0),collisionAdded:0,materials:{trim:{metalness:trim.metalness,roughness:trim.roughness},lampEmissive:lamp.emissiveIntensity}}),
  dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const lods of library.values())for(const parts of lods)for(const part of parts)part.geometry.dispose();for(const slot of slots)for(const meshes of slot.lods)for(const mesh of meshes)mesh.dispose();for(const m of[trim,link,lamp,...strays])m.dispose();for(const t of[map,normalMap,orm,chain])t.dispose()}};
}

const points=(route:CourseRoute):RoutePoint[]=>route.centerline.map((p,i)=>({x:p[0],y:route.elevations?.[i]??0,z:p[1]}));
/** Signed curvature (1/m) of the closed centreline, smoothed over about 40 m so kinks in the polyline do not read as corners. */
export function routeCurvature(route:CourseRoute,step=10){
 const n=Math.ceil(route.length/step),raw:number[]=[];
 for(let i=0;i<n;i++){const a=sampleRoad(route,i*step-step),b=sampleRoad(route,i*step+step);raw.push(Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz)/(2*step))}
 return{step,values:raw.map((_,i)=>[-2,-1,0,1,2].reduce((s,k)=>s+raw[(i+k+n)%n],0)/5)};
}
/**
 * Stations where a corner tighter than `radius` begins after at least `straight` metres of near-straight road. Real corners
 * tighten gradually, so from the point the radius is crossed we walk back to where the bend first starts, then measure
 * the straight before that.
 */
export function brakingPoints(route:CourseRoute,radius=160,straight=180){
 const {step,values}=routeCurvature(route),n=values.length,limit=1/radius,gentle=limit*.35,at=(i:number)=>Math.abs(values[((i%n)+n)%n]),found:number[]=[];
 for(let i=0;i<n;i++){if(at(i)<limit||at(i-1)>=limit)continue;let onset=i;while(i-onset<n&&at(onset-1)>=gentle)onset--;let run=0;while(run<n&&at(onset-1-run)<gentle)run++;if(run*step>=straight)found.push(((onset*step)%route.length+route.length)%route.length)}
 return[...new Set(found)];
}
export interface TracksidePlan {railOffset:number;barrier:(station:number,side:-1|1)=>'armco-straight'|'jersey-plain'|'jersey-red-white'|null;fence?:(station:number,side:-1|1)=>boolean;lights?:{spacing:number;offset:number};boards?:{offset:number;scale:number}}
/**
 * Constant roadside rhythm from one route description. Barriers follow the rail line at their own length so there are no
 * gaps on the outside of bends; lights alternate sides; 150/100/50 boards count down into every real braking zone.
 */
export function planTrackside(route:CourseRoute,plan:TracksidePlan):TracksidePlacement[]{
 const centre=points(route),out:TracksidePlacement[]=[],inward=(yaw:number,side:number)=>yaw+(side>0?-Math.PI/2:Math.PI/2);
 for(const side of[-1,1]as const){
  const rail=offsetRoute(centre,side*plan.railOffset,true);
  // Walk the rail itself in barrier-length steps (interpolating a half-metre sampling); the last segment stretches to close the loop.
  const fine=placeAlongRoute(rail,{spacing:.5,offset:0,closed:true}),railLength=fine.length*.5,at=(d:number)=>{const f=((d%railLength)+railLength)%railLength/.5,i=Math.floor(f)%fine.length,t=f-Math.floor(f),a=fine[i].position,b=fine[(i+1)%fine.length].position;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
  for(let d=0;d<railLength-.5;){const kind=plan.barrier(d/railLength*route.length,side),length=kind==='armco-straight'?4:3,remaining=railLength-d,span=remaining<length*1.5?remaining:length,a=at(d),b=at(d+span),dx=b[0]-a[0],dz=b[2]-a[2];
   if(kind)out.push({prop:kind,x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,yaw:Math.atan2(dx,dz)-Math.PI/2+(side>0?Math.PI:0),stretch:(Math.hypot(dx,dz)||length)/length});d+=span}
  if(plan.fence){const line=placeAlongRoute(offsetRoute(centre,side*(plan.railOffset+.9),true),{spacing:3,offset:0,closed:true}),total=line.length*3;for(const p of line)if(plan.fence(p.station/total*route.length,side))out.push({prop:'catch-fence',x:p.position[0],y:p.position[1],z:p.position[2],yaw:p.yaw-Math.PI/2})}
  if(plan.lights)for(const p of placeAlongRoute(centre,{spacing:plan.lights.spacing,offset:side*plan.lights.offset,closed:true,start:side>0?plan.lights.spacing/2:0}))out.push({prop:'streetlight',x:p.position[0],y:p.position[1],z:p.position[2],yaw:inward(p.yaw,side)});
 }
 if(plan.boards)for(const corner of brakingPoints(route))for(const metres of[150,100,50]as const)for(const side of[-1,1]){const s=sampleRoad(route,corner-metres),offset=side*plan.boards.offset;out.push({prop:`distance-${metres}`,x:s.x-s.dz*offset,y:(s as {y?:number}).y??0,z:s.z+s.dx*offset,yaw:Math.atan2(-s.dx,-s.dz),scale:plan.boards.scale})}
 return out;
}
