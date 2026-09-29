import {createCourseEnvironment, projectRoad, routeLength, sampleRoad, type CourseRoute, type SupportMesh, type CourseBox} from '../course/environment';

/** Original closed dirt stage. Broad, tangent-continuous bends leave room to rotate a three-wheeler. */
const curves = [
  [[0,0],[0,-65],[0,-125],[0,-190]],
  [[0,-190],[0,-270],[75,-300],[140,-280]],
  [[140,-280],[220,-255],[205,-395],[285,-420]],
  [[285,-420],[390,-455],[480,-400],[450,-325]],
  [[450,-325],[430,-275],[345,-270],[345,-205]],
  [[345,-205],[345,-135],[505,-170],[515,-80]],
  [[515,-80],[525,10],[465,95],[390,100]],
  [[390,100],[315,105],[280,5],[210,35]],
  [[210,35],[155,60],[205,165],[130,185]],
  [[130,185],[50,210],[0,135],[0,65]],
  [[0,65],[0,42],[0,22],[0,0]],
] as const;
const points:number[][]=[];
for (const [a,b,c,d] of curves) for(let i=0;i<40;i++) {
  const t=i/40,u=1-t;
  points.push([u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]]);
}
export const RALLY_ROUTE:CourseRoute={id:'redstone-rally',version:'redstone-dirt-v1',name:'Redstone Rally',width:18,runoff:5,length:0,centerline:points,start:{x:0,y:.025,z:8,yaw:0},checkpoints:[],colliders:[],ground:{center:[240,-90,-120],size:[2300,.2,2200]},lamps:[]};
RALLY_ROUTE.length=routeLength(RALLY_ROUTE);
export const RALLY_STATIONS:number[]=[];
let along=0;
for(let i=0;i<points.length;i++){RALLY_STATIONS.push(along);const a=points[i],b=points[(i+1)%points.length];along+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
export function rallyElevation(s:number){const t=s/RALLY_ROUTE.length*Math.PI*2;return 5*(1-Math.cos(t))+2*(1-Math.cos(t*2));}
RALLY_ROUTE.elevations=RALLY_STATIONS.map(rallyElevation);
export function rallyCrossHeight(s:number,offset:number){const d=Math.abs(offset),base=sampleRoad(RALLY_ROUTE,s).y??0;return base+(d<=9?0:d<=14?-.018*(d-9):-.09+Math.min(5,(d-14)*.13)*(1+.25*Math.sin(s*.025)));}
export function rallyPoint(s:number,offset=0){const p=sampleRoad(RALLY_ROUTE,s);return {x:p.x-p.dz*offset,y:rallyCrossHeight(s,offset),z:p.z+p.dx*offset,dx:p.dx,dz:p.dz};}
export function rallyRibbon(inner:number,outer:number,height=0){
  const vertices:number[]=[],indices:number[]=[],uv:number[]=[],colors:number[]=[];
  for(let i=0;i<=points.length;i++){
    const j=i%points.length,a=points[j],prev=points[(j-1+points.length)%points.length],next=points[(j+1)%points.length],n=Math.hypot(next[0]-prev[0],next[1]-prev[1]),dx=(next[0]-prev[0])/n,dz=(next[1]-prev[1])/n,s=i===points.length?RALLY_ROUTE.length:RALLY_STATIONS[j];
    for(const offset of [inner,outer]){vertices.push(a[0]-dz*offset,rallyCrossHeight(s,offset)+height,a[1]+dx*offset);uv.push(offset/5,s/5);const shade=.87+.10*Math.sin(s*.033)+.03*Math.cos(s*.13);colors.push(shade,shade,shade);}
    if(i<points.length){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  return {vertices,indices,uv,colors};
}
export const RALLY_SURFACES={road:rallyRibbon(-9,9),shoulders:[rallyRibbon(-14,-9),rallyRibbon(9,14)],terrain:[[-32,-22],[-22,-14],[14,22],[22,32]].map(([a,b])=>rallyRibbon(a,b))};
RALLY_ROUTE.supportMeshes=[RALLY_SURFACES.road,...RALLY_SURFACES.shoulders,...RALLY_SURFACES.terrain];
RALLY_ROUTE.heightAt=(x,z)=>{const p=projectRoad(RALLY_ROUTE,x,z);return rallyCrossHeight(p.progress,(x-p.x)*-p.dz+(z-p.z)*p.dx);};
for(let i=0;i<32;i++){const distance=i*RALLY_ROUTE.length/32;RALLY_ROUTE.checkpoints.push({...sampleRoad(RALLY_ROUTE,distance),id:`rally-gate-${i}`,halfWidth:14,distance});}
/** Course-owned grip. Road vehicle profiles and historical surface values stay unchanged. */
export function createRallyEnvironment(terrain?:SupportMesh,obstacles:CourseBox[]=[]){return {...createCourseEnvironment(RALLY_ROUTE),...(terrain?{supportMeshes:[...RALLY_ROUTE.supportMeshes!,terrain]}:{}),obstacles:[...RALLY_ROUTE.colliders,...obstacles],surfaceAt(x:number,z:number){const d=projectRoad(RALLY_ROUTE,x,z).distance;return d<=9?{id:'dirt',mu:.82,rolling:.021}:d<=14?{id:'gravel',mu:.65,rolling:.034}:{id:'grass',mu:.52,rolling:.055};}};}
export const RALLY_SECTORS=[{at:0,name:'Service straight',note:'Flat out · brake before the flags'},{at:.11,name:'Pine bowl',note:'Long right · hold the slide'},{at:.25,name:'Redstone quarry',note:'Left into right · stay wide'},{at:.43,name:'Quarry hairpin',note:'Tight right · brake, rotate, release'},{at:.57,name:'Timber esses',note:'Left into right · link the corners'},{at:.72,name:'Lookout sweep',note:'Long right · carry your speed'},{at:.85,name:'Home switchback',note:'Left then right · finish ahead'}] as const;
