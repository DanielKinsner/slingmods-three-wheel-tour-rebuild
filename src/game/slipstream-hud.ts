/**
 * Slipstream readout (Phase 4A). The physics tow lives in RaceWorld racecraft; this only shows it: a SLIPSTREAM tag
 * that fills as the tow builds, plus a little extra edge blur for the speed-lines feel (via SpeedFeel.boostBlur).
 */
const FULL=.38;
export class SlipstreamHud {
 private root=document.createElement('div');private shown=false;private level=-1;
 /** Extra edge blur for SpeedFeel.boostBlur (which drops it under reduced motion), 0..0.3. */
 blur=0;
 constructor(parent:HTMLElement=document.body){this.root.className='gx-draft';this.root.setAttribute('aria-hidden','true');this.root.innerHTML='<b>SLIPSTREAM</b><i><s></s></i>';parent.append(this.root)}
 update(draft:number){
  const k=Math.max(0,Math.min(1,draft/FULL)),on=k>.12;this.blur=.3*k*k;
  if(on!==this.shown){this.shown=on;this.root.classList.toggle('is-on',on)}
  const level=Math.round(k*20);if(level!==this.level){this.level=level;this.root.style.setProperty('--draft',String(level/20))}
 }
 dispose(){this.root.remove()}
}
