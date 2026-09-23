import type {CourseRoute} from '../course/environment';
/** Sampling step (m) and the lateral grip (m/s^2) the coach assumes: calibrated so centreline corner speeds match the
 * production AI through the tightest 6% of each course (AI reaches 0.64-0.78 of an 8.2 m/s^2 limit). */
export const STEP=5,LATERAL=4.6;
/** Corner speed limit (m/s) every STEP metres around the loop. */
export function cornerProfile(route:CourseRoute){
 const pts=route.centerline,n=pts.length,cum=[0];for(let i=1;i<=n;i++){const a=pts[i-1],b=pts[i%n];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
 const L=cum[n],heading=(d:number)=>{d=((d%L)+L)%L;let i=0;while(i<n-1&&cum[i+1]<d)i++;const a=pts[i],b=pts[(i+1)%n];return Math.atan2(b[1]-a[1],b[0]-a[0])};
 const count=Math.ceil(L/STEP),limit:number[]=[];
 for(let k=0;k<count;k++){const d=k*STEP,span=24;let turn=heading(d+span)-heading(d-span);turn=Math.atan2(Math.sin(turn),Math.cos(turn));const radius=Math.abs(turn)>1e-3?(2*span)/Math.abs(turn):1e6;limit.push(Math.sqrt(LATERAL*radius))}
 return {length:L,limit};
}
