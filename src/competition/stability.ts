import {steeringLimit,type HandlingProfileId} from '../simulation/profile';
import type {VehicleControl,VehicleTelemetry} from '../simulation';
/** Contact recovery uses measured planar speed/slip, never extra tire force or a pose correction. */
export function stabilizeRival(v:VehicleTelemetry,control:VehicleControl,profileId:HandlingProfileId='legacy-p08a'):VehicleControl {
 const speed=Math.hypot(v.velocity.x,v.velocity.z);if(control.reverse||speed<4)return control;
 const q=v.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z)),left=-Math.cos(yaw)*v.velocity.x+Math.sin(yaw)*v.velocity.z,slip=Math.atan2(left,Math.max(.1,v.speed));
 if(Math.abs(slip)<.3)return control;
 // A spun car can still be moving fast even when its longitudinal speed approaches zero.
 // Cut power, shed speed, and point the fronts toward the velocity rather than adding wheelspin.
 const maxSteer=steeringLimit(v.speed,profileId),angle=Math.max(-.24,Math.min(.24,slip*.45-v.angularVelocity.y*.08));
 return {...control,throttle:0,brake:Math.max(control.brake,.4),steer:Math.max(-1,Math.min(1,angle/maxSteer))};
}
