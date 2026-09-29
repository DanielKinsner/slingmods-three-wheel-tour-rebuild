import {projectRoad,sampleRoad,type CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
import {CREW,type CrewId} from '../game/crew';
/** `area` marks extra drivable ground off the course (the Gymkhana Lot): being there is not "stranded". */
export function recoveryReason(t:VehicleTelemetry,route:CourseRoute,area?:(x:number,z:number)=>boolean){
 const q=t.quaternion,upright=1-2*(q.x*q.x+q.z*q.z),speed=Math.hypot(t.velocity.x,t.velocity.y,t.velocity.z);
 if(t.position.y<(route.elevations?(projectRoad(route,t.position.x,t.position.z).y??0)-6:-3))return 'Below the road';
 if(upright<.25&&speed<8)return 'Car overturned';
 if(speed<1.5&&!area?.(t.position.x,t.position.z)&&projectRoad(route,t.position.x,t.position.z).distance>route.width/2+route.runoff+4)return 'Stranded off the course';
 if(speed<1&&!t.wheels.some(w=>w.contact))return 'Car stuck without tire support';
 return '';
}
export function freeRecoveryPose(route:CourseRoute,t:VehicleTelemetry){const projected=projectRoad(route,t.position.x,t.position.z),p=sampleRoad(route,projected.progress-6);return{x:p.x,y:p.y===undefined?route.start.y:p.y+.025,z:p.z,yaw:Math.atan2(-p.dx,-p.dz),...(p.dy===undefined?{}:{pitch:Math.atan(p.dy)})}}
/** Playful card headline for each stuck reason (the reasons themselves stay the tested wording). */
export const RECOVERY_LABELS:Record<string,string>={'Car overturned':'ROLLED IT','Below the road':'OFF THE EDGE','Stranded off the course':'OFF THE MAP','Car stuck without tire support':'BEACHED'};
const RECOVERY_LINES:Record<string,[CrewId,string][]>={
 'ROLLED IT':[['rae',"Shiny side up, please. We'll flip you back."],['jett','Bold way to show everyone the underglow.'],['maya',"Happens to the best of us. Let's go again."]],
 'OFF THE EDGE':[['rae',"That's not the course. Tow truck's on the way."],['maya','Deep breath. Back to the road.']],
 'OFF THE MAP':[['rae',"Scenic route? Let's get you back on the tarmac."],['nico',"The road's that way. I checked."]],
 'BEACHED':[['rae',"You're high-centred. Sit tight, we've got you."],['jett','Nice parking. Wrong spot.']],
};
export type RecoveryUI={cue?:(id:'gx.slam'|'gx.whoosh')=>void;input?:()=>string};
/**
 * Explicit arcade recovery. Scored events restart; a relocation cannot become a paid result.
 * Presented as a crew moment (feel pass): a playful reason, a crew radio line, and the game's own input glyph with a
 * ring that fills while the reset button is held (the resolver's 1 s hold).
 */
export class CrashRecovery {
 private node=document.createElement('aside');private reason='';private held=0;private shown=false;private count=0;private label='';
 private headline:HTMLElement;private crew:HTMLElement;private glyph:HTMLElement;
 constructor(parent:Element,private route:CourseRoute,private free:boolean,onRecover:()=>void,private area?:(x:number,z:number)=>boolean,private ui:RecoveryUI={}){
  this.node.className='gx-recovery crash-recovery';this.node.setAttribute('role','status');
  this.node.innerHTML=`<div class="gx-recovery-head"><span class="gx-recovery-tag">CREW RECOVERY</span><strong class="gx-recovery-reason"></strong></div>
   <div class="gx-recovery-radio"><img alt=""><p><b></b><span></span></p><i class="gx-recovery-eq" aria-hidden="true"><s></s><s></s><s></s></i></div>
   <button class="gx-recovery-go" data-recover-car=""><span class="gx-recovery-ring" aria-hidden="true"><kbd class="gx-glyph gx-key">R</kbd></span><span class="gx-recovery-go-label">${free?'RESPAWN':'RESTART RACE'}</span><small>HOLD OR CLICK</small></button>
   <p class="gx-recovery-rule">${free?'Back on the road, upright. Your build stays fitted.':'Back to the grid for a fresh start. Your build and chapter progress are safe; this attempt earns no reward.'}</p>`;
  this.headline=this.node.querySelector('.gx-recovery-reason')!;this.crew=this.node.querySelector('.gx-recovery-radio')!;this.glyph=this.node.querySelector('kbd')!;
  const button=this.node.querySelector<HTMLButtonElement>('button')!;button.onclick=()=>{this.count++;this.ui.cue?.('gx.whoosh');this.clear();onRecover()};
  this.node.hidden=true;parent.append(this.node);
 }
 /** `hold` is the reset button's hold progress, 0-1 (InputResolver.resetHold). */
 update(t:VehicleTelemetry,dt:number,eligible:boolean,hold=0){
  const reason=eligible?recoveryReason(t,this.route,this.area):'';this.held=reason?this.held+Math.min(.1,dt):0;this.reason=reason;
  const show=this.held>=1.25;if(show&&!this.shown)this.present(reason);this.shown=show;this.node.hidden=!show;
  if(show)this.node.style.setProperty('--gx-hold',String(Math.max(0,Math.min(1,hold))));
 }
 private present(reason:string){
  const label=RECOVERY_LABELS[reason]??'STUCK',lines=RECOVERY_LINES[label]??RECOVERY_LINES['OFF THE MAP'],[id,text]=lines[Math.floor(Math.random()*lines.length)],member=CREW[id];
  this.label=label;this.headline.textContent=label;this.crew.style.setProperty('--gx-crew',member.color);this.crew.querySelector('img')!.src=member.portrait;this.crew.querySelector('b')!.textContent=member.name;this.crew.querySelector('p span')!.textContent=text;
  const kind=this.ui.input?.()??'keyboard';this.glyph.textContent=kind==='pad'?'A':kind==='touch'?'↺':'R';this.glyph.className='gx-glyph '+(kind==='pad'?'gx-pad gx-pad-a':'gx-key');this.node.querySelector('.gx-recovery-go small')!.textContent=kind==='touch'?'TAP':kind==='pad'?'HOLD':'HOLD OR CLICK';
  this.ui.cue?.('gx.slam');
 }
 clear(){this.held=0;this.shown=false;this.node.hidden=true}
 inspect(){return{available:this.shown,reason:this.reason,label:this.label,heldSeconds:this.held,recoveries:this.count,policy:this.free?'Unscored road respawn':'Fresh scored attempt at grid; no reward for abandoned attempt'}}
 dispose(){this.node.remove()}
}
