/** Finds obstacle-free 100 m squares in the Harbor Express world, nearest the road first (gymkhana lot placement). */
import {EXPRESS_ROUTE} from '../../src/express/route';import {createCourseEnvironment} from '../../src/course/environment';
const r=EXPRESS_ROUTE,env=createCourseEnvironment(r),obs=env.obstacles,S=Number(process.env.SIZE??100),half=S/2;
const distRoad=(x:number,z:number)=>{let best=Infinity;for(let i=0;i<r.centerline.length;i++){const a=r.centerline[i],b=r.centerline[(i+1)%r.centerline.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),px=a[0]+dx*t,pz=a[1]+dz*t;best=Math.min(best,Math.hypot(x-px,z-pz))}return best};
const out:{x:number;z:number;d:number}[]=[];
for(let x=-800;x<=700;x+=10)for(let z=-1150;z<=350;z+=10){
 if(obs.some(o=>Math.abs(o.center[0]-x)<half+o.size[0]/2+4&&Math.abs(o.center[2]-z)<half+o.size[2]/2+4))continue;
 let d=Infinity;for(const [ox,oz] of [[-half,-half],[half,-half],[-half,half],[half,half],[0,-half],[0,half],[-half,0],[half,0]])d=Math.min(d,distRoad(x+ox,z+oz));if(d<25)continue;out.push({x,z,d});
}
out.sort((a,b)=>a.d-b.d);console.log(out.length,'clear squares; nearest the road:');for(const o of out.slice(0,25))console.log(o.x,o.z,'edge-to-road',o.d.toFixed(0));
