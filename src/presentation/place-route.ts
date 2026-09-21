/**
 * Typed port of public/assets/p11/trackside-props/place-route.mjs (same maths; tests hold the two in step).
 * Places instances along a polyline. All units metres. Returns transforms only; creates no collision.
 */
export interface RoutePoint {x:number;y:number;z:number}
export interface RoutePlacement {station:number;position:[number,number,number];yaw:number}
export function placeAlongRoute(points:RoutePoint[],{spacing=12,offset=4,closed=false,start=0}:{spacing?:number;offset?:number;closed?:boolean;start?:number}={}):RoutePlacement[]{
 if(points.length<2||!(spacing>0)||!Number.isFinite(spacing)||!Number.isFinite(offset)||!Number.isFinite(start)||start<0)throw new Error('Invalid route or spacing');
 if(points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw new Error('Nonfinite route point');
 const path=closed?[...points,points[0]]:points,placements:RoutePlacement[]=[];let station=0,next=start;
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz);
  if(!len)continue;if(!flat)throw new Error('Vertical route segment has no lateral direction');
  while(next<station+len){const t=(next-station)/len;placements.push({station:next,position:[a.x+dx*t-dz/flat*offset,a.y+dy*t,a.z+dz*t+dx/flat*offset],yaw:Math.atan2(dx,dz)});next+=spacing}
  station+=len;
 }
 return placements;
}
/** The centreline pushed sideways by `offset`, so spacing can be measured along the rail itself rather than along the road. */
export function offsetRoute(points:RoutePoint[],offset:number,closed=false):RoutePoint[]{
 const n=points.length;return points.map((p,i)=>{const a=points[closed?(i-1+n)%n:Math.max(0,i-1)],b=points[closed?(i+1)%n:Math.min(n-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,flat=Math.hypot(dx,dz)||1;return{x:p.x-dz/flat*offset,y:p.y,z:p.z+dx/flat*offset}});
}
