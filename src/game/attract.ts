import {inputKind,setPrompts} from './shell';
/**
 * Attract mode: leave the title screen alone and the game plays itself, like a console demo loop. A real four-car
 * Quick Race loads with the production rival AI driving your ride, filmed by the replay broadcast director, and hands
 * back to the title when it ends. Any key / click / pad button exits to the main menu.
 *
 * Attract runs never count: `isAttract()` gates every local stat, split and skill write (see achievements, race-fx),
 * and the career is never opened (Quick Race only).
 */
export const ATTRACT_IDLE_MS=40_000;
const CURSOR='slingmods-gx-attract-i',TITLE_SEEN='slingmods-gx-title-seen';
/** Demo reel: every course and a spread of light. Cycles in order through the tab session. */
export const ATTRACT_REEL:{route:'harbor'|'express'|'ridge';look:string;label:string}[]=[
 {route:'express',look:'golden-hour',label:'Harbor Express · Golden hour'},
 {route:'ridge',look:'day',label:'Smoky Ridge · Late afternoon'},
 {route:'harbor',look:'night',label:'Harbor Circuit · Night'},
 {route:'express',look:'dusk-rain',label:'Harbor Express · Dusk rain'},
 {route:'ridge',look:'night',label:'Smoky Ridge · Blue hour'},
 {route:'harbor',look:'day',label:'Harbor Circuit · Day'},
];
export {isAttract} from './attract-flag';
/** URL of the next demo race (advances the session cursor). */
export function nextAttractUrl(){
 let i=0;try{i=Number(sessionStorage.getItem(CURSOR))||0;sessionStorage.setItem(CURSOR,String(i+1))}catch{/* private mode: always the first reel */}
 const r=ATTRACT_REEL[((i%ATTRACT_REEL.length)+ATTRACT_REEL.length)%ATTRACT_REEL.length];
 const q=new URLSearchParams({scene:'express',route:r.route,mode:'race',attract:'1',reel:String(i%ATTRACT_REEL.length)});
 if(r.route==='ridge')q.set('lighting',r.look);else q.set('look',r.look);
 return `/?${q}`;
}
export function attractLabel(search=location.search){const n=Number(new URLSearchParams(search).get('reel'));return ATTRACT_REEL[Number.isInteger(n)&&n>=0?n%ATTRACT_REEL.length:0].label}

/** The in-race side of attract mode: overlay, exit-on-input and the hand-back timeline. */
export class AttractRun {
 private node=document.createElement('section');private label:HTMLElement;private leaving=false;private finishedAt=0;private raf=0;private started=performance.now();
 constructor(){
  document.body.classList.add('gx-attract');
  this.node.className='gx-attract';this.node.setAttribute('role','dialog');this.node.setAttribute('aria-label','Demo race: press any key to play');
  this.node.innerHTML=`<div class="gx-attract-bug"><i></i>DEMO<span>${attractLabel()}</span></div><div class="gx-attract-core"><img src="/assets/brand/slingmods-logo-main.png" alt="SlingMods"><strong class="gx-display">THREE-WHEEL <em>TOUR</em></strong><button type="button" class="gx-attract-start"><span data-attract-label>PRESS ANY KEY</span></button></div>`;
  document.body.append(this.node);this.label=this.node.querySelector('[data-attract-label]')!;
  setPrompts([{key:'any',label:'Play'}]);
  addEventListener('keydown',this.onKey,true);addEventListener('pointerdown',this.onPointer,true);
  // Pads must be released once before a press counts, so a held button from the title does not bounce straight out.
  let armed=false;const poll=()=>{const pads=Array.from(navigator.getGamepads?.()??[]).filter(Boolean) as Gamepad[];const any=pads.some(p=>p.buttons.some(b=>b.value>.5));if(!any)armed=true;else if(armed){this.exit();return}this.relabel();this.raf=requestAnimationFrame(poll)};poll();
 }
 private relabel(){this.label.textContent=inputKind()==='pad'?'PRESS A TO PLAY':matchMedia('(pointer:coarse)').matches?'TAP TO PLAY':'PRESS ANY KEY'}
 private onKey=(e:KeyboardEvent)=>{if(['Shift','Control','Alt','Meta','Tab'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();this.exit()};
 private onPointer=(e:PointerEvent)=>{e.preventDefault();e.stopImmediatePropagation();this.exit()};
 /** Player interrupted: straight to the main menu (the title has done its job). */
 exit(){if(this.leaving)return;this.leaving=true;try{sessionStorage.setItem(TITLE_SEEN,'1')}catch{}location.assign('/')}
 /** Called every rendered frame with the race state; hands back to the title once the demo is over. */
 update(s:{phase:string;playerResult?:unknown;allFinished?:boolean}):void{
  if(this.leaving)return;const now=performance.now();
  if(s.playerResult&&!this.finishedAt)this.finishedAt=now;
  // Hand back to the title a few seconds after the finish (or on a hard cap, in case a demo ever stalls).
  if(this.finishedAt&&now-this.finishedAt>(s.allFinished?4500:7000)||now-this.started>240_000){this.leaving=true;location.assign('/')}
 }
 dispose(){cancelAnimationFrame(this.raf);removeEventListener('keydown',this.onKey,true);removeEventListener('pointerdown',this.onPointer,true);this.node.remove();document.body.classList.remove('gx-attract')}
}
