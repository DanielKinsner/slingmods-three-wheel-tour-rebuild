import type {CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
/** The map is derived from the same route polyline as the race. No illustrative route. */
export class RouteAid {
 private marker:SVGCircleElement|null=null;private minX=0;private minZ=0;private scale=1;private offsetX=0;private offsetY=0;private last=-1;
 constructor(root:HTMLElement,route?:CourseRoute){if(!route)return;const xs=route.centerline.map(p=>p[0]),zs=route.centerline.map(p=>p[1]);this.minX=Math.min(...xs);this.minZ=Math.min(...zs);const w=Math.max(...xs)-this.minX,h=Math.max(...zs)-this.minZ;this.scale=Math.min(180/Math.max(1,w),94/Math.max(1,h));this.offsetX=(204-w*this.scale)/2;this.offsetY=(118-h*this.scale)/2;const points=route.centerline.map(p=>this.project(p[0],p[1]));const aid=document.createElement('aside');aid.className='race-route-aid';aid.setAttribute('aria-label',route.name+' route map');aid.innerHTML=`<svg viewBox="0 0 204 118" aria-hidden="true"><path d="${points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join(' ')}Z"/><circle r="5"/></svg><span>${route.name}</span><small>${(route.length/1000).toFixed(2)} km · course length</small>`;root.append(aid);this.marker=aid.querySelector('circle')}
 private project(x:number,z:number){return [(x-this.minX)*this.scale+this.offsetX,(z-this.minZ)*this.scale+this.offsetY]}
 update(t:VehicleTelemetry){if(!this.marker||!t.position||t.time-this.last<.1)return;this.last=t.time;const [x,y]=this.project(t.position.x,t.position.z);this.marker.setAttribute('cx',String(x));this.marker.setAttribute('cy',String(y))}
}
