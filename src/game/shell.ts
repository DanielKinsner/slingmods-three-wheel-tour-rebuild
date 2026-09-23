import './shell.css';
import {gameCue} from './audio-bus';
/**
 * The game shell: the layer that makes every page read as one console-style game rather than a set of web pages.
 *  - tracks the last-used input device (mouse / keyboard / pad) so prompts show the right glyphs;
 *  - a contextual button-prompt bar (Enter/Esc/Q-E or A/B/LB-RB);
 *  - quiet focus ticks when moving through menus with keys or a controller;
 *  - bumper/Q-E switching for any visible [data-gx-tabs] strip;
 *  - a wipe-to-loading curtain on every same-origin page change, matched by the inline boot screen in index.html.
 * Presentation only: never touches saves, simulation or scene state.
 */
export type InputKind='mouse'|'keyboard'|'pad';
export type PromptKey='confirm'|'back'|'tabs'|'orbit'|'zoom'|'pause'|'reset'|'camera'|'adjust'|'skip'|'any';
export interface Prompt {key:PromptKey;label:string}
const root=document.documentElement;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let input:InputKind='mouse';root.dataset.input=input;
function setInput(next:InputKind){if(next===input)return;input=next;root.dataset.input=next;renderPrompts()}
export const inputKind=()=>input;
addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.isTrusted)setInput('mouse')},{capture:true,passive:true});
addEventListener('pointermove',e=>{if(e.isTrusted&&(Math.abs(e.movementX)+Math.abs(e.movementY))>2)setInput('mouse')},{capture:true,passive:true});
addEventListener('keydown',e=>{if(e.isTrusted&&!['Shift','Control','Alt','Meta'].includes(e.key))setInput('keyboard')},{capture:true});

// ---- Prompt bar -------------------------------------------------------------------------------------------------
const GLYPHS:Record<PromptKey,{key:string[];pad:string[]}>={
 confirm:{key:['Enter'],pad:['A']},back:{key:['Esc'],pad:['B']},tabs:{key:['Q','E'],pad:['LB','RB']},orbit:{key:['Drag'],pad:['RS']},zoom:{key:['Wheel'],pad:['RT']},
 pause:{key:['Esc'],pad:['☰']},reset:{key:['R'],pad:['A']},camera:{key:['C'],pad:['Y']},adjust:{key:['←','→'],pad:['◀','▶']},skip:{key:['Space'],pad:['A']},any:{key:['Any key'],pad:['A']}
};
let prompts:Prompt[]|null=null;let bar:HTMLElement|undefined;
export function setPrompts(next:Prompt[]|null){const key=JSON.stringify(next);if(key===JSON.stringify(prompts))return;prompts=next;renderPrompts()}
function glyph(label:string){const pad=input==='pad';const cls=pad?`gx-glyph gx-pad gx-pad-${label.replace(/[^a-z0-9]/gi,'').toLowerCase()||'menu'}`:'gx-glyph gx-key';return `<kbd class="${cls}">${label}</kbd>`}
function renderPrompts(){
 if(!document.body)return;
 if(!prompts?.length){bar?.remove();bar=undefined;return}
 if(!bar){bar=document.createElement('div');bar.className='gx-prompts';bar.setAttribute('aria-hidden','true');document.body.append(bar)}
 bar.dataset.input=input;
 bar.innerHTML=prompts.map(p=>`<span class="gx-prompt">${GLYPHS[p.key][input==='pad'?'pad':'key'].map(glyph).join('')}<b>${p.label}</b></span>`).join('');
}

// ---- Focus ticks ------------------------------------------------------------------------------------------------
const FOCUSABLE='button,a[href],summary,select,input,[role=tab],[tabindex]:not([tabindex="-1"])';
let lastFocus:Element|null=null;
document.addEventListener('focusin',e=>{const t=e.target as Element;if(!(t instanceof HTMLElement)||!t.matches(FOCUSABLE)||t===lastFocus)return;lastFocus=t;if(input!=='mouse'&&!t.closest('[data-gx-silent]'))gameCue('gx.focus')});
let lastHover:Element|null=null;
document.addEventListener('pointerover',e=>{if(!(e.target instanceof Element))return;const t=e.target.closest('.gx-tile,[data-gx-hover]');if(!t||t===lastHover)return;lastHover=t;if(!(t as HTMLButtonElement).disabled)gameCue('gx.focus')},{passive:true});
document.addEventListener('pointerout',e=>{if(e.target instanceof Element&&e.target.closest('.gx-tile,[data-gx-hover]')===lastHover&&!(e.relatedTarget instanceof Element&&lastHover?.contains(e.relatedTarget)))lastHover=null},{passive:true});
document.addEventListener('click',e=>{const t=(e.target as Element)?.closest?.('[data-gx-sfx]');if(t instanceof HTMLElement&&!(t as HTMLButtonElement).disabled&&t.getAttribute('aria-disabled')!=='true')gameCue(t.dataset.gxSfx==='back'?'gx.back':'gx.select')},true);

