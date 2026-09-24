import './race.css';
import './race-menus.css';
import {shareCard} from './share';
import {pulse} from './rumble';
import {displaySpeed,speedLabel} from './units';
import {projectRoad,type CourseRoute} from '../course/environment';
import * as THREE from 'three';
import {countDrive,countMoment} from './achievements';
import {announceAchievements} from './toast';
import {isAttract} from './attract-flag';
import {gameCue} from './audio-bus';
import {setPrompts} from './shell';
import {tourProgress,repGain,rankTitle,repForLevel} from './progress';
import type {Career,Receipt} from '../career/store';
import {radioLine,CREW,portraitMarkup,type CrewId,type RadioMoment} from './crew';
/**
 * Race game-feel layer. Reads the existing race snapshot every frame and adds the moments a racing game is made of:
 * start lights, position-change callouts, checkpoint splits against your best, lap / final-lap banners, a finish slam,
 * and a results screen with an animated credits + Tour Rep tally. Presentation only: it never changes race rules,
 * results, rewards or saves (split bests live under their own local key and are cosmetic).
 */
interface Standing {id:string;place:number;status:string;lap:number;nextGate:number;timeMs:number|null}
export interface RaceSnapshotLike {event:string;attemptId?:string|null;laps:number;phase:string;paused:boolean;countdown:number;elapsedMs:number;standings:Standing[];playerResult:{valid:boolean;place:number|null;timeMs:number|null;status:string}|null;allFinished:boolean}
export interface RaceReward {credits:number;balance:number;before:Career|null;after?:Career|null;receipt?:Pick<Receipt,'kind'|'amount'>;first?:boolean}
const ordinal=(n:number)=>n+(n%100>=11&&n%100<=13?'TH':['TH','ST','ND','RD'][n%10]??'TH');
const fmt=(ms:number)=>{const s=Math.abs(ms)/1000,m=Math.floor(s/60);return `${m}:${(s-m*60).toFixed(3).padStart(6,'0')}`};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPLITS='slingmods-gx-splits-v1';
function readSplits(event:string):number[]|null{try{const all=JSON.parse(localStorage.getItem(SPLITS)??'{}');return Array.isArray(all[event])?all[event]:null}catch{return null}}
function writeSplits(event:string,splits:number[]){if(isAttract())return;try{const all=JSON.parse(localStorage.getItem(SPLITS)??'{}');all[event]=splits;localStorage.setItem(SPLITS,JSON.stringify(all))}catch{/* cosmetic only */}}

