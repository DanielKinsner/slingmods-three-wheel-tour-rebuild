import {steeringLimit,steeringDemandForAngle,type HandlingProfileId} from '../simulation/profile';
import {stabilizeRival} from './stability';
import type {CourseRoute} from '../course/environment';
import type {VehicleControl,VehicleTelemetry} from '../simulation';
import {RaceRoad} from './road';
export type RivalMode='follow'|'prepare-pass'|'pass'|'settle'|'recover';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const traits:Record<string,{pace:number;lateral:number;braking:number;headway:number;line:number}>={maya:{pace:21.8,lateral:2.8,braking:3.35,headway:1.2,line:-1.6},jett:{pace:22.5,lateral:3,braking:3.8,headway:1,line:0},nico:{pace:21.1,lateral:2.7,braking:3.2,headway:1.45,line:1.6},player:{pace:23,lateral:3.1,braking:3.6,headway:1,line:0}};
/** Production control-only pursuit. Strategy runs at 6Hz; no body mutation or gap-based physics changes. */
export class RivalController {
 private road:RaceRoad;private segment?:number;private time=0;private nextPlan=0;private targetLane=0;private lane=0;private heldUntil=0;private clearSince=0;private stationarySeconds=0;private stuckSeconds=0;private recoverySeconds=0;private recoveries=0;private mode:RivalMode='follow';private targetSpeed=0;private nearestGap=Infinity;private retiredReason:string|null=null;private preference:number;private trait:typeof traits[string];private stats={plans:0,passes:0,brakingTicks:0,recoveryTicks:0};
 constructor(route:CourseRoute,readonly id:string,readonly seed=1,readonly profileId:HandlingProfileId='legacy-p08a'){this.road=new RaceRoad(route);this.trait={...(traits[id]??traits.player)};if(profileId!=='legacy-p08a'){this.trait.pace*=2.28;this.trait.lateral*=route.width<13?1.4:1.8;this.trait.braking*=1.0;this.trait.headway*=1.15}if(route.elevations){this.trait.pace*=.86;this.trait.lateral*=.85}let h=seed>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;this.preference=this.trait.line+((h%1000)/1000-.5)*.25;this.targetLane=this.preference}
 control(v:VehicleTelemetry,peers:Record<string,VehicleTelemetry>,dt=1/60):VehicleControl {
  this.time+=dt;if(this.retiredReason)return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true};
  const p=this.road.project(v.position.x,v.position.z,this.segment);this.segment=p.segment;const speed=Math.abs(v.speed),q=v.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+(this.road.route.elevations?q.x*q.x:q.z*q.z))),lateral=(v.position.x-p.x)*-p.dz+(v.position.z-p.z)*p.dx;
  if(this.time>=this.nextPlan){this.stats.plans++;this.nextPlan=this.time+1/6;let nearest:{gap:number;speed:number;lane:number}|null=null;const traffic:{ahead:number;lane:number;speed:number}[]=[];
   for(const [id,other]of Object.entries(peers)){if(id===this.id)continue;const dx=other.position.x-v.position.x,dz=other.position.z-v.position.z,ahead=dx*p.dx+dz*p.dz,side=dx*-p.dz+dz*p.dx;if(Math.hypot(dx,dz)>65)continue;const lane=lateral+side,forwardSpeed=other.velocity.x*p.dx+other.velocity.z*p.dz;traffic.push({ahead,lane,speed:forwardSpeed});if(ahead>0&&Math.abs(side)<2.5&&(!nearest||ahead<nearest.gap))nearest={gap:ahead,speed:forwardSpeed,lane}}
   this.nearestGap=nearest?.gap??Infinity;
   if(this.mode!=='recover'){
    if(nearest&&nearest.gap<12+speed*this.trait.headway&&nearest.speed<speed+1){
     if(this.mode==='follow'||this.mode==='settle'){this.mode='prepare-pass';this.heldUntil=this.time+.5}
     if(this.mode==='prepare-pass'&&this.time>=this.heldUntil){const candidates=[-2.7,2.7].sort((a,b)=>Math.abs(a-lateral)-Math.abs(b-lateral));const open=candidates.find(l=>Math.abs(l-nearest!.lane)>2.5&&!traffic.some(o=>Math.abs(o.lane-l)<2.5&&o.ahead>-7-Math.max(0,o.speed-speed)*1.2&&o.ahead<12+Math.max(0,speed-o.speed)*1.2));if(open!==undefined){this.targetLane=open;this.mode='pass';this.heldUntil=this.time+4;this.stats.passes++}}
    }else if(this.mode==='pass'&&this.time>this.heldUntil){this.mode='settle';this.clearSince=this.time}else if(this.mode==='settle'&&this.time-this.clearSince>2&&!traffic.some(o=>Math.abs(o.lane-this.preference)<2.5&&Math.abs(o.ahead)<10)){this.targetLane=this.preference;this.mode='follow'}else if(this.mode==='prepare-pass'&&!nearest){this.mode='follow';this.targetLane=this.preference}
   }
   // Longitudinal speed plan respects curvature and braking distance for the selected path.
   this.targetSpeed=this.trait.pace;for(let d=0;d<=(this.profileId==='legacy-p08a'?75:200);d+=5){const a=this.road.sample(p.progress+d-7),b=this.road.sample(p.progress+d+7),curvature=Math.abs(Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz))/14,corner=Math.sqrt(this.trait.lateral/Math.max(curvature,.001));this.targetSpeed=Math.min(this.targetSpeed,Math.sqrt(corner*corner+2*(this.road.route.elevations?Math.max(1.5,this.trait.braking+9.81*(b.dy??0)):this.trait.braking)*Math.max(0,d-7)))}
   for(const other of traffic){const pathOverlap=Math.abs(other.lane-this.lane)<2.45||Math.abs(other.lane-this.targetLane)<2.45;if(other.ahead>0&&pathOverlap){const clearance=Math.max(0,other.ahead-4.5),desired=5+speed*this.trait.headway;const leavingBlockedLane=this.mode==='pass'&&Math.abs(other.lane-this.targetLane)>=2.45&&clearance>3;this.targetSpeed=Math.min(this.targetSpeed,leavingBlockedLane?Math.max(2,other.speed):Math.max(0,other.speed+(clearance-desired)*.65));if(clearance<1.5)this.targetSpeed=0}}
   if(p.distance>(this.profileId==='legacy-p08a'?3.9:this.road.route.width/2-1.2))this.targetSpeed=Math.min(this.targetSpeed,7);
  }
  this.lane+=clamp(this.targetLane-this.lane,-.65*dt,.65*dt);
  this.stationarySeconds=speed<.5?this.stationarySeconds+dt:0;if(this.stationarySeconds>40)this.retiredReason='Blocked without a safe exit for40 seconds';
  this.stuckSeconds=speed<.7&&this.targetSpeed>2?this.stuckSeconds+dt:Math.max(0,this.stuckSeconds-dt*2);
  if(this.mode!=='recover'&&this.stuckSeconds>5){this.mode='recover';this.recoverySeconds=0;this.recoveries++;this.stuckSeconds=0}
  if(this.recoveries>=4){this.retiredReason='Stranded after three physical recovery attempts';return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true}}
  const look=this.mode==='pass'&&speed<7?3+speed*.4:(this.profileId==='legacy-p08a'?7+speed*.55:9+speed*.55),t=this.road.sample(p.progress+look),tx=t.x-t.dz*this.lane,tz=t.z+t.dx*this.lane,dx=tx-v.position.x,dz=tz-v.position.z,forward=-Math.sin(yaw)*dx-Math.cos(yaw)*dz,left=-Math.cos(yaw)*dx+Math.sin(yaw)*dz,angle=Math.atan2(left,forward),wheelbase=2.667,maxSteer=steeringLimit(speed,this.profileId,wheelbase),desired=Math.atan2(2*wheelbase*Math.sin(angle),Math.hypot(dx,dz)),steer=(this.profileId==='slingmods-sport-v3'||this.profileId==='slingmods-sport-v4')?steeringDemandForAngle(desired*1.12,speed,this.profileId):clamp(desired/maxSteer*1.12,-1,1);
  if(this.mode==='recover'){this.stats.recoveryTicks++;this.recoverySeconds+=dt;const rearOccupied=Object.entries(peers).some(([id,o])=>{if(id===this.id)return false;const dx=o.position.x-v.position.x,dz=o.position.z-v.position.z;return dx*p.dx+dz*p.dz<0&&Math.hypot(dx,dz)<7});if(this.recoverySeconds>2.5){this.mode='follow';this.targetLane=this.preference;return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true}}return {throttle:rearOccupied?0:.4,brake:rearOccupied?1:0,steer:-steer,reverse:true,tractionControl:true}}
  const error=this.targetSpeed-v.speed,throttle=clamp(error*.36+.15,0,1),brake=clamp(-error*.25,0,1);if(brake>.1)this.stats.brakingTicks++;return stabilizeRival(v,{throttle,brake,steer,reverse:false,tractionControl:true},this.profileId);
 }
 inspect(){return {id:this.id,profileId:this.profileId,seed:this.seed,mode:this.mode,targetSpeed:this.targetSpeed,targetLane:this.targetLane,lane:this.lane,nearestGap:Number.isFinite(this.nearestGap)?this.nearestGap:null,retiredReason:this.retiredReason,recoveries:this.recoveries,...this.stats}}
}

