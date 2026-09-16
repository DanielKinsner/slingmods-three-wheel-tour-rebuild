import {projectRoad,sampleRoad,type CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
export function recoveryReason(t:VehicleTelemetry,route:CourseRoute){
 const q=t.quaternion,upright=1-2*(q.x*q.x+q.z*q.z),speed=Math.hypot(t.velocity.x,t.velocity.y,t.velocity.z);
 if(t.position.y<(route.elevations?(projectRoad(route,t.position.x,t.position.z).y??0)-6:-3))return 'Below the road';
 if(upright<.25&&speed<8)return 'Car overturned';
 if(speed<1.5&&projectRoad(route,t.position.x,t.position.z).distance>route.width/2+route.runoff+4)return 'Stranded off the course';
 if(speed<1&&!t.wheels.some(w=>w.contact))return 'Car stuck without tire support';
 return '';
}
export function freeRecoveryPose(route:CourseRoute,t:VehicleTelemetry){const projected=projectRoad(route,t.position.x,t.position.z),p=sampleRoad(route,projected.progress-6);return{x:p.x,y:p.y===undefined?route.start.y:p.y+.025,z:p.z,yaw:Math.atan2(-p.dx,-p.dz),...(p.dy===undefined?{}:{pitch:Math.atan(p.dy)})}}
/** Explicit arcade recovery. Scored events restart; a relocation cannot become a paid result. */
export class CrashRecovery {
 private node=document.createElement('aside');private reason='';private held=0;private shown=false;private count=0;
 constructor(parent:Element,private route:CourseRoute,private free:boolean,onRecover:()=>void){
  this.node.className='crash-recovery';this.node.style.cssText='position:fixed;left:50%;top:19%;transform:translateX(-50%);z-index:11000;width:min(460px,90vw);padding:18px;background:#171a1fee;color:#fff;border-top:3px solid #c51f28;font:15px/1.5 system-ui;box-shadow:0 8px 30px #0008';this.node.setAttribute('role','status');
  const title=document.createElement('strong');title.textContent='Need a hand getting back on the road?';const text=document.createElement('p');text.textContent=free?'Respawn upright on the road. Your preview build stays fitted.':'Respawn at the starting grid and restart this race. Your build and saved chapter progress stay safe; this attempt earns no reward.';
  const button=document.createElement('button');button.textContent=free?'Respawn car':'Respawn & restart race';button.dataset.recoverCar='';button.style.cssText='padding:12px 18px;background:#b51e27;color:white;border:1px solid #efeff2;font:600 15px system-ui;cursor:pointer';button.onclick=()=>{this.count++;this.clear();onRecover()};const hint=document.createElement('small');hint.textContent=' Or hold R / controller bottom face for one second to restart.';
  this.node.append(title,text,button,hint);this.node.hidden=true;parent.append(this.node);
 }
 update(t:VehicleTelemetry,dt:number,eligible:boolean){const reason=eligible?recoveryReason(t,this.route):'';this.held=reason?this.held+Math.min(.1,dt):0;this.reason=reason;this.shown=this.held>=1.25;this.node.hidden=!this.shown}
 clear(){this.held=0;this.shown=false;this.node.hidden=true}
 inspect(){return{available:this.shown,reason:this.reason,heldSeconds:this.held,recoveries:this.count,policy:this.free?'Unscored road respawn':'Fresh scored attempt at grid; no reward for abandoned attempt'}}
 dispose(){this.node.remove()}
}
