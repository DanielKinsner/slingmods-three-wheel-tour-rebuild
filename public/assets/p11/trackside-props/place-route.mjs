/** Place instances along a polyline sampled from a route spline. All units metres.
 * Input points: [{x,y,z}, ...]. Returns transforms; creates no hidden collision.
 */
export function placeAlongRoute(points,{spacing=12,offset=4,closed=false,start=0}={}){
 if(points.length<2||!(spacing>0)||!Number.isFinite(spacing)||!Number.isFinite(offset)||!Number.isFinite(start)||start<0)throw new Error('Invalid route or spacing');
 if(points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw new Error('Nonfinite route point');
 const path=closed?[...points,points[0]]:points,placements=[];let station=0,next=start;
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz);
  if(!len)continue;if(!flat)throw new Error('Vertical route segment has no lateral direction');
  while(next<station+len){const t=(next-station)/len;placements.push({station:next,position:[a.x+dx*t-dz/flat*offset,a.y+dy*t,a.z+dz*t+dx/flat*offset],yaw:Math.atan2(dx,dz)});next+=spacing;}
  station+=len;
 }
 return placements;
}