// ---- Tabs (Q/E, LB/RB) ------------------------------------------------------------------------------------------
function visibleTabs(){for(const strip of document.querySelectorAll<HTMLElement>('[data-gx-tabs]')){if(strip.closest('[hidden],[inert]')||!strip.getClientRects().length)continue;const tabs=[...strip.querySelectorAll<HTMLElement>('[data-gx-tab]')].filter(t=>!t.hidden&&!(t as HTMLButtonElement).disabled);if(tabs.length>1)return tabs}return null}
export function cycleTabs(direction:1|-1){const tabs=visibleTabs();if(!tabs)return false;let i=tabs.findIndex(t=>t.getAttribute('aria-current')==='page'||t.getAttribute('aria-selected')==='true'||t.dataset.gxCurrent==='true');if(i<0)i=direction>0?-1:0;const next=tabs[(i+direction+tabs.length)%tabs.length];gameCue('gx.tab');next.click();return true}
addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target as Element;if(t instanceof HTMLInputElement&&!['range','checkbox','radio'].includes(t.type)||t instanceof HTMLTextAreaElement)return;if(document.querySelector('.gx-title:not([hidden])'))return;if(e.code==='KeyQ'||e.code==='KeyE'){if(cycleTabs(e.code==='KeyE'?1:-1))e.preventDefault()}});

// ---- Gamepad: device detection + bumpers --------------------------------------------------------------------------
const bumper=[false,false];
(function pollPads(){
 const pads=Array.from(navigator.getGamepads?.()??[]).filter(p=>p?.connected&&p.mapping==='standard') as Gamepad[];
 for(const pad of pads){
  if(pad.buttons.some(b=>b.value>.5)||pad.axes.some(v=>Math.abs(v)>.55))setInput('pad');
  const lb=(pad.buttons[4]?.value??0)>.5,rb=(pad.buttons[5]?.value??0)>.5;
  if(document.hasFocus()&&!document.querySelector('.gx-title:not([hidden])')){if(lb&&!bumper[0])cycleTabs(-1);if(rb&&!bumper[1])cycleTabs(1)}
  bumper[0]=lb;bumper[1]=rb;
 }
 requestAnimationFrame(pollPads);
})();

// ---- Curtain: wipe out to the loading screen on every page change --------------------------------------------------
let leaving=false;
function curtain(){let node=document.getElementById('gx-curtain');if(!node){node=document.createElement('div');node.id='gx-curtain';node.innerHTML=bootMarkup();document.body.append(node)}return node}
/** Shared by the curtain and index.html's inline boot screen so the page change reads as one continuous wipe. */
export function bootMarkup(){return `<i class="gx-wipe gx-wipe-a"></i><i class="gx-wipe gx-wipe-b"></i><div class="gx-boot-core"><img src="/assets/brand/slingmods-logo-main.png" alt=""><strong>THREE-WHEEL TOUR</strong><span class="gx-boot-bar"><i></i></span><small>LOADING</small></div>`}
export function wipeOut(){if(reduced())return Promise.resolve();const node=curtain();node.classList.remove('is-open');void node.offsetWidth;node.classList.add('is-closing');gameCue('gx.whoosh');return new Promise<void>(resolve=>setTimeout(resolve,420))}
type NavigateEventLike=Event&{cancelable:boolean;hashChange:boolean;downloadRequest:string|null;navigationType:string;destination:{url:string;sameDocument:boolean}};
const nav=(globalThis as unknown as {navigation?:EventTarget}).navigation;
nav?.addEventListener('navigate',event=>{const e=event as NavigateEventLike;
 if(leaving||!e.cancelable||e.hashChange||e.downloadRequest||e.destination.sameDocument||e.navigationType==='reload'||e.navigationType==='traverse')return;
 const url=new URL(e.destination.url);if(url.origin!==location.origin||reduced()||document.documentElement.dataset.gxNoCurtain==='1')return;
 e.preventDefault();leaving=true;const replace=e.navigationType==='replace';
 void wipeOut().then(()=>{if(replace)location.replace(url.href);else location.assign(url.href)});
});
// Returning via bfcache: never leave the curtain covering a live page.
addEventListener('pageshow',e=>{if((e as PageTransitionEvent).persisted){leaving=false;document.getElementById('gx-curtain')?.remove()}});

