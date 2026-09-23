import './race.css';
import {displaySpeed,speedLabel} from './units';
import {projectRoad,type CourseRoute} from '../course/environment';
import * as THREE from 'three';
import {countDrive} from './achievements';
import {announceAchievements} from './toast';
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
function writeSplits(event:string,splits:number[]){try{const all=JSON.parse(localStorage.getItem(SPLITS)??'{}');all[event]=splits;localStorage.setItem(SPLITS,JSON.stringify(all))}catch{/* cosmetic only */}}

export class RaceFX {
 readonly root=document.createElement('div');
 private lights=document.createElement('div');private callout=document.createElement('div');private split=document.createElement('div');private flash=document.createElement('div');
 private radioNode=document.createElement('div');private radioAt=-Infinity;private radioTimer=0;private order:string[]=[];private trial:boolean;private route?:CourseRoute;private warn=document.createElement('div');private wrongFor=0;private offFor=0;private roadAt=0;private warnState='';private tagNodes=new Map<string,HTMLElement>();private v=new THREE.Vector3();private topSpeed=0;private vehicle:string;private field:CrewId[]=[];
 private phase='';private count=-1;private place=0;private lap=1;private gate=-1;private gates:number[]=[];private lapStart=0;private finished=false;private runKey='';private best:number[]|null=null;private freeDrive:boolean;
 private reward?:RaceReward;private tallied='';private menuObserver?:MutationObserver;private calloutTimer=0;private splitTimer=0;private prompts='';
 constructor(parent:Element,options:{freeDrive?:boolean;trial?:boolean;vehicle?:string;route?:CourseRoute}={}){
  this.route=options.route;this.warn.className='gx-warn';
  this.freeDrive=!!options.freeDrive;this.trial=!!options.trial;this.vehicle=options.vehicle??'slingshot-r-2024';(parent as HTMLElement).dataset.gxMode=this.freeDrive?'free':this.trial?'trial':'race';this.radioNode.className='gx-radio';
  this.root.className='gx-race';this.root.setAttribute('aria-hidden','true');
  this.lights.className='gx-lights';this.lights.innerHTML='<i></i><i></i><i></i><b></b>';
  this.callout.className='gx-callout';this.split.className='gx-split';this.flash.className='gx-flash';
  this.root.append(this.flash,this.lights,this.callout,this.split,this.radioNode,this.warn);parent.append(this.root);
  document.addEventListener('gx:radio',this.onRadio);
  const menu=document.getElementById('race-menu');if(menu){this.menuObserver=new MutationObserver(()=>this.decorateMenu(menu));this.menuObserver.observe(menu,{childList:true})}
 }
 /** Another layer (photo mode) replaced the prompt bar; force the next frame to restore the menu prompts. */
 refreshPrompts(){this.prompts=''}
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
  if(s.phase==='countdown'&&!s.paused){const n=Math.ceil(s.countdown);if(this.phase!=='countdown'&&!this.freeDrive)setTimeout(()=>this.radio(this.trial?'trialStart':'start'),350);if(n!==this.count){this.count=n;this.lights.classList.add('is-on');this.lights.dataset.lit=String(Math.max(0,3-n+1));this.lights.classList.remove('is-go');if(n>0){this.lights.querySelector('b')!.textContent=String(n);this.pulse(this.lights.querySelector('b')!)}}}
  if(this.phase==='countdown'&&s.phase==='running'){countDrive(this.freeDrive?'test':this.trial?'trial':'race',this.vehicle);this.count=-1;this.lights.dataset.lit='3';this.lights.classList.add('is-go');this.lights.querySelector('b')!.textContent='GO!';this.pulse(this.lights.querySelector('b')!);this.lapStart=0;setTimeout(()=>this.lights.classList.remove('is-on'),1100)}
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
  if(s.playerResult&&!this.finished){this.finished=true;const r=s.playerResult;setTimeout(()=>announceAchievements(null),3200);
   if(r.valid){const fieldRace=s.standings.length>1;this.banner(`<b>${fieldRace&&r.place?ordinal(r.place):'FINISH'}</b><span>${fieldRace?'FINISH':fmt(r.timeMs??s.elapsedMs)}</span>`,'is-finish '+(r.place===1&&fieldRace?'is-gold':''),2600);this.hit();gameCue('gx.slam');if(fieldRace)setTimeout(()=>this.radio(r.place===1?'youWon':'theyWon',undefined,true),1200);
    const splits=[...this.gates,r.timeMs??s.elapsedMs],bestTotal=this.best?.at(-1);if(!this.freeDrive&&(bestTotal===undefined||(r.timeMs??Infinity)<bestTotal))writeSplits(s.event,splits)}
   else{this.banner('<b>DNF</b><span>RUN NOT COUNTED</span>','is-down',2200)}}
  this.phase=s.phase;
  (this.root.parentElement as HTMLElement|null)?.toggleAttribute('data-gx-solo',s.standings.length===1);
  const menuOpen=s.phase==='ready'||s.phase==='finished'||s.paused,primary=document.getElementById('start-crew')?.textContent?.trim(),label=primary||(s.paused?'Resume':s.playerResult?'Race again':'Start');const prompts=menuOpen?label:'none';if(prompts!==this.prompts){this.prompts=prompts;setPrompts(menuOpen?[{key:'confirm',label}]:null)}
 }
 private resetRun(key:string,event:string){this.runKey=key;this.topSpeed=0;this.finished=false;this.place=0;this.lap=1;this.gate=-1;this.gates=[];this.lapStart=0;this.count=-1;this.best=readSplits(event);this.tallied=''}
 private pulse(node:HTMLElement){node.classList.remove('is-pulse');void node.offsetWidth;node.classList.add('is-pulse')}
 private hit(){if(reduced())return;this.flash.classList.remove('is-on');void this.flash.offsetWidth;this.flash.classList.add('is-on')}
 /** Results: ordinal slam, staggered standings, and the reward tally panel. Runs after CrewUI renders its menu. */
 private decorateMenu(menu:HTMLElement){
  // Every race menu (ready / pause / result) offers Options next to its own actions.
  const actions=menu.querySelector('.menu-actions');if(actions&&!actions.querySelector('[data-gx-options]')){if(menu.dataset.phase==='pause'){const r=document.createElement('button');r.type='button';r.dataset.action='retry';r.textContent='Restart';actions.querySelector('#start-crew')?.after(r);const p=document.createElement('button');p.type='button';p.dataset.gxPhoto='';p.textContent='Photo mode';actions.append(p)}const b=document.createElement('button');b.type='button';b.dataset.gxOptions='';b.textContent='Options';actions.append(b)}
  // Crew races open on a rival lineup: who you are about to race.
  if(menu.dataset.phase==='ready'&&this.field.length&&!menu.querySelector('.gx-lineup')){const h=menu.querySelector('h1');h?.insertAdjacentHTML('afterend',`<div class="gx-lineup is-grid">${this.field.map(id=>portraitMarkup(CREW[id],'gx-portrait is-small')).join('')}<figure class="gx-portrait is-small is-you"><span>YOU</span><figcaption><b>YOU</b><small>Your build</small></figcaption></figure></div>`)}
  if(menu.dataset.phase!=='result'||menu.hidden){return}
  const place=Number(menu.dataset.place);const numeral=menu.querySelector<HTMLElement>('.result-numeral');
  if(numeral&&!numeral.dataset.gx&&Number.isFinite(place)&&place>0){numeral.dataset.gx='1';numeral.dataset.medal=place===1?'gold':place===2?'silver':place===3?'bronze':'';const small=numeral.querySelector('small'),sfx=document.createElement('sup');sfx.textContent=ordinal(place).replace(String(place),'');numeral.replaceChildren(document.createTextNode(String(place)),sfx,...(small?[small]:[]))}
  if(!menu.querySelector('.gx-run-stats')&&this.topSpeed>1){const p=document.createElement('p');p.className='gx-run-stats';p.innerHTML=`<span>TOP SPEED</span><b>${Math.round(this.topSpeed)}<small> ${speedLabel()}</small></b>`;menu.insertBefore(p,menu.querySelector('.result-standings,.menu-actions'))}
  const r=this.reward;if(!r||menu.querySelector('.gx-reward'))return;
  const tallyKey=JSON.stringify([r.credits,r.balance]);const animate=this.tallied!==tallyKey&&!reduced();this.tallied=tallyKey;
  const gain=repGain(r.before,r.receipt),after=tourProgress(r.before);after.rep=gain.rep;
  const panel=document.createElement('section');panel.className='gx-reward';panel.setAttribute('aria-label',`Earned ${r.credits} credits and ${gain.gain} Tour Rep`);
  const floor=repForLevel(gain.level),next=repForLevel(gain.level+1),fill=next>floor?(gain.rep-floor)/(next-floor):1,startFill=gain.levelUp?0:Math.max(0,(gain.from.rep-floor)/(next-floor));
  panel.innerHTML=`<div class="gx-reward-row"><span>CREDITS EARNED</span><b data-count="${r.credits}">+0</b><small>BALANCE ${r.balance.toLocaleString('en-US')} CR</small></div><div class="gx-reward-row"><span>TOUR REP</span><b data-count="${gain.gain}">+0</b><small>LV ${gain.level} · ${rankTitle(gain.level)}</small></div><div class="gx-rep-bar"><i style="--gx-from:${startFill.toFixed(3)};--gx-to:${fill.toFixed(3)}"></i></div>${gain.levelUp?`<div class="gx-levelup"><b>LEVEL UP</b><span>LV ${gain.level} · ${rankTitle(gain.level)}</span></div>`:''}`;
  const anchor=menu.querySelector('.menu-actions');menu.insertBefore(panel,anchor);
  const counters=[...panel.querySelectorAll<HTMLElement>('[data-count]')];
  if(!animate){counters.forEach(c=>c.textContent='+'+Number(c.dataset.count).toLocaleString('en-US'));panel.classList.add('is-done');return}
  const start=performance.now()+450,duration=1300;let lastTick=0;
  const step=(now:number)=>{if(!panel.isConnected)return;const t=Math.max(0,Math.min(1,(now-start)/duration)),e=1-Math.pow(1-t,3);for(const c of counters)c.textContent='+'+Math.round(Number(c.dataset.count)*e).toLocaleString('en-US');if(t>0&&t<1&&now-lastTick>55){lastTick=now;gameCue('gx.tick')}if(t<1)requestAnimationFrame(step);else{panel.classList.add('is-done');gameCue(gain.levelUp?'gx.levelup':'gx.reward')}};
  panel.classList.add('is-counting');requestAnimationFrame(step);
 }
 dispose(){this.menuObserver?.disconnect();document.removeEventListener('gx:radio',this.onRadio);this.root.remove()}
}
