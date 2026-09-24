import {steeringLimit,steeringDemandForAngle,type HandlingProfileId} from '../simulation/profile';
import {stabilizeRival} from './stability';
import type {CourseRoute} from '../course/environment';
import type {VehicleControl,VehicleTelemetry} from '../simulation';
import {RaceRoad} from './road';
export type RivalMode='follow'|'prepare-pass'|'pass'|'settle'|'recover';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const traits:Record<string,{pace:number;lateral:number;braking:number;headway:number;line:number}>={maya:{pace:21.8,lateral:2.8,braking:3.35,headway:1.2,line:-1.6},jett:{pace:22.5,lateral:3,braking:3.8,headway:1,line:0},nico:{pace:21.1,lateral:2.7,braking:3.2,headway:1.45,line:1.6},player:{pace:23,lateral:3.1,braking:3.6,headway:1,line:0}};
/** Racecraft personalities (current tunes only): how often pressure causes a small mistake (per second while a car
 *  sits on their tail), which mistake, and how they react to pressure. Jett brakes late and runs wide, Maya defends
 *  her line (one early move, never a chop across a car on her bumper), Nico is smooth and eventually moves over on a
 *  straight. */
const temperament:Record<string,{mistake:number;style:'wide'|'early';react:'defend'|'yield'|null}>={maya:{mistake:.05,style:'early',react:'defend'},jett:{mistake:.13,style:'wide',react:null},nico:{mistake:.04,style:'early',react:'yield'}};
const LEGACY_PROFILES=new Set<string>(['legacy-p08a','slingmods-sport-v1','slingmods-sport-v2']);
/** Production control-only pursuit. Strategy runs at 6Hz; no body mutation or gap-based physics changes. */
export class RivalController {
 private road:RaceRoad;private segment?:number;private time=0;private nextPlan=0;private targetLane=0;private lane=0;private heldUntil=0;private clearSince=0;private stationarySeconds=0;private stuckSeconds=0;private recoverySeconds=0;private recoveries=0;private mode:RivalMode='follow';private targetSpeed=0;private nearestGap=Infinity;private retiredReason:string|null=null;private preference:number;private trait:typeof traits[string];private stats={plans:0,passes:0,brakingTicks:0,recoveryTicks:0,mistakes:0,yields:0};
 private racecraft:boolean;private guards:number[]=[];private pressure=0;private mistakeUntil=0;private mistakeWide=0;private mistakeSlow=1;private reactUntil=0;private reacted=false;private random:()=>number;
 /** Light catch-up (set by the race host, Quick Race only): 0.97-1.03 on this rival's pace. Never used for career events. */
 catchUp=1;
 /** @param paceScale Quick Race difficulty only (1 = the certified crew pace used by every career event). */
 constructor(route:CourseRoute,readonly id:string,readonly seed=1,readonly profileId:HandlingProfileId='legacy-p08a',readonly paceScale=1){this.road=new RaceRoad(route);this.trait={...(traits[id]??traits.player)};if(profileId!=='legacy-p08a'){this.trait.pace*=2.28;this.trait.lateral*=route.width<13?1.4:1.8;this.trait.braking*=1.0;this.trait.headway*=1.15}if(route.elevations){this.trait.pace*=.86;this.trait.lateral*=.85}if(paceScale!==1){this.trait.pace*=paceScale;this.trait.lateral*=paceScale*paceScale;this.trait.braking*=paceScale}let h=seed>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;this.preference=this.trait.line+((h%1000)/1000-.5)*.25;this.targetLane=this.preference;this.racecraft=!LEGACY_PROFILES.has(profileId);let r=h||1;this.random=()=>{r=Math.imul(r^r>>>15,1|r)+0x6d2b79f5>>>0;return (r>>>0)/4294967296}}
 control(v:VehicleTelemetry,peers:Record<string,VehicleTelemetry>,dt=1/60):VehicleControl {
  this.time+=dt;if(this.retiredReason)return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true};
  const p=this.road.project(v.position.x,v.position.z,this.segment);this.segment=p.segment;const speed=Math.abs(v.speed),q=v.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+(this.road.route.elevations?q.x*q.x:q.z*q.z))),lateral=(v.position.x-p.x)*-p.dz+(v.position.z-p.z)*p.dx;
  if(this.time>=this.nextPlan){this.stats.plans++;this.nextPlan=this.time+1/6;let nearest:{gap:number;speed:number;lane:number}|null=null;const traffic:{ahead:number;lane:number;speed:number}[]=[];let chaser:{lane:number;gap:number}|null=null;
   for(const [id,other]of Object.entries(peers)){if(id===this.id)continue;const dx=other.position.x-v.position.x,dz=other.position.z-v.position.z,ahead=dx*p.dx+dz*p.dz,side=dx*-p.dz+dz*p.dx;if(Math.hypot(dx,dz)>65)continue;const lane=lateral+side,forwardSpeed=other.velocity.x*p.dx+other.velocity.z*p.dz;traffic.push({ahead,lane,speed:forwardSpeed});if(this.racecraft){if(ahead<-3&&ahead>-14&&Math.abs(side)<3&&(!chaser||-ahead<chaser.gap))chaser={lane,gap:-ahead}}if(ahead>0&&Math.abs(side)<2.5&&(!nearest||ahead<nearest.gap))nearest={gap:ahead,speed:forwardSpeed,lane}}
   this.nearestGap=nearest?.gap??Infinity;
   if(this.mode!=='recover'){
    if(nearest&&nearest.gap<12+speed*this.trait.headway&&nearest.speed<speed+1){
     if(this.mode==='follow'||this.mode==='settle'){this.mode='prepare-pass';this.heldUntil=this.time+.5}
     if(this.mode==='prepare-pass'&&this.time>=this.heldUntil){const edge=this.road.route.width/2-1.9,candidates=(this.racecraft&&edge>2.9&&this.straightAhead(p.progress)?[-edge,-2.7,2.7,edge]:[-2.7,2.7]).sort((a,b)=>Math.abs(a-lateral)-Math.abs(b-lateral));const open=candidates.find(l=>Math.abs(l-nearest!.lane)>2.5&&!traffic.some(o=>Math.abs(o.lane-l)<2.5&&o.ahead>-7-Math.max(0,o.speed-speed)*1.2&&o.ahead<12+Math.max(0,speed-o.speed)*1.2));if(open!==undefined){this.targetLane=open;this.mode='pass';this.heldUntil=this.time+4;this.stats.passes++}}
    }else if(this.mode==='pass'&&this.time>this.heldUntil){this.mode='settle';this.clearSince=this.time}else if(this.mode==='settle'&&this.time-this.clearSince>2&&!traffic.some(o=>Math.abs(o.lane-this.preference)<2.5&&Math.abs(o.ahead)<10)){this.targetLane=this.preference;this.mode='follow'}else if(this.mode==='prepare-pass'&&!nearest){this.mode='follow';this.targetLane=this.preference}
   }
   if(this.racecraft&&this.mode!=='recover'){this.planRacecraft(chaser,lateral,p.progress);
    // Wide lines are for straights: before a bend every car comes back inside the normal racing width.
    if(Math.abs(this.targetLane)>2.7&&!this.straightAhead(p.progress))this.targetLane=clamp(this.targetLane,-2.7,2.7)}
   // Longitudinal speed plan respects curvature and braking distance for the selected path.
   this.targetSpeed=this.trait.pace;for(let d=0;d<=(this.profileId==='legacy-p08a'?75:200);d+=5){const a=this.road.sample(p.progress+d-7),b=this.road.sample(p.progress+d+7),curvature=Math.abs(Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz))/14,corner=Math.sqrt(this.trait.lateral/Math.max(curvature,.001));this.targetSpeed=Math.min(this.targetSpeed,Math.sqrt(corner*corner+2*(this.road.route.elevations?Math.max(1.5,this.trait.braking+9.81*(b.dy??0)):this.trait.braking)*Math.max(0,d-7)))}
   for(const other of traffic){const pathOverlap=Math.abs(other.lane-this.lane)<2.45||Math.abs(other.lane-this.targetLane)<2.45;if(other.ahead>0&&pathOverlap){const clearance=Math.max(0,other.ahead-4.5),desired=5+speed*this.trait.headway*(this.racecraft?.5:1);const leavingBlockedLane=this.mode==='pass'&&Math.abs(other.lane-this.targetLane)>=2.45&&clearance>3;this.targetSpeed=Math.min(this.targetSpeed,leavingBlockedLane?Math.max(2,other.speed):Math.max(0,other.speed+(clearance-desired)*.65));if(clearance<1.5)this.targetSpeed=0}}
   if(this.racecraft){this.targetSpeed*=this.catchUp;if(this.time<this.mistakeUntil)this.targetSpeed*=this.mistakeSlow}
   if(p.distance>(this.profileId==='legacy-p08a'?3.9:this.road.route.width/2-1.2))this.targetSpeed=Math.min(this.targetSpeed,7);
  }
  let tighten=Infinity;
  {const goal=this.targetLane+(this.time<this.mistakeUntil?this.mistakeWide:0);let step=clamp(goal-this.lane,-.65*dt,.65*dt);
   if(this.racecraft){
    // Every tick: a car alongside (overlapping, within a lane) means hold the line. The aim never sits toward it, and a
    // car drifting toward it (running wide, still settling after a pass) lifts slightly to tighten up.
    this.guards=[];for(const [id,other]of Object.entries(peers)){if(id===this.id)continue;const dx=other.position.x-v.position.x,dz=other.position.z-v.position.z,ahead=dx*p.dx+dz*p.dz,side=dx*-p.dz+dz*p.dx;if(Math.abs(ahead)<5&&Math.abs(side)>.9&&Math.abs(side)<4.5)this.guards.push(side)}
    const drift=v.velocity.x*-p.dz+v.velocity.z*p.dx;
    for(const g of this.guards){if(step*g>0)step=0;if((this.lane+step-lateral)*g>.15)step=clamp(lateral+Math.sign(g)*.15-this.lane,-1.5*dt,1.5*dt);if(drift*g>.5)tighten=Math.min(tighten,speed*.94)}
   }
   this.lane+=step}
  this.stationarySeconds=speed<.5?this.stationarySeconds+dt:0;if(this.stationarySeconds>40)this.retiredReason='Blocked without a safe exit for40 seconds';
  this.stuckSeconds=speed<.7&&this.targetSpeed>2?this.stuckSeconds+dt:Math.max(0,this.stuckSeconds-dt*2);
  if(this.mode!=='recover'&&this.stuckSeconds>5){this.mode='recover';this.recoverySeconds=0;this.recoveries++;this.stuckSeconds=0}
  if(this.recoveries>=4){this.retiredReason='Stranded after three physical recovery attempts';return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true}}
  const look=this.mode==='pass'&&speed<7?3+speed*.4:(this.profileId==='legacy-p08a'?7+speed*.55:9+speed*.55),t=this.road.sample(p.progress+look),tx=t.x-t.dz*this.lane,tz=t.z+t.dx*this.lane,dx=tx-v.position.x,dz=tz-v.position.z,forward=-Math.sin(yaw)*dx-Math.cos(yaw)*dz,left=-Math.cos(yaw)*dx+Math.sin(yaw)*dz,angle=Math.atan2(left,forward),wheelbase=2.667,maxSteer=steeringLimit(speed,this.profileId,wheelbase),desired=Math.atan2(2*wheelbase*Math.sin(angle),Math.hypot(dx,dz)),steer=(this.profileId==='slingmods-sport-v3'||this.profileId==='slingmods-sport-v4'||this.profileId==='slingmods-sport-v5')?steeringDemandForAngle(desired*1.12,speed,this.profileId):clamp(desired/maxSteer*1.12,-1,1);
  if(this.mode==='recover'){this.stats.recoveryTicks++;this.recoverySeconds+=dt;const rearOccupied=Object.entries(peers).some(([id,o])=>{if(id===this.id)return false;const dx=o.position.x-v.position.x,dz=o.position.z-v.position.z;return dx*p.dx+dz*p.dz<0&&Math.hypot(dx,dz)<7});if(this.recoverySeconds>2.5){this.mode='follow';this.targetLane=this.preference;return {throttle:0,brake:1,steer:0,reverse:false,tractionControl:true}}return {throttle:rearOccupied?0:.4,brake:rearOccupied?1:0,steer:-steer,reverse:true,tractionControl:true}}
  const error=Math.min(this.targetSpeed,tighten)-v.speed,throttle=clamp(error*.36+.15,0,1),brake=clamp(-error*.25,0,1);if(brake>.1)this.stats.brakingTicks++;return stabilizeRival(v,{throttle,brake,steer,reverse:false,tractionControl:true},this.profileId);
 }
 /** No bend worth braking for in the next ~90 m. */
 private straightAhead(progress:number){const a=this.road.sample(progress+5),b=this.road.sample(progress+50),c=this.road.sample(progress+95);return a.dx*b.dx+a.dz*b.dz>.985&&a.dx*c.dx+a.dz*c.dz>.975}
 /** Pressure from a car close behind: personalities react, and now and then a small mistake opens a gap. */
 private planRacecraft(chaser:{lane:number;gap:number}|null,lateral:number,progress:number){
  const t=temperament[this.id];this.pressure=chaser?this.pressure+1/6:Math.max(0,this.pressure-1/3);
  if(this.reacted&&this.time>=this.reactUntil&&this.mode==='follow'&&(!chaser||this.pressure<1)){this.targetLane=this.preference;this.reacted=false}
  if(!t||!chaser)return;
  if(this.pressure>1.5&&this.time>=this.mistakeUntil&&this.random()<t.mistake/6){
   this.stats.mistakes++;this.mistakeUntil=this.time+1.4;
   if(t.style==='wide'){const a=this.road.sample(progress+20),b=this.road.sample(progress+45),turn=Math.sign(a.dx*b.dz-a.dz*b.dx);this.mistakeWide=clamp(-turn*1.4,-(this.road.route.width/2-1.9)-this.targetLane,this.road.route.width/2-1.9-this.targetLane);this.mistakeSlow=.96}
   else{this.mistakeWide=0;this.mistakeSlow=.9}
  }
  if(this.mode!=='follow'||this.time<this.reactUntil)return;
  const straight=this.straightAhead(progress),edge=this.road.route.width/2-1.9;
  if(t.react==='yield'&&this.pressure>3&&straight){this.targetLane=clamp(chaser.lane>lateral?-edge:edge,-edge,edge);this.reactUntil=this.time+5;this.reacted=true;this.stats.yields++}
  else if(t.react==='defend'&&this.pressure>1&&chaser.gap>7&&Math.abs(chaser.lane-lateral)>1.2&&!straight){this.targetLane=clamp(chaser.lane,-2.7,2.7);this.reactUntil=this.time+3;this.reacted=true}
 }
 inspect(){return {id:this.id,profileId:this.profileId,seed:this.seed,mode:this.mode,targetSpeed:this.targetSpeed,targetLane:this.targetLane,lane:this.lane,nearestGap:Number.isFinite(this.nearestGap)?this.nearestGap:null,retiredReason:this.retiredReason,recoveries:this.recoveries,...this.stats,...(this.racecraft?{guards:[...this.guards],pressure:this.pressure,mistake:this.time<this.mistakeUntil}:{})}}
}

