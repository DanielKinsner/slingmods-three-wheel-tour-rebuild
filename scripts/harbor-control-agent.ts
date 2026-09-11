import {projectRoad,sampleRoad,type CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry} from '../src/simulation';
import type {DeviceSample} from '../src/driving/input';
/** Isolated evidence-only controller. It emits standard device inputs; never writes vehicle pose. */
export function harborAgent(route:CourseRoute,v:VehicleTelemetry):{sample:DeviceSample;targetSpeed:number;roadDistance:number;progress:number}{
 const p=projectRoad(route,v.position.x,v.position.z),speed=Math.abs(v.speed),look=7+speed*.55,target=sampleRoad(route,p.progress+look),q=v.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z));
 const dx=target.x-v.position.x,dz=target.z-v.position.z,forward=-Math.sin(yaw)*dx-Math.cos(yaw)*dz,left=-Math.cos(yaw)*dx+Math.sin(yaw)*dz,angle=Math.atan2(left,forward),wheelbase=2.667;
 const maxSteer=Math.min(.53/(1+speed*.037),Math.atan(5.4*wheelbase/Math.max(speed*speed,1))),desired=Math.atan2(2*wheelbase*Math.sin(angle),Math.hypot(dx,dz));
 const steer=Math.max(-1,Math.min(1,desired/maxSteer*1.12));let targetSpeed=23;
 for(let d=0;d<=70;d+=5){const a=sampleRoad(route,p.progress+d-7),b=sampleRoad(route,p.progress+d+7),cross=a.dx*b.dz-a.dz*b.dx,dot=a.dx*b.dx+a.dz*b.dz,curvature=Math.abs(Math.atan2(cross,dot))/14,corner=Math.sqrt(3.1/Math.max(curvature,.001));targetSpeed=Math.min(targetSpeed,Math.sqrt(corner*corner+2*3.6*Math.max(0,d-7)))}
 const error=targetSpeed-v.speed,throttle=Math.max(0,Math.min(1,error*.36+.15)),brake=Math.max(0,Math.min(1,-error*.22));
 const axis=steer===0?0:-Math.sign(steer)*(.08+.92*Math.abs(steer)**(1/1.25)),buttons=Array.from({length:17},()=>({value:0,pressed:false}));buttons[7]={value:throttle,pressed:throttle>.5};buttons[6]={value:brake,pressed:brake>.5};
 return {sample:{keys:new Set(),focused:true,pads:[{index:0,id:'P04A local physics control agent (not opponent)',connected:true,mapping:'standard',axes:[axis,0,0,0],buttons}]},targetSpeed,roadDistance:p.distance,progress:p.progress};
}
export function neutralAgentSample():DeviceSample{return {keys:new Set(),focused:true,pads:[{index:0,id:'P04A local physics control agent (not opponent)',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}]}}
