import layout from '../../public/assets/slingshot-contact-layout.json';
import {pointInsideBox,type CourseRoute} from '../course/environment';
import {RaceRoad} from './road';
export const CREW_IDS=['maya','jett','nico','player'] as const;
export type GridPose={x:number;y:number;z:number;yaw:number};
/** Full authored width/length encloses the body and tire guards. Clearance is tested, not assumed. */
export function createCrewGrid(route:CourseRoute,order:readonly string[]=CREW_IDS):Record<string,GridPose>{
 if(order.length!==4||new Set(order).size!==4)throw Error('Crew grid requires four unique participants');
 const road=new RaceRoad(route),grid:Record<string,GridPose>={},corners:Record<string,{x:number;z:number}[]>={};
 order.forEach((id,index)=>{const d=-6-Math.floor(index/2)*7-(index%2)*1.5,p=road.sample(d),lane=index%2===0?-2:2,yaw=Math.atan2(-p.dx,-p.dz),pose={x:p.x-p.dz*lane,y:route.start.y,z:p.z+p.dx*lane,yaw};grid[id]=pose;corners[id]=[];
  for(const x of [-layout.width/2,layout.width/2])for(const z of [-layout.length/2,layout.length/2]){const c={x:pose.x+Math.cos(yaw)*x+Math.sin(yaw)*z,z:pose.z-Math.sin(yaw)*x+Math.cos(yaw)*z};corners[id].push(c);const g=route.checkpoints[0];if((c.x-g.x)*g.dx+(c.z-g.z)*g.dz>=-.5||road.project(c.x,c.z).distance>route.width/2-.2)throw Error(`Unsafe crew grid footprint: ${id}`);if(route.colliders.some(b=>pointInsideBox(b,c.x,.4,c.z,.2)))throw Error(`Grid collider overlap: ${id}`)}
 });
 for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++){const a=grid[order[i]],b=grid[order[j]],dx=b.x-a.x,dz=b.z-a.z,lateral=Math.abs(Math.cos(a.yaw)*dx-Math.sin(a.yaw)*dz),longitudinal=Math.abs(Math.sin(a.yaw)*dx+Math.cos(a.yaw)*dz);if(lateral<layout.width+.5&&longitudinal<layout.length+.5)throw Error('Crew grid participants overlap')}
 return grid;
}
