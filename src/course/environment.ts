import {PAD, surfaceAt} from '../simulation/pad';
export interface CourseBox {id:string;center:readonly number[];size:readonly number[];yaw?:number}
export interface CourseGate {id:string;x:number;z:number;dx:number;dz:number;halfWidth:number;distance:number}
export interface CourseRoute {id:string;version:string;name:string;width:number;runoff:number;length:number;centerline:number[][];start:{x:number;y:number;z:number;yaw:number};checkpoints:CourseGate[];colliders:CourseBox[];ground:{center:readonly number[];size:readonly number[]};lamps:{position:number[];target:number[]}[]}
export interface EnvironmentDefinition {ground:{center:readonly number[];size:readonly number[]};obstacles:readonly CourseBox[];ramps:readonly {center:readonly number[];width:number;length:number;rise:number}[];surfaceAt:(x:number,z:number)=>{id:string;mu:number;rolling:number}}
export const PAD_ENVIRONMENT:EnvironmentDefinition={ground:PAD.ground,obstacles:PAD.obstacles,ramps:PAD.ramps,surfaceAt};
export interface RoadProjection {distance:number;progress:number;x:number;z:number;dx:number;dz:number;segment:number}
export function projectRoad(route:CourseRoute,x:number,z:number):RoadProjection {
 let best:RoadProjection={distance:Infinity,progress:0,x:0,z:0,dx:0,dz:-1,segment:0},along=0;
 for(let i=0;i<route.centerline.length;i++){const a=route.centerline[i],b=route.centerline[(i+1)%route.centerline.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<1e-8)continue;const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(length*length))),px=a[0]+dx*t,pz=a[1]+dz*t,distance=Math.hypot(x-px,z-pz);if(distance<best.distance)best={distance,progress:along+length*t,x:px,z:pz,dx:dx/length,dz:dz/length,segment:i};along+=length}
 return best;
}
export function routeLength(route:CourseRoute){return route.centerline.reduce((s,a,i)=>{const b=route.centerline[(i+1)%route.centerline.length];return s+Math.hypot(b[0]-a[0],b[1]-a[1])},0)}
export function sampleRoad(route:CourseRoute,distance:number){let d=((distance%route.length)+route.length)%route.length;for(let i=0;i<route.centerline.length;i++){const a=route.centerline[i],b=route.centerline[(i+1)%route.centerline.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l||i===route.centerline.length-1)return {x:a[0]+(b[0]-a[0])*d/l,z:a[1]+(b[1]-a[1])*d/l,dx:(b[0]-a[0])/l,dz:(b[1]-a[1])/l};d-=l}throw Error('Empty route')}
export function createCourseEnvironment(route:CourseRoute):EnvironmentDefinition {
 if(route.centerline.length<3||route.width<=0||route.runoff<0||Math.abs(routeLength(route)-route.length)>.1)throw Error('Invalid course geometry');
 return {ground:route.ground,obstacles:route.colliders,ramps:[],surfaceAt(x,z){const d=projectRoad(route,x,z).distance;return d<=route.width/2?{id:'asphalt',mu:1.05,rolling:.014}:d<=route.width/2+route.runoff?{id:'gravel',mu:.57,rolling:.042}:{id:'grass',mu:.52,rolling:.065}}};
}
/** Exact oriented boxes shared with collision; camera may test these without old pad obstacles. */
export function pointInsideBox(box:CourseBox,x:number,y:number,z:number,padding=0){const a=box.yaw??0,dx=x-box.center[0],dz=z-box.center[2],lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz;return Math.abs(lx)<=box.size[0]/2+padding&&Math.abs(y-box.center[1])<=box.size[1]/2+padding&&Math.abs(lz)<=box.size[2]/2+padding}
