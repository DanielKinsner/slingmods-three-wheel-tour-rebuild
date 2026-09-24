import {gameCue} from './audio-bus';
import {DRIFT,type DriftState} from '../simulation';
/**
 * Drift meter (Phase 4B, arcade layer): three tier segments fill while the handbrake drift charges; a clean exit
 * flashes BOOST, a hit or spin shows LOST. Reads Simulation.drift() only. A one-time hint teaches the control.
 */
const HINT_KEY='slingmods-gx-drift-hint-v1';
export class DriftHud {
 private root=document.createElement('div');private events=0;private tier=-1;private fill=-1;private shown=false;private flashTimer=0;private hintTimer=0;
 constructor(parent:HTMLElement=document.body){
  this.root.className='gx-drift';this.root.setAttribute('aria-live','polite');
  this.root.innerHTML='<div class="gx-drift-meter" aria-hidden="true"><b>DRIFT</b><span><i></i></span><span><i></i></span><span><i></i></span></div><strong class="gx-drift-flash" hidden></strong><p class="gx-drift-hint" hidden>Hold <kbd>Space</kbd> / <kbd>X</kbd> to drift · straighten up for a boost</p>';
  parent.append(this.root);
 }
 /** Show the one-time control hint (first arcade race on this browser). */
 hint(){let seen=false;try{seen=localStorage.getItem(HINT_KEY)==='1';localStorage.setItem(HINT_KEY,'1')}catch{}if(seen)return;const h=this.root.querySelector<HTMLElement>('.gx-drift-hint')!;h.hidden=false;clearTimeout(this.hintTimer);this.hintTimer=window.setTimeout(()=>h.hidden=true,6500)}
 update(d:Readonly<DriftState>){
  if(!d.enabled){if(this.shown){this.shown=false;this.root.classList.remove('is-on')}return}
  const on=d.active;if(on!==this.shown){this.shown=on;this.root.classList.toggle('is-on',on)}
  if(d.tier!==this.tier){this.tier=d.tier;this.root.dataset.tier=String(d.tier)}
  // Fill of the segment being charged: 0..1 between the previous and next tier threshold.
  const lo=d.tier===0?0:DRIFT.tiers[d.tier-1],hi=DRIFT.tiers[Math.min(2,d.tier)],f=d.tier>=3?1:Math.max(0,Math.min(1,(d.charge-lo)/(hi-lo))),q=Math.round(f*20)/20;
  if(q!==this.fill){this.fill=q;this.root.style.setProperty('--fill',String(q))}
  if(d.eventCount!==this.events){this.events=d.eventCount;
   if(d.event==='tier'){gameCue(d.eventTier>=3?'gx.levelup':'gx.tick')}
   else if(d.event==='boost'){this.flash(`BOOST ${'I'.repeat(d.eventTier)}`,'boost');gameCue('gx.whoosh')}
   else if(d.event==='forfeit'){this.flash('LOST','lost');gameCue('gx.back')}}
 }
 private flash(text:string,kind:string){const f=this.root.querySelector<HTMLElement>('.gx-drift-flash')!;f.textContent=text;f.dataset.kind=kind;f.hidden=false;f.classList.remove('is-play');void f.offsetWidth;f.classList.add('is-play');clearTimeout(this.flashTimer);this.flashTimer=window.setTimeout(()=>f.hidden=true,1100)}
 dispose(){clearTimeout(this.flashTimer);clearTimeout(this.hintTimer);this.root.remove()}
}