// ---- Boot screen hand-off ---------------------------------------------------------------------------------------
const READY='#signature-ui,#harbor-ui,.career-shell,.drive-preparation,.preview-recovery,.gx-title,#chapter-panel';
function releaseBoot(){const boot=document.getElementById('gx-boot');if(!boot||boot.classList.contains('is-leaving'))return;boot.classList.add('is-leaving');setTimeout(()=>boot.remove(),reduced()?0:520)}
function watchBoot(){if(!document.getElementById('gx-boot'))return;if(document.querySelector(READY)){releaseBoot();return}const observer=new MutationObserver(()=>{if(document.querySelector(READY)){observer.disconnect();releaseBoot()}});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>{observer.disconnect();releaseBoot()},130000)}
if(document.body)watchBoot();else addEventListener('DOMContentLoaded',watchBoot,{once:true});

// ---- Loading screens: destination art + rotating tips -------------------------------------------------------------
const params=new URLSearchParams(location.search);
const route=params.get('route')??(params.get('scene')==='ridge'?'ridge':params.get('scene')==='harbor'||params.get('scene')==='crew'?'harbor':params.get('scene')==='express'?'express':'');
if(route)root.dataset.gxRoute=route;
// Developer fixtures (calibration, retired workbench bay) keep their legacy caption chrome visible.
const scene=params.get('scene');
if(scene==='calibration'||scene==='bay'&&['workbench','neutral','asset','diagnostic','shadow','debug'].some(k=>params.has(k))||!!scene&&!['bay','signature','career','express','ridge','crew','harbor'].includes(scene))root.dataset.gxLegacy='1';
root.dataset.gxLook=params.get('lighting')==='night'||/night|dusk|blue/.test(params.get('look')??'')?'night':'day';
export const TIPS=[
 'Brake in a straight line, then turn in. A three-wheeler rewards patience at the apex.',
 'Hold R to reset onto the road if you get tangled in the scenery.',
 'Press C to cycle cameras. B looks behind you.',
 'Every event pays credits. Spend them in the career workshop on real SlingMods parts.',
 'Suspension setup changes how the rear tyre puts power down. Try it in a Test Drive first.',
 'Clean laps matter. Cutting the course invalidates a lap.',
 'Repeat events for credits once you have taken the win.',
 'Q and E (or LB and RB) switch tabs in any menu.',
 'The Ryker 900 has its own physics and CVT. Switch rides from the main menu.',
 'Smoky Ridge climbs. Carry speed out of the hairpins instead of into them.'
];
function decorateVeil(veil:HTMLElement){if(veil.dataset.gxDecorated)return;veil.dataset.gxDecorated='1';const tip=document.createElement('p');tip.className='gx-tip';let i=Math.floor(Math.random()*TIPS.length);const show=()=>{tip.innerHTML=`<b>TIP</b>${TIPS[i%TIPS.length]}`;i++};show();const timer=setInterval(()=>{if(!veil.isConnected){clearInterval(timer);return}tip.classList.remove('is-in');void tip.offsetWidth;show();tip.classList.add('is-in')},5200);tip.classList.add('is-in');veil.append(tip);const stripes=document.createElement('i');stripes.className='gx-veil-stripes';stripes.setAttribute('aria-hidden','true');veil.prepend(stripes)}
new MutationObserver(()=>{for(const veil of document.querySelectorAll<HTMLElement>('.drive-preparation:not([data-gx-decorated])'))decorateVeil(veil)}).observe(document.documentElement,{childList:true,subtree:true});

// ---- Reveal helper: marks freshly shown screens so CSS can stagger them in once, never on every re-render -----------
export function markEntering(node:HTMLElement,ms=900){if(reduced())return;node.dataset.gxEntering='1';clearTimeout(Number(node.dataset.gxEnterTimer));node.dataset.gxEnterTimer=String(setTimeout(()=>{delete node.dataset.gxEntering},ms))}
root.classList.add('gx');