export class RaceFX {
 readonly root=document.createElement('div');
 private lights=document.createElement('div');private callout=document.createElement('div');private split=document.createElement('div');private flash=document.createElement('div');
 private radioNode=document.createElement('div');private radioAt=-Infinity;private radioTimer=0;private order:string[]=[];private trial:boolean;private shareInfo?:{timeMs:number;place:number|null;field:number};private route?:CourseRoute;private warn=document.createElement('div');private wrongFor=0;private offFor=0;private roadAt=0;private warnState='';private tagNodes=new Map<string,HTMLElement>();private v=new THREE.Vector3();private topSpeed=0;private vehicle:string;private field:CrewId[]=[];
 private phase='';private count=-1;private place=0;private lap=1;private gate=-1;private gates:number[]=[];private lapStart=0;private finished=false;private runKey='';private best:number[]|null=null;private freeDrive:boolean;
 private reward?:RaceReward;private tallied='';private menuObserver?:MutationObserver;private calloutTimer=0;private splitTimer=0;private prompts='';
 // Run accolades (presentation only): launch timing, contact, places gained, banked skill points, personal best.
 private launch:{kind:'perfect'|'great';ms:number}|null=null;private throttleSince=-1;private goAt=0;private launchJudged=true;private gridPlace=0;private contact=0;private contactAt=0;private offTrack=false;private skillPoints=0;private pbBy=0;private lastSpeed=0;private lastSpeedAt=0;private lastSnap?:RaceSnapshotLike;private accoladeKey='';
 // Transition beats: a lift from dark as the count begins; results wait for the finish slam to land first.
 private fade=document.createElement('div');private holdUntil=0;private holdTimer=0;
 constructor(parent:Element,options:{freeDrive?:boolean;trial?:boolean;vehicle?:string;route?:CourseRoute}={}){
  this.route=options.route;this.warn.className='gx-warn';
  this.freeDrive=!!options.freeDrive;this.trial=!!options.trial;this.vehicle=options.vehicle??'slingshot-r-2024';(parent as HTMLElement).dataset.gxMode=this.freeDrive?'free':this.trial?'trial':'race';this.radioNode.className='gx-radio';
  this.root.className='gx-race';this.root.setAttribute('aria-hidden','true');
  this.lights.className='gx-lights';this.lights.innerHTML='<div class="gx-gantry"><i></i><i></i><i></i></div><b></b>';
  this.callout.className='gx-callout';this.split.className='gx-split';this.flash.className='gx-flash';this.fade.className='gx-fade';
  this.root.append(this.fade,this.flash,this.lights,this.callout,this.split,this.radioNode,this.warn);parent.append(this.root);
  document.addEventListener('gx:radio',this.onRadio);document.addEventListener('gx:skill-bank',this.onSkill);
  const menu=document.getElementById('race-menu');if(menu){this.menuObserver=new MutationObserver(()=>this.decorateMenu(menu));this.menuObserver.observe(menu,{childList:true})}
 }
 /** Another layer (photo mode) replaced the prompt bar; force the next frame to restore the menu prompts. */
 refreshPrompts(){this.prompts=''}
 private onSkill=(e:Event)=>{if(!this.finished&&this.phase==='running')this.skillPoints+=Number((e as CustomEvent<{points:number}>).detail?.points)||0};
 /**
  * Launch timing and contact, read from the driver's own throttle (before the race's start hold) and the car's speed.
  * Throttle pressed from 0.35 s before the green to 0.2 s after is a PERFECT START; up to 0.45 s after is GREAT.
  * Revving from earlier than that earns nothing (no penalty). Contact uses the skill chain's impact rule.
  */
 drive(t:{speed:number;brake:number},throttle:number){
  const s=this.lastSnap,now=performance.now();if(!s||this.freeDrive)return;const on=throttle>.6;
  if(s.phase==='countdown'&&!s.paused){if(!on)this.throttleSince=-1;else if(this.throttleSince<0)this.throttleSince=s.countdown}
  if(s.phase==='running'&&!s.paused&&!this.finished){
   if(!this.launchJudged){const ms=now-this.goAt;if(on)this.judgeLaunch(ms);else if(ms>450)this.launchJudged=true}
   const dt=(now-this.lastSpeedAt)/1000,v=Math.abs(t.speed);if(dt>0&&dt<.2&&v>3&&(this.lastSpeed-v)/dt-t.brake*10.8>17&&now-this.contactAt>1000){this.contact++;this.contactAt=now}
  }
  this.lastSpeed=Math.abs(t.speed);this.lastSpeedAt=now;
 }
 /** Launch judged (the race host turns a good start into a boost in arcade races). */
 onLaunch?:(kind:'perfect'|'great')=>void;
 private judgeLaunch(ms:number){this.launchJudged=true;if(ms>450||ms<-350)return;this.launch={kind:ms<=200?'perfect':'great',ms};if(this.launch.kind==='perfect')countMoment('perfectStarts');this.onLaunch?.(this.launch.kind);
  const kind=this.launch.kind,text=ms<=0?'ON THE GREEN':`REACTION ${(ms/1000).toFixed(2)} S`;
  // The start lights stay up for 1.1 s after GO; the call-out waits for them so the two never overlap.
  setTimeout(()=>{if(this.finished)return;this.banner(`<b>${kind==='perfect'?'PERFECT START':'GREAT START'}</b><span>${text}</span>`,kind==='perfect'?'is-launch is-gold':'is-launch',1500);gameCue(kind==='perfect'?'gx.record':'gx.pos-up');if(kind==='perfect')pulse(.4,.7,160)},Math.max(0,1150-(performance.now()-this.goAt)))}
 private onRadio=(e:Event)=>{const d=(e as CustomEvent<{moment:RadioMoment;who?:CrewId}>).detail;this.radio(d.moment,d.who,true)};
 /** Crew radio: a portrait call-out that never stacks (one at a time, a short gap between them). */
 radio(moment:RadioMoment,who?:CrewId,force=false){const now=performance.now();if(!force&&now-this.radioAt<4200)return;const line=radioLine(moment,who);if(!line)return;this.radioAt=now;const m=line.member;this.radioNode.style.setProperty('--gx-crew',m.color);this.radioNode.innerHTML=`<img src="${m.portrait}" alt=""><div><b>${m.name}</b><span>${line.text}</span></div><i aria-hidden="true"></i>`;this.radioNode.classList.remove('is-on');void this.radioNode.offsetWidth;this.radioNode.classList.add('is-on');gameCue('gx.tab');clearTimeout(this.radioTimer);this.radioTimer=window.setTimeout(()=>this.radioNode.classList.remove('is-on'),3600)}
 /** Called by the drive when a career result commits: numbers for the tally (the text reward remains the source of truth). */
 setReward(reward:RaceReward){this.reward=reward;if(reward.after)setTimeout(()=>announceAchievements(reward.after!),2600);const menu=document.getElementById('race-menu');if(menu)this.decorateMenu(menu)}
 private show(node:HTMLElement,cls:string,html:string,ms:number,timer:'calloutTimer'|'splitTimer'){node.className=node.className.split(' ')[0]+' '+cls;node.innerHTML=html;node.classList.remove('is-on');void node.offsetWidth;node.classList.add('is-on');clearTimeout(this[timer]);this[timer]=window.setTimeout(()=>node.classList.remove('is-on'),ms)}
 private banner(html:string,cls='',ms=1600){this.show(this.callout,cls,html,ms,'calloutTimer')}
 /** Floating rival nameplates: livery colour, name and gap. Projected each frame; hidden off-screen, far away or in films. */
 tags(camera:THREE.Camera,field:Record<string,{position:{x:number;y:number;z:number}}>,hidden:boolean){
  const me=field.player;if(!me)return;const placed:{el:HTMLElement;x:number;y:number;d:number;text:string}[]=[];
  for(const id of this.field){const t=field[id];let el=this.tagNodes.get(id);if(!el){el=document.createElement('div');el.className='gx-tag';const m=CREW[id];el.style.setProperty('--gx-crew',m.color);el.innerHTML=`<b>${m.name}</b><span></span>`;this.root.append(el);this.tagNodes.set(id,el)}
   if(!t||hidden||this.finished){el.style.opacity='0';continue}
   const d=Math.hypot(t.position.x-me.position.x,t.position.z-me.position.z);this.v.set(t.position.x,t.position.y+1.55,t.position.z).project(camera);
   if(!(this.v.z<1&&this.v.z>-1&&Math.abs(this.v.x)<1.1&&Math.abs(this.v.y)<1.1&&d>2.5&&d<140)){el.style.opacity='0';continue}
   placed.push({el,x:(this.v.x+1)/2*innerWidth,y:(1-this.v.y)/2*innerHeight,d,text:d<10?'':`${Math.round(d)} m`})}
  // Nearest first keeps its spot; farther plates that would overlap stack upward.
  placed.sort((a,b)=>a.d-b.d);for(let i=0;i<placed.length;i++)for(let j=0;j<i;j++){const a=placed[i],b=placed[j];if(Math.abs(a.x-b.x)<96&&Math.abs(a.y-b.y)<24)a.y=b.y-24}
  for(const p of placed){p.el.style.transform=`translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`;p.el.style.opacity=String(Math.min(1,Math.max(.25,1.2-p.d/120)));const span=p.el.lastElementChild as HTMLElement;if(span.textContent!==p.text)span.textContent=p.text}
 }
 /** Wrong-way and off-track warnings from the player's heading against the course centreline (10 Hz, presentation only). */
 road(t:{position:{x:number;z:number};velocity:{x:number;z:number}},running:boolean){
  const now=performance.now();if(!this.route||now-this.roadAt<100)return;const dt=Math.min(.3,(now-this.roadAt)/1000);this.roadAt=now;
  let state='';if(running){const p=projectRoad(this.route,t.position.x,t.position.z),v=Math.hypot(t.velocity.x,t.velocity.z),dot=v>4?(t.velocity.x*p.dx+t.velocity.z*p.dz)/v:0;
   this.wrongFor=dot<-.5?this.wrongFor+dt:0;this.offFor=!this.freeDrive&&p.distance>this.route.width/2+.6?this.offFor+dt:0;
   state=this.wrongFor>.7?'wrong':this.offFor>.35?'off':''}else{this.wrongFor=this.offFor=0}
  if(state&&!this.finished)this.offTrack=true;
  if(state===this.warnState)return;this.warnState=state;this.warn.dataset.state=state;
  this.warn.innerHTML=state==='wrong'?'<i aria-hidden="true">⟲</i><b>WRONG WAY</b><span>Turn around · hold R to reset</span>':state==='off'?'<b>OFF TRACK</b><span>Rejoin the course · stay between the lines</span>':'';
  if(state==='wrong')gameCue('race.invalid');
 }
 update(s:RaceSnapshotLike,speed=0){
  const me=s.standings.find(x=>x.id==='player');if(!me)return;
  if(!this.field.length&&s.standings.length>1)this.field=s.standings.map(x=>x.id).filter(id=>id in CREW) as CrewId[];
  const key=s.event+':'+(s.attemptId??'');
  if(s.phase==='ready'&&this.phase!=='ready'||key!==this.runKey&&s.phase!=='finished'||this.phase==='finished'&&s.phase!=='finished'&&!s.playerResult)this.resetRun(key,s.event);
  // Start lights: three reds count down with the existing 3-second countdown, then all green on GO.
  if(s.phase==='countdown'&&this.phase!=='countdown'&&!reduced()){this.fade.classList.remove('is-on');void this.fade.offsetWidth;this.fade.classList.add('is-on')}
  if(s.phase==='countdown'&&!s.paused){const n=Math.ceil(s.countdown);if(this.phase!=='countdown'&&!this.freeDrive)setTimeout(()=>this.radio(this.trial?'trialStart':'start'),350);if(n!==this.count){this.count=n;this.lights.classList.add('is-on');this.lights.dataset.lit=String(Math.max(0,3-n+1));this.lights.classList.remove('is-go');if(n>0){this.lights.querySelector('b')!.textContent=String(n);this.pulse(this.lights.querySelector('b')!)}}}
  if(this.phase==='countdown'&&s.phase==='running'){this.goAt=performance.now();this.gridPlace=me.place;this.launchJudged=this.freeDrive;if(!this.freeDrive&&this.throttleSince>=0){if(this.throttleSince<=.35)this.judgeLaunch(-this.throttleSince*1000);else this.launchJudged=true}countDrive(this.freeDrive?'test':this.trial?'trial':'race',this.vehicle);this.count=-1;this.lights.dataset.lit='3';this.lights.classList.add('is-go');pulse(.5,.9,260);this.lights.querySelector('b')!.textContent='GO!';this.pulse(this.lights.querySelector('b')!);this.lapStart=0;setTimeout(()=>this.lights.classList.remove('is-on'),1100)}
  if(s.phase==='running'&&!s.paused&&!this.finished){this.topSpeed=Math.max(this.topSpeed,displaySpeed(speed));
   // Position changes (only in real races with a field).
   const order=s.standings.map(x=>x.id);
   if(s.standings.length>1&&!this.freeDrive&&this.place&&me.place!==this.place&&me.status==='running'){const up=me.place<this.place;const other=(up?order[me.place]:order[me.place-2]) as CrewId|undefined;if(other&&other in CREW)this.radio(up?'passedThem':'passedYou',other);this.banner(`<b>P${me.place}</b><span>${up?'▲ POSITION GAINED':'▼ POSITION LOST'}</span>`,up?'is-up':'is-down',1300);gameCue(up?'gx.pos-up':'gx.pos-down')}
   this.place=me.place;this.order=order;
   // Checkpoint splits against the best recorded run of this event.
   if(me.nextGate!==this.gate){if(this.gate>=0&&me.nextGate>this.gate||this.gate>0&&me.nextGate<this.gate){this.gates.push(s.elapsedMs);const i=this.gates.length-1,ref=this.best?.[i];if(!this.freeDrive&&ref!==undefined){const d=s.elapsedMs-ref;this.show(this.split,d<=0?'is-ahead':'is-behind',`<small>SPLIT ${i+1}</small><b>${d<=0?'−':'+'}${(Math.abs(d)/1000).toFixed(2)}</b>`,1800,'splitTimer')}}this.gate=me.nextGate}
   // Laps.
   if(me.lap!==this.lap&&me.lap>this.lap){const lapMs=s.elapsedMs-this.lapStart;this.lapStart=s.elapsedMs;this.lap=me.lap;const final=me.lap===s.laps&&s.laps>1;this.banner(`<small>LAP ${me.lap-1} · ${fmt(lapMs)}</small><b>${final?'FINAL LAP':'LAP '+me.lap+' / '+s.laps}</b>`,final?'is-final':'is-lap',1900);gameCue('gx.lap');if(final)this.radio('finalLap',undefined,true)}
  }
  // Finish slam.
  if(s.playerResult&&!this.finished){this.finished=true;const r=s.playerResult;this.holdResults(reduced()||isAttract()?0:1400);if(r.valid)this.shareInfo={timeMs:r.timeMs??s.elapsedMs,place:r.place,field:s.standings.length};setTimeout(()=>announceAchievements(null),3200);
   if(r.valid){const fieldRace=s.standings.length>1;if(fieldRace&&r.place===1&&!this.freeDrive&&!this.contact&&!this.offTrack)countMoment('cleanWins');this.banner(`<b>${fieldRace&&r.place?ordinal(r.place):'FINISH'}</b><span>${fieldRace?'FINISH':fmt(r.timeMs??s.elapsedMs)}</span>`,'is-finish '+(r.place===1&&fieldRace?'is-gold':''),2600);this.hit();gameCue('gx.slam');pulse(.8,1,380);if(fieldRace)setTimeout(()=>this.radio(r.place===1?'youWon':'theyWon',undefined,true),1200);
    const splits=[...this.gates,r.timeMs??s.elapsedMs],bestTotal=this.best?.at(-1);if(!this.freeDrive&&(bestTotal===undefined||(r.timeMs??Infinity)<bestTotal)){writeSplits(s.event,splits);if(bestTotal!==undefined&&r.timeMs!==null)this.pbBy=bestTotal-r.timeMs}}
   else{this.banner('<b>DNF</b><span>RUN NOT COUNTED</span>','is-down',2200)}}
  this.phase=s.phase;this.lastSnap=s;
  const paused=s.paused&&!s.playerResult;if(document.body.classList.contains('gx-paused')!==paused)document.body.classList.toggle('gx-paused',paused);
  (this.root.parentElement as HTMLElement|null)?.toggleAttribute('data-gx-solo',s.standings.length===1);
  const menuOpen=s.phase==='ready'||s.phase==='finished'||s.paused,primary=document.getElementById('start-crew')?.textContent?.trim(),label=primary||(s.paused?'Resume':s.playerResult?'Race again':'Start');const filming=document.body.classList.contains('race-film-active'),prompts=filming?'film':menuOpen?label:'none';if(prompts!==this.prompts){this.prompts=prompts;setPrompts(filming?[{key:'confirm',label:'Skip film'}]:menuOpen?[{key:'confirm',label}]:null)}
 }
 /** Keep the results menu out of the frame for a beat (display:none, so its own entrance animations play on reveal). */
 private holdResults(ms:number){clearTimeout(this.holdTimer);this.holdUntil=performance.now()+ms;document.body.classList.toggle('gx-results-hold',ms>0);if(ms>0)this.holdTimer=window.setTimeout(()=>document.body.classList.remove('gx-results-hold'),ms)}
 private held(){return Math.max(0,this.holdUntil-performance.now())}
 private resetRun(key:string,event:string){this.holdResults(0);this.runKey=key;this.shareInfo=undefined;this.topSpeed=0;this.finished=false;this.place=0;this.lap=1;this.gate=-1;this.gates=[];this.lapStart=0;this.count=-1;this.best=readSplits(event);this.tallied='';this.launch=null;this.throttleSince=-1;this.launchJudged=true;this.gridPlace=0;this.contact=0;this.offTrack=false;this.skillPoints=0;this.pbBy=0;this.accoladeKey=''}
 private pulse(node:HTMLElement){node.classList.remove('is-pulse');void node.offsetWidth;node.classList.add('is-pulse')}
 private hit(){if(reduced())return;this.flash.classList.remove('is-on');void this.flash.offsetWidth;this.flash.classList.add('is-on')}
 /** Results: ordinal slam, staggered standings, and the reward tally panel. Runs after CrewUI renders its menu. */
 private decorateMenu(menu:HTMLElement){
  // Every race menu (ready / pause / result) offers Options next to its own actions.
  const actions=menu.querySelector('.menu-actions');if(actions&&!actions.querySelector('[data-gx-options]')){if(menu.dataset.phase==='pause'){const r=document.createElement('button');r.type='button';r.dataset.action='retry';r.textContent='Restart';actions.querySelector('#start-crew')?.after(r);const p=document.createElement('button');p.type='button';p.dataset.gxPhoto='';p.textContent='Photo mode';actions.append(p)}const b=document.createElement('button');b.type='button';b.dataset.gxOptions='';b.textContent='Options';actions.append(b)}
  // Crew races open on a rival lineup: who you are about to race.
  if(menu.dataset.phase==='ready'&&this.field.length&&!menu.querySelector('.gx-lineup')){const h=menu.querySelector('h1');h?.insertAdjacentHTML('afterend',`<div class="gx-lineup is-grid">${this.field.map(id=>portraitMarkup(CREW[id],'gx-portrait is-small')).join('')}<figure class="gx-portrait is-small is-you"><span>YOU</span><figcaption><b>YOU</b><small>Your build</small></figcaption></figure></div>`)}
  if(menu.dataset.phase==='result'&&actions&&!actions.querySelector('[data-gx-share]')&&this.shareInfo){const b=document.createElement('button');b.type='button';b.dataset.gxShare='';b.textContent='Share';b.addEventListener('click',()=>void this.share(menu));actions.append(b)}
  if(menu.dataset.phase==='result'&&actions&&!actions.querySelector('[data-gx-replay]')){const r=document.createElement('button');r.type='button';r.dataset.gxReplay='';r.textContent='Watch replay';actions.querySelector('#start-crew')?.after(r)}
  if(actions)this.arrangeActions(menu,actions as HTMLElement);
  if(menu.dataset.phase==='pause'&&!menu.hidden&&!menu.querySelector('.gx-pause-status'))this.pauseStatus(menu);
  if(menu.dataset.phase!=='result'||menu.hidden){return}
  const place=Number(menu.dataset.place);const numeral=menu.querySelector<HTMLElement>('.result-numeral');
  if(numeral&&!numeral.dataset.gx&&Number.isFinite(place)&&place>0){numeral.dataset.gx='1';numeral.dataset.medal=place===1?'gold':place===2?'silver':place===3?'bronze':'';const small=numeral.querySelector('small'),sfx=document.createElement('sup');sfx.textContent=ordinal(place).replace(String(place),'');numeral.replaceChildren(document.createTextNode(String(place)),sfx,...(small?[small]:[]))}
  if(!menu.querySelector('.gx-run-stats')&&this.topSpeed>1){const p=document.createElement('p');p.className='gx-run-stats';p.innerHTML=`<span>TOP SPEED</span><b>${Math.round(this.topSpeed)}<small> ${speedLabel()}</small></b>`;menu.insertBefore(p,menu.querySelector('.result-standings,.menu-actions'))}
  this.accolades(menu);
  const r=this.reward;if(!r||menu.querySelector('.gx-reward'))return;
  const tallyKey=JSON.stringify([r.credits,r.balance]);const animate=this.tallied!==tallyKey&&!reduced();this.tallied=tallyKey;
  const gain=repGain(r.before,r.receipt),after=tourProgress(r.before);after.rep=gain.rep;
  const panel=document.createElement('section');panel.className='gx-reward';panel.setAttribute('aria-label',`Earned ${r.credits} credits and ${gain.gain} Tour Rep`);
  const floor=repForLevel(gain.level),next=repForLevel(gain.level+1),fill=next>floor?(gain.rep-floor)/(next-floor):1,startFill=gain.levelUp?0:Math.max(0,(gain.from.rep-floor)/(next-floor));
  panel.innerHTML=`<div class="gx-reward-row"><span>CREDITS EARNED</span><b data-count="${r.credits}">+0</b><small>BALANCE ${r.balance.toLocaleString('en-US')} CR</small></div><div class="gx-reward-row"><span>TOUR REP</span><b data-count="${gain.gain}">+0</b><small>LV ${gain.level} · ${rankTitle(gain.level)}</small></div><div class="gx-rep-bar"><i style="--gx-from:${startFill.toFixed(3)};--gx-to:${fill.toFixed(3)}"></i></div>${gain.levelUp?`<div class="gx-levelup"><b>LEVEL UP</b><span>LV ${gain.level} · ${rankTitle(gain.level)}</span></div>`:''}`;
  const anchor=menu.querySelector('.menu-actions');menu.insertBefore(panel,anchor);
  const counters=[...panel.querySelectorAll<HTMLElement>('[data-count]')];
  if(!animate){counters.forEach(c=>c.textContent='+'+Number(c.dataset.count).toLocaleString('en-US'));panel.classList.add('is-done');return}
  const start=performance.now()+this.held()+450,duration=1300;let lastTick=0;
  const step=(now:number)=>{if(!panel.isConnected)return;const t=Math.max(0,Math.min(1,(now-start)/duration)),e=1-Math.pow(1-t,3);for(const c of counters)c.textContent='+'+Math.round(Number(c.dataset.count)*e).toLocaleString('en-US');if(t>0&&t<1&&now-lastTick>55){lastTick=now;gameCue('gx.tick')}if(t<1)requestAnimationFrame(step);else{panel.classList.add('is-done');gameCue(gain.levelUp?'gx.levelup':'gx.reward')}};
  panel.classList.add('is-counting');requestAnimationFrame(step);
 }
 /**
  * One primary action, then an even row of secondary ones. Pause is a vertical list (Up/Down focus order follows the
  * DOM, so the DOM is reordered rather than styled): Continue, Restart, Photo mode, Options, Change event, Showroom.
  */
 private arrangeActions(menu:HTMLElement,actions:HTMLElement){
  const primary=actions.querySelector('#start-crew');
  if(menu.dataset.phase==='pause'){actions.dataset.gxLayout='list';actions.append(...[...actions.children].filter(c=>c.matches('a.shop-build-route')),...[...actions.children].filter(c=>c.matches('[data-action=bay]')));return}
  actions.dataset.gxLayout='row';let sub=actions.querySelector<HTMLElement>(':scope>.gx-actions-sub');if(!sub){sub=document.createElement('div');sub.className='gx-actions-sub';actions.append(sub)}
  for(const c of [...actions.children])if(c!==primary&&c!==sub&&!c.matches('[data-gx-replay],[data-action=save-result]'))sub.append(c);
 }
 /** Pause: where the race stands, frozen at the moment of the pause. */
 private pauseStatus(menu:HTMLElement){
  const s=this.lastSnap,me=s?.standings.find(x=>x.id==='player');if(!s||!me)return;
  const cells:[string,string][]=[];if(s.standings.length>1&&!this.freeDrive)cells.push(['POSITION',`${me.place}<small>/${s.standings.length}</small>`]);
  cells.push(['LAP',`${Math.min(s.laps,me.lap)}<small>/${s.laps}</small>`],['TIME',fmt(s.elapsedMs)]);
  if(this.topSpeed>1)cells.push(['TOP SPEED',`${Math.round(this.topSpeed)}<small> ${speedLabel()}</small>`]);
  const node=document.createElement('dl');node.className='gx-pause-status';node.innerHTML=cells.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  menu.querySelector('h1')?.nextElementSibling?.after(node);
 }
 /** Results: the few things worth celebrating about this run, popping in one after another. Never more than five. */
 private accolades(menu:HTMLElement){
  if(this.freeDrive||menu.querySelector('.gx-accolades')||!Number.isFinite(Number(menu.dataset.place)))return;
  const s=this.lastSnap,me=s?.standings.find(x=>x.id==='player'),field=(s?.standings.length??1)>1,list:[string,string,string][]=[];
  if(this.pbBy>0)list.push(['pb','PERSONAL BEST',`−${(this.pbBy/1000).toFixed(2)} S`]);
  if(this.launch)list.push([this.launch.kind,this.launch.kind==='perfect'?'PERFECT START':'GREAT START',this.launch.ms<=0?'ON THE GREEN':`${(this.launch.ms/1000).toFixed(2)} S`]);
  const gained=field&&me&&this.gridPlace?this.gridPlace-me.place:0;if(gained>0)list.push(['up','PLACES GAINED',`+${gained}`]);
  if(!this.contact&&!this.offTrack)list.push(['clean',field?'CLEAN RACE':'CLEAN LAP','NO CONTACT']);
  if(this.skillPoints>=50)list.push(['skill','SKILL POINTS',Math.round(this.skillPoints).toLocaleString('en-US')]);
  if(!list.length)return;
  const node=document.createElement('ul');node.className='gx-accolades';node.setAttribute('aria-label','Run highlights');
  node.innerHTML=list.slice(0,5).map(([k,label,value],i)=>`<li data-kind="${k}" style="--i:${i}"><b>${label}</b><span>${value}</span></li>`).join('');
  menu.insertBefore(node,menu.querySelector('.result-standings,.gx-reward,.menu-actions'));
  const key=this.runKey;if(this.accoladeKey===key||reduced())return;this.accoladeKey=key;
  list.slice(0,5).forEach((_,i)=>setTimeout(()=>{if(node.isConnected)gameCue('gx.tab')},this.held()+650+i*140));
 }
 private async share(menu:HTMLElement){const i=this.shareInfo;if(!i)return;const medal=menu.querySelector<HTMLElement>('.gx-medal')?.dataset.medal,course=(document.querySelector('.race-course-title')?.textContent??'').replace(/^.*·\s*/,'').trim()||'Three-Wheel Tour',label=menu.querySelector('.race-label')?.textContent??'';
  const kicker=this.trial?`Time Attack · ${medal&&medal!=='none'?medal.toUpperCase()+' medal':'Personal run'}`:i.field>1&&i.place?`${ordinal(i.place)} place · ${/CHAPTER/.test(label)?label.replace(/\s*\/\s*/,' · '):'Quick race'}`:label||'Clean lap';
  await shareCard({headline:fmt(i.timeMs),kicker,course,detail:[`Top speed ${Math.round(this.topSpeed)} ${speedLabel().toLowerCase()}`,this.vehicle==='can-am-spyder-f3'?'Can-Am Spyder F3':this.vehicle==='can-am-ryker-900'?'Can-Am Ryker 900':'Polaris Slingshot R'],accent:medal==='gold'?'#ffd23c':medal==='slingmods'?'#ff3b2f':undefined})}
 dispose(){this.menuObserver?.disconnect();document.removeEventListener('gx:radio',this.onRadio);document.removeEventListener('gx:skill-bank',this.onSkill);document.body.classList.remove('gx-paused','gx-results-hold');clearTimeout(this.holdTimer);this.root.remove()}
}
