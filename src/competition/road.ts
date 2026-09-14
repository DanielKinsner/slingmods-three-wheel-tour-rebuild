import {type CourseRoute,type RoadProjection} from '../course/environment';
/** Immutable segment cache; projection checks a local window, falling back only off its corridor. */
export class RaceRoad {
 readonly starts:number[]=[];private segments:{x:number;z:number;dx:number;dz:number;length:number}[]=[];
 constructor(readonly route:CourseRoute){let d=0;route.centerline.forEach((a,i)=>{const b=route.centerline[(i+1)%route.centerline.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);this.starts.push(d);this.segments.push({x:a[0],z:a[1],dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length,length});d+=length})}
 sample(distance:number){const d=((distance%this.route.length)+this.route.length)%this.route.length;let lo=0,hi=this.starts.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(this.starts[mid]<=d)lo=mid;else hi=mid-1}const s=this.segments[lo],t=d-this.starts[lo];return {x:s.x+s.dx*t,z:s.z+s.dz*t,dx:s.dx,dz:s.dz}}
 project(x:number,z:number,previous?:number):RoadProjection {let best:RoadProjection={distance:Infinity,progress:0,x:0,z:0,dx:0,dz:-1,segment:0};const n=this.segments.length;const test=(i:number)=>{const s=this.segments[i],t=Math.max(0,Math.min(s.length,(x-s.x)*s.dx+(z-s.z)*s.dz)),px=s.x+s.dx*t,pz=s.z+s.dz*t,distance=Math.hypot(x-px,z-pz);if(distance<best.distance)best={distance,progress:this.starts[i]+t,x:px,z:pz,dx:s.dx,dz:s.dz,segment:i}};if(previous!==undefined){for(let offset=-12;offset<=12;offset++)test(((previous+offset)%n+n)%n)}if(previous===undefined||best.distance>this.route.width/2+this.route.runoff+2)for(let i=0;i<n;i++)test(i);return best}
}

