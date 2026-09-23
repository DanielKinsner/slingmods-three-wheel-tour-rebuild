import type {VehicleTelemetry} from '../simulation';
import {gameCue} from './audio-bus';
/**
 * Skill chains (arcade flavour, presentation only). While driving, stylish moments score points:
 *  DRIFT   rear tyre sliding (slip angle) at speed, scored per second
 *  AIR     all wheels off the ground
 *  SPEED   sustained pace above 90 mph
 *  NEAR MISS  passing a rival within a car's width at a closing speed
 * Each new skill in a chain raises the multiplier (max x5). The chain banks after a few quiet seconds; an impact
 * throws it away. Bests are remembered locally; nothing here touches race results, rewards or saves.
 */
type Kind='drift'|'air'|'speed'|'near';
const LABEL:Record<Kind,string>={drift:'DRIFT',air:'AIR',speed:'SPEED',near:'NEAR MISS'};
const BANK_AFTER=2.6,MAX_MULT=5,KEY='slingmods-gx-skills-v1';
export function skillsEnabled(){try{return localStorage.getItem('slingmods-gx-skills-on')!=='off'}catch{return true}}
export function setSkillsEnabled(on:boolean){try{localStorage.setItem('slingmods-gx-skills-on',on?'on':'off')}catch{}}
export interface SkillRecord {best:number;total:number;chains:number}
export function skillRecord():SkillRecord{try{const v=JSON.parse(localStorage.getItem(KEY)??'null');if(v)return {best:Number(v.best)||0,total:Number(v.total)||0,chains:Number(v.chains)||0}}catch{}return {best:0,total:0,chains:0}}
function saveRecord(r:SkillRecord){try{localStorage.setItem(KEY,JSON.stringify(r))}catch{/* private mode */}}
export class SkillChain {
 readonly root=document.createElement('div');
 private points=0;private mult=1;private kinds:Kind[]=[];private active:Kind|null=null;private quiet=0;private airTime=0;private speedTime=0;private lastSpeed=0;private near=new Map<string,number>();private sessionBest=0;private shownAt=0;
 constructor(parent:Element,private enabled=true){this.root.className='gx-skill';this.root.setAttribute('aria-hidden','true');this.root.innerHTML='<div class="gx-skill-chain"><b data-sk="pts">0</b><i data-sk="mult">x1</i></div><span data-sk="kinds"></span><small data-sk="bank"></small>';parent.append(this.root)}
 private q(k:string){return this.root.querySelector<HTMLElement>(`[data-sk=${k}]`)!}
 private add(kind:Kind,pts:number){if(!this.points&&!this.kinds.length){this.mult=1}if(!this.kinds.includes(kind)||this.active!==kind){if(this.kinds.length&&this.active!==kind)this.mult=Math.min(MAX_MULT,this.mult+1);this.kinds.push(kind);if(this.kinds.length>6)this.kinds.shift()}this.active=kind;this.quiet=0;this.points+=pts;if(performance.now()-this.shownAt>70)this.render(true)}
 update(t:VehicleTelemetry,field:Record<string,VehicleTelemetry>,dt:number,live:boolean){
  if(!this.enabled||dt<=0)return;if(!live){if(this.points)this.bank();this.lastSpeed=t.speed;return}
  const v=Math.abs(t.speed),mph=v*2.237,rear=t.wheels[2];let scored=false;
  // Impact: speed lost far faster than the brakes can explain throws the chain away.
  const decel=(Math.abs(this.lastSpeed)-Math.abs(t.speed))/dt;this.lastSpeed=t.speed;if(Math.abs(t.speed)>3&&decel-t.brake*10.8>17&&this.points){this.lose();return}
  if(rear?.contact&&v>11&&Math.abs(rear.slipAngle)>.16){this.add('drift',dt*v*Math.min(3,Math.abs(rear.slipAngle)*6)*6);scored=true}
  const airborne=t.wheels.every(w=>!w.contact);this.airTime=airborne?this.airTime+dt:0;if(this.airTime>.22){this.add('air',dt*420);scored=true}
  this.speedTime=mph>90?this.speedTime+dt:0;if(this.speedTime>1.2){this.add('speed',dt*mph*1.2);scored=true}
  for(const [id,o] of Object.entries(field)){if(id==='player')continue;const d=Math.hypot(o.position.x-t.position.x,o.position.z-t.position.z),rel=Math.hypot(o.velocity.x-t.velocity.x,o.velocity.z-t.velocity.z),last=this.near.get(id)??-99,now=performance.now()/1000;
   if(d<2.4&&d>1.05&&rel>2.5&&v>12&&now-last>3){this.near.set(id,now);this.add('near',250+rel*20);scored=true}}
  if(!scored&&this.points){this.active=null;this.quiet+=dt;if(this.quiet>BANK_AFTER)this.bank();else if(performance.now()-this.shownAt>120)this.render(false)}
 }
 private bank(){const total=Math.round(this.points*this.mult);if(total>=50){const r=skillRecord(),best=total>r.best;r.total+=total;r.chains++;if(best)r.best=total;saveRecord(r);this.sessionBest=Math.max(this.sessionBest,total);this.flash(`+${total.toLocaleString('en-US')}`,best?'NEW BEST CHAIN':`${this.kinds.map(k=>LABEL[k]).filter((x,i,a)=>a.indexOf(x)===i).join(' · ')}`,'bank');gameCue(best?'gx.record':'gx.reward')}else this.clear()}
 private lose(){this.flash('CHAIN LOST','Impact','lost');gameCue('gx.pos-down')}
 private flash(big:string,small:string,cls:string){this.points=0;this.mult=1;this.kinds=[];this.active=null;this.quiet=0;this.q('pts').textContent=big;this.q('mult').textContent='';this.q('kinds').textContent='';this.q('bank').textContent=small;this.root.dataset.state=cls;setTimeout(()=>{if(this.root.dataset.state===cls)this.clear()},1600)}
 private clear(){this.points=0;this.mult=1;this.kinds=[];this.root.dataset.state='';}
 private render(hot:boolean){this.shownAt=performance.now();this.root.dataset.state=hot?'live':'cool';this.q('pts').textContent=Math.round(this.points).toLocaleString('en-US');this.q('mult').textContent=`x${this.mult}`;this.q('kinds').textContent=this.kinds.map(k=>LABEL[k]).slice(-3).join(' + ');this.q('bank').style.setProperty('--gx-q',String(Math.min(1,this.quiet/BANK_AFTER)));this.q('bank').textContent=''}
 get best(){return this.sessionBest}
 dispose(){this.root.remove()}
}
