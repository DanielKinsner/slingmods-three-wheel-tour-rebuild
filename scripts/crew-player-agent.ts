import {RaceRoad} from '../src/competition/road';
import type {CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry,VehicleControl} from '../src/simulation';
import type {DeviceSample} from '../src/driving/input';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** Evidence-only virtual player. Produces ordinary controls; never imported by the shipped game. */
export class CrewPlayerAgent {
 private road:RaceRoad;private segment?:number;private lane=2;private launched=false;private completed=false;private lastProgress=0;
 constructor(route:CourseRoute){this.road=new RaceRoad(route)}
 control(v:VehicleTelemetry,_peers?:Record<string,VehicleTelemetry>,dt=1/60):VehicleControl{
 const p=this.road.project(v.position.x,v.position.z,this.segment);this.segment=p.segment;if(this.launched&&p.progress<this.lastProgress-500)this.completed=true;if(p.progress>20&&p.progress<200)this.launched=true;this.lastProgress=p.progress;
 const targetLane=!this.completed&&(p.progress<170||p.progress>this.road.route.length-30)?3.65:0;this.lane+=clamp(targetLane-this.lane,-1.2*dt,1.2*dt);
 const speed=Math.abs(v.speed),target=this.road.sample(p.progress+7+speed*.55),dx=target.x-target.dz*this.lane-v.position.x,dz=target.z+target.dx*this.lane-v.position.z,q=v.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z)),forward=-Math.sin(yaw)*dx-Math.cos(yaw)*dz,left=-Math.cos(yaw)*dx+Math.sin(yaw)*dz,angle=Math.atan2(left,forward),wheelbase=2.667,maxSteer=Math.min(.53/(1+speed*.037),Math.atan(5.4*wheelbase/Math.max(speed*speed,1))),desired=Math.atan2(2*wheelbase*Math.sin(angle),Math.hypot(dx,dz));
 let targetSpeed=23;for(let d=0;d<=70;d+=5){const a=this.road.sample(p.progress+d-7),b=this.road.sample(p.progress+d+7),curvature=Math.abs(Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz))/14,corner=Math.sqrt(3.1/Math.max(curvature,.001));targetSpeed=Math.min(targetSpeed,Math.sqrt(corner*corner+2*3.6*Math.max(0,d-7)))}const error=targetSpeed-v.speed;return {throttle:clamp(error*.36+.15,0,1),brake:clamp(-error*.22,0,1),steer:clamp(desired/maxSteer*1.12,-1,1),reverse:false,tractionControl:true};
 }
 sample(v:VehicleTelemetry,peers?:Record<string,VehicleTelemetry>,dt=1/60){return controlSample(this.control(v,peers,dt))}
}
export function controlSample(control:VehicleControl):DeviceSample {const axis=control.steer===0?0:-Math.sign(control.steer)*(.08+.92*Math.abs(control.steer)**(1/1.25)),buttons=Array.from({length:17},()=>({value:0,pressed:false}));buttons[7]={value:control.throttle,pressed:control.throttle>.5};buttons[6]={value:control.brake,pressed:control.brake>.5};return {keys:new Set(),focused:true,pads:[{index:0,id:'P05 explicitly labeled evidence-only virtual player',connected:true,mapping:'standard',axes:[axis,0,0,0],buttons}]}}
