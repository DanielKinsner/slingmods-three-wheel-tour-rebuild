import {gameCue,unlockGameAudio} from './audio-bus';
import {setPrompts,inputKind,currentPrompts} from './shell';
/**
 * Attract/title screen over the live showroom: shown once per browser tab session on the opening screen.
 * The "press any key" gesture doubles as the sound unlock, so players never meet a separate "Enable sound" step.
 */
const SEEN='slingmods-gx-title-seen';
declare const __BUILD_REF__:string;
export function shouldShowTitle(){const q=new URLSearchParams(location.search);if(q.has('title'))return true;if(navigator.webdriver||q.has('test')||q.has('screen'))return false;try{return sessionStorage.getItem(SEEN)!=='1'}catch{return false}}
export function showTitle(options:{onStart?:()=>void;onIdle?:(active:boolean)=>void}={}){
 const node=document.createElement('section');node.className='gx-title';node.setAttribute('role','dialog');node.setAttribute('aria-label','Three-Wheel Tour title screen');
 let build='';try{build=__BUILD_REF__}catch{}
 node.innerHTML=`<div class="gx-title-vignette" aria-hidden="true"></div><div class="gx-title-core"><img class="gx-title-logo" src="/assets/brand/slingmods-logo-main.png" alt="SlingMods"><h1 class="gx-display"><span>THREE-WHEEL</span><em>TOUR</em></h1><p class="gx-title-tag">Build it. Race it. Own the coast.</p><button class="gx-title-start" autofocus><span data-gx-start-label>PRESS ANY KEY</span></button></div><footer class="gx-title-foot"><span>SLINGMODS.COM</span><span>${build?'BUILD '+build.toUpperCase():''}</span></footer>`;
 document.body.append(node);document.body.classList.add('gx-title-open');options.onIdle?.(true);
 const label=node.querySelector<HTMLElement>('[data-gx-start-label]')!;const relabel=()=>{label.textContent=inputKind()==='pad'?'PRESS A TO START':matchMedia('(pointer:coarse)').matches?'TAP TO START':'PRESS ANY KEY'};relabel();
 const priorPrompts=currentPrompts();setPrompts([{key:'any',label:'Start'}]);
 let started=false,raf=0;
 const start=()=>{if(started)return;started=true;cancelAnimationFrame(raf);removeEventListener('keydown',onKey,true);node.removeEventListener('pointerdown',start);try{sessionStorage.setItem(SEEN,'1')}catch{}
  const t0=performance.now();void unlockGameAudio().then(()=>{if(performance.now()-t0<2500)gameCue('gx.start')});
  node.classList.add('is-leaving');document.body.classList.remove('gx-title-open');options.onIdle?.(false);setPrompts(priorPrompts);options.onStart?.();if(inputKind()!=='mouse')setTimeout(()=>document.querySelector<HTMLElement>('.gx-tile-hero')?.focus({preventScroll:true}),450);setTimeout(()=>node.remove(),900)};
 const onKey=(e:KeyboardEvent)=>{if(['Shift','Control','Alt','Meta','Tab'].includes(e.key))return;e.preventDefault();e.stopPropagation();start()};
 addEventListener('keydown',onKey,true);node.addEventListener('pointerdown',start);
 const armed=[false];(function poll(){const pads=Array.from(navigator.getGamepads?.()??[]).filter(Boolean) as Gamepad[];const any=pads.some(p=>p.buttons.some(b=>b.value>.5));if(!any)armed[0]=true;else if(armed[0]){start();return}relabel();raf=requestAnimationFrame(poll)})();
 node.querySelector<HTMLButtonElement>('.gx-title-start')!.focus({preventScroll:true});
 return {dismiss:start};
}
