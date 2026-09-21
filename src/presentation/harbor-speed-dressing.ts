import * as THREE from 'three';
import type {CourseRoute} from '../course/environment';
import {loadRaceAsphalt,metresPerUV} from './race-asphalt';
import {loadRoadDecals} from './road-decals';
import {loadTrackside,planTrackside,type TracksidePlan} from './trackside';

/**
 * Original Harbor already has its own barriers, lamps and painted markings, so P11 adds only what it lacks for a sense of
 * speed: true-scale race asphalt on the authored road meshes, the streaking decal layer, catch fence behind the existing
 * barrier line and 150/100/50 boards into each braking zone. Visual only; the route's colliders are untouched.
 */
export const HARBOR_TRACKSIDE=(route:CourseRoute):TracksidePlan=>({railOffset:10,barrier:()=>null,fence:(station,side)=>side>0?Math.floor(station/140)%2===0:Math.floor((station+70)/140)%2===0,boards:{offset:route.width/2+1.9,scale:1.6}});
export async function loadHarborSpeedDressing(renderer:THREE.WebGLRenderer,scene:THREE.Scene,route:CourseRoute,night:boolean){
 const roads:THREE.Mesh[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material.name==='Quality_Dry_Asphalt')roads.push(o)});
 const plan=HARBOR_TRACKSIDE(route),fenced={...plan,railOffset:plan.railOffset+.2};
 const [asphalt,decals,trackside]=await Promise.all([roads.length?loadRaceAsphalt(renderer,metresPerUV(roads[0].geometry),{vertexColors:!!roads[0].geometry.getAttribute('color')}):undefined,loadRoadDecals(renderer,route,{halfWidth:route.width/2,y:.008,lanePaint:null,gridStation:0,seed:2207}),loadTrackside(renderer,planTrackside(route,fenced),night)]);
 const previous=new Map(roads.map(m=>[m,m.material as THREE.Material]));if(asphalt)for(const mesh of roads)mesh.material=asphalt.material;
 const group=new THREE.Group();group.name='P11_harbor_speed_dressing';group.add(decals.mesh,trackside.group);scene.add(group);
 return{group,update:(camera:THREE.Vector3)=>trackside.update(camera),inspect:()=>({roadMeshes:roads.length,asphalt:asphalt?.inspect()??null,decals:decals.inspect(),trackside:trackside.inspect()}),
  dispose(){for(const[mesh,material]of previous)mesh.material=material;group.removeFromParent();asphalt?.dispose();decals.dispose();trackside.dispose()}};
}
