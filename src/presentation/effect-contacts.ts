import type {RaceWorld} from '../simulation';
import type {Vector3} from 'three';
/** Read Rapier's existing solved contacts; never enable events or change collision response. */
export function effectContacts(race:RaceWorld){
 const bodies=new Map<string,number>();
 for(const [id,car]of race.participants){const t=car.telemetry(),q=t.quaternion,h=car.definition.comHeight;
  // Telemetry is the ground-relative presentation origin; Rapier stores the
  // center of mass. Include its rotated offset on the banked Ridge route.
  const x=t.position.x+2*h*(q.x*q.y-q.w*q.z),y=t.position.y+h*(1-2*(q.x*q.x+q.z*q.z)),z=t.position.z+2*h*(q.y*q.z+q.w*q.x);
  race.world.forEachRigidBody(body=>{const p=body.translation();if(Math.hypot(p.x-x,p.y-y,p.z-z)<.01)bodies.set(id,body.handle)});
 }
 return (id:string,point:Vector3)=>{
  const handle=bodies.get(id);if(handle===undefined)return false;const body=race.world.getRigidBody(handle);let hit=false;
  for(let i=0;i<body.numColliders()&&!hit;i++){const collider=body.collider(i);race.world.contactPairsWith(collider,other=>{if(hit||other.parent())return;race.world.contactPair(collider,other,m=>{if(hit||Math.abs(m.normal().y)>.6||m.numSolverContacts()===0)return;const p=m.solverContactPoint(0);if(p){point.set(p.x,p.y,p.z);hit=true}})})}
  return hit;
 };
}
