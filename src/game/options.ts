import './options.css';
import {gameCue} from './audio-bus';
import {setPrompts} from './shell';
import type {Career} from '../career/store';
import {achievementState,recordsTable,driveStats} from './achievements';
import {tourProgress} from './progress';
import {MEDAL_NAMES,MEDAL_TARGETS,trialTime} from './time-attack';
import {GRAPHICS_ORDER,GRAPHICS_PRESETS,loadGraphicsQuality,saveGraphicsQuality,type GraphicsQuality} from '../presentation/graphics-settings';
/**
 * OPTIONS: one game-style settings screen for every page. It owns no settings of its own: audio sliders drive the page's
 * existing #game-audio mixer inputs (which persist and apply), quality drives the page's live graphics control when there
 * is one or the saved preset otherwise, and motion / race-film switches use the keys their systems already read.
 */
type Tab='audio'|'video'|'gameplay'|'controls'|'achievements'|'records'|'stats';
type Mode='options'|'log';
const MODES:Record<Mode,{title:string;tabs:[Tab,string][]}>={options:{title:'OPTIONS',tabs:[['audio','Audio'],['video','Video'],['gameplay','Gameplay'],['controls','Controls']]},log:{title:'TOUR LOG',tabs:[['achievements','Achievements'],['records','Time Attack'],['stats','Stats']]}};
let mode:Mode='options';const TABS=()=>MODES[mode].tabs;
/** Pages that know the career register it so the Tour Log can show it (read-only). */
let careerSource:()=>Career|null=()=>null;export function setCareerSource(source:()=>Career|null){careerSource=source}
const MIX:[string,string][]=[['audio-master','Master'],['audio-music','Music'],['audio-engine','Engine'],['audio-environment','World'],['audio-interface','Interface']];
const MOTION_KEY='slingmods-signature-motion',FILMS_KEY='slingmods-race-films';
const get=(k:string)=>{try{return localStorage.getItem(k)}catch{return null}};
const set=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{/* private mode: session only */}};
const CONTROLS:[string,string,string][]=[
 ['Throttle','W / ↑','RT'],['Brake · reverse','S / ↓','LT'],['Steer','A D / ← →','Left stick'],['Camera','C','Y'],['Look back (hold)','B','LB'],['Drive / reverse','X','B'],['Reset to road (hold)','R','A'],['Pause','Esc','Menu'],
 ['Select','Enter','A'],['Back','Esc','B'],['Switch tabs','Q / E','LB / RB'],['Options','O','View']
];
let open:HTMLElement|null=null,returnFocus:HTMLElement|null=null,tab:Tab='audio';
export const optionsOpen=()=>!!open;

function audioRows(){
 const locked=!!document.querySelector<HTMLElement>('#enable-sound:not([hidden])'),muted=document.querySelector('#mute-sound')?.textContent==='Unmute';
 const rows=MIX.map(([id,label])=>{const src=document.getElementById(id) as HTMLInputElement|null,v=src?Number(src.value):1;return `<label class="gx-opt-row"><span>${label}</span><input type="range" min="0" max="1" step=".05" value="${v}" data-mix="${id}" ${src?'':'disabled'}><output>${Math.round(v*100)}%</output></label>`}).join('');
 return `${locked?'<button class="gx-opt-cta" data-opt="unlock">Enable sound</button>':''}<div class="gx-opt-group">${rows}</div><div class="gx-opt-row"><span>Sound</span><button class="gx-opt-toggle" data-opt="mute" aria-pressed="${!muted}">${muted?'Muted':'On'}</button><small></small></div>`;
}
function videoRows(){
 const live=document.querySelector<HTMLSelectElement>('#game-graphics select[aria-label="Graphics quality"]'),q=(live?.value as GraphicsQuality)??loadGraphicsQuality();
 return `<div class="gx-opt-group"><div class="gx-opt-row"><span>Quality</span><div class="gx-opt-seg" role="radiogroup" aria-label="Graphics quality">${GRAPHICS_ORDER.map(id=>`<button role="radio" data-opt="quality" data-value="${id}" aria-checked="${id===q}">${GRAPHICS_PRESETS[id].label}</button>`).join('')}</div></div><p class="gx-opt-note">${live?'Applies now. Nearby lighting updates on your next drive.':'Saved for this browser. Applies when the next scene loads.'}</p><p class="gx-opt-note">Low and Medium use dynamic resolution to hold frame rate on weaker GPUs.</p></div>`;
}
function gameplayRows(){
 const reduced=get(MOTION_KEY)==='reduced',films=get(FILMS_KEY)!=='off';
 return `<div class="gx-opt-group"><div class="gx-opt-row"><span>Camera motion</span><button class="gx-opt-toggle" data-opt="motion" aria-pressed="${!reduced}">${reduced?'Reduced':'Full'}</button><small>Speed camera, shake and screen blur</small></div><div class="gx-opt-row"><span>Race films</span><button class="gx-opt-toggle" data-opt="films" aria-pressed="${films}">${films?'On':'Off'}</button><small>Grid intro and victory cinematics</small></div><div class="gx-opt-row"><span>Title screen</span><button class="gx-opt-toggle" data-opt="title">Show again</button><small>On your next visit to the menu</small></div></div><p class="gx-opt-note">Camera motion applies from your next drive.</p>`;
}
function controlsRows(){return `<table class="gx-opt-controls"><thead><tr><th>Action</th><th>Keyboard</th><th>Controller</th></tr></thead><tbody>${CONTROLS.map(([a,k,p],i)=>`${i===8?'<tr class="gx-opt-sep"><td colspan="3">MENUS</td></tr>':''}<tr><td>${a}</td><td><kbd class="gx-glyph gx-key">${k}</kbd></td><td><kbd class="gx-glyph gx-key">${p}</kbd></td></tr>`).join('')}</tbody></table>`}

function achievementRows(){const list=achievementState(careerSource()),done=list.filter(x=>x.done).length;
 return `<p class="gx-log-summary"><b>${done}<i>/${list.length}</i></b><span>ACHIEVEMENTS UNLOCKED</span></p><div class="gx-log-grid">${list.map(({a,done,progress})=>`<article class="gx-ach" data-done="${done}"><i aria-hidden="true">${done?a.icon:'🔒'}</i><div><b>${a.title}</b><span>${a.detail}</span>${progress&&!done?`<span class="gx-ach-bar"><em style="--gx-fill:${(progress[0]/progress[1]).toFixed(3)}"></em></span><small>${progress[0]} / ${progress[1]}</small>`:''}</div></article>`).join('')}</div>`}
function recordRows(){const names:Record<string,string>={harbor:'Original Harbor',express:'Harbor Express',ridge:'Smoky Ridge'},ride:Record<string,string>={'slingshot-r-2024':'Slingshot R','can-am-ryker-900':'Ryker 900'};
 return `<table class="gx-opt-controls gx-log-records"><thead><tr><th>Course</th><th>Ride</th><th>Best</th><th>Medal</th><th>Runs</th></tr></thead><tbody>${recordsTable().map(({route,rows})=>rows.map((r,i)=>`<tr>${i===0?`<td rowspan="2"><b>${names[route]}</b><small>Gold ${trialTime(MEDAL_TARGETS[route].gold)}</small></td>`:''}<td>${ride[r.vehicle]}</td><td>${r.best?trialTime(r.best.timeMs):'—'}</td><td>${r.best?.medal?`<span class="gx-medal-chip" data-medal="${r.best.medal}">${MEDAL_NAMES[r.best.medal]}</span>`:'—'}</td><td>${r.best?.runs??0}</td></tr>`).join('')).join('')}</tbody></table><p class="gx-opt-note">Time Attack lives on the Race screen. Beat a medal time, then beat your own ghost.</p>`}
function statRows(){const c=careerSource(),p=tourProgress(c),s=driveStats();const tile=(v:string,l:string)=>`<div class="gx-stat"><b>${v}</b><span>${l}</span></div>`;
 return `<div class="gx-stats">${tile('LV '+p.level,p.title)}${tile(p.rep.toLocaleString('en-US'),'Tour Rep')}${tile(c?p.credits.toLocaleString('en-US')+' CR':'—','Credits')}${tile(p.completed+'/'+p.total,'Career events')}${tile(String(s.drives),'Drives started')}${tile(String(s.races),'Races')}${tile(String(s.trials),'Time Attacks')}${tile(String(s.tests),'Test drives')}</div>${c?'':'<p class="gx-opt-note">Open the career from the main menu to include its progress here.</p>'}`}
function render(){
 if(!open)return;const body=open.querySelector<HTMLElement>('.gx-opt-body')!;
 open.querySelectorAll<HTMLElement>('[data-gx-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.setAttribute('aria-selected',String(on))});
 body.innerHTML=tab==='audio'?audioRows():tab==='video'?videoRows():tab==='gameplay'?gameplayRows():tab==='controls'?controlsRows():tab==='achievements'?achievementRows():tab==='records'?recordRows():statRows();
}
export function openTourLog(initial:Tab='achievements'){openOptions(initial,'log')}
export function openOptions(initial:Tab='audio',which:Mode='options'){
 if(open)return;mode=which;tab=initial;returnFocus=document.activeElement as HTMLElement|null;document.body.dataset.gxModal='1';
 open=document.createElement('section');open.className='gx-options';open.setAttribute('role','dialog');open.setAttribute('aria-modal','true');open.setAttribute('aria-label',MODES[mode].title);open.dataset.mode=mode;
 open.innerHTML=`<div class="gx-opt-panel"><header><span class="gx-kicker">SLINGMODS · THREE-WHEEL TOUR</span><h2 class="gx-display">${MODES[mode].title}</h2><button class="gx-opt-close" data-opt="close" aria-label="Close">✕</button></header><nav class="gx-opt-tabs" data-gx-tabs data-gx-modal-tabs>${TABS().map(([id,label])=>`<button data-gx-tab data-tab="${id}" role="tab">${label}</button>`).join('')}</nav><div class="gx-opt-body"></div></div>`;
 document.body.append(open);render();gameCue('gx.select');
 setPrompts([{key:'confirm',label:'Select'},{key:'adjust',label:'Adjust'},{key:'tabs',label:'Tabs'},{key:'back',label:'Close'}]);
 open.addEventListener('click',onClick);open.addEventListener('input',onInput);open.addEventListener('keydown',onKey);
 (open.querySelector<HTMLElement>(`[data-tab="${tab}"]`))?.focus();padLoop();
}
export function closeOptions(){if(!open)return;open.remove();open=null;delete document.body.dataset.gxModal;gameCue('gx.back');setPrompts(null);document.dispatchEvent(new CustomEvent('gx:options-closed'));returnFocus?.focus?.({preventScroll:true})}
function onClick(e:Event){const t=(e.target as Element).closest<HTMLElement>('[data-opt],[data-gx-tab]');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab as Tab;render();open?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus();return}
 const o=t.dataset.opt;
 if(o==='close'){closeOptions();return}
 if(o==='unlock'){document.querySelector<HTMLButtonElement>('#enable-sound')?.click();setTimeout(render,900)}
 if(o==='mute'){document.querySelector<HTMLButtonElement>('#mute-sound')?.click();render();focusOpt('mute')}
 if(o==='quality'){const q=t.dataset.value as GraphicsQuality,live=document.querySelector<HTMLSelectElement>('#game-graphics select[aria-label="Graphics quality"]');if(live){live.value=q;live.dispatchEvent(new Event('change',{bubbles:true}))}else saveGraphicsQuality(q);gameCue('gx.tab');render();open?.querySelector<HTMLElement>(`[data-opt=quality][data-value=${q}]`)?.focus()}
 if(o==='motion'){set(MOTION_KEY,get(MOTION_KEY)==='reduced'?'full':'reduced');render();focusOpt('motion')}
 if(o==='films'){set(FILMS_KEY,get(FILMS_KEY)==='off'?'on':'off');render();focusOpt('films')}
 if(o==='title'){try{sessionStorage.removeItem('slingmods-gx-title-seen')}catch{}t.textContent='Will show'}
}
const focusOpt=(o:string)=>open?.querySelector<HTMLElement>(`[data-opt=${o}]`)?.focus();
function onInput(e:Event){const t=e.target as HTMLInputElement;if(!t.dataset.mix)return;const src=document.getElementById(t.dataset.mix) as HTMLInputElement|null;if(!src)return;src.value=t.value;src.dispatchEvent(new Event('input',{bubbles:true}));const out=t.parentElement?.querySelector('output');if(out)out.value=Math.round(Number(t.value)*100)+'%';gameCue('gx.tick')}
function focusables(){return [...open!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')].filter(e=>e.getClientRects().length)}
function move(dx:number,dy:number){
 const list=focusables(),cur=document.activeElement as HTMLElement;if(!list.length)return;if(!open!.contains(cur)){list[0].focus();return}
 if(dx&&cur instanceof HTMLInputElement&&cur.type==='range'){const step=Number(cur.step)||.05;cur.value=String(Math.max(0,Math.min(1,Number(cur.value)+dx*step)));cur.dispatchEvent(new Event('input',{bubbles:true}));return}
 const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best:HTMLElement|null=null,score=Infinity;
 for(const el of list){if(el===cur)continue;const b=el.getBoundingClientRect(),x=b.left+b.width/2-cx,y=b.top+b.height/2-cy;const along=dx?x*dx:y*dy,across=dx?Math.abs(y):Math.abs(x);if(along<=4)continue;const s=along+across*2.2;if(s<score){score=s;best=el}}
 best?.focus();
}
function cycle(d:number){const tabs=TABS(),i=tabs.findIndex(([id])=>id===tab);tab=tabs[(i+d+tabs.length)%tabs.length][0];gameCue('gx.tab');render();open?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus()}
function onKey(e:KeyboardEvent){
 const k=e.code;if(k==='Escape'||k==='Backspace'&&!(e.target instanceof HTMLInputElement&&e.target.type!=='range')){e.preventDefault();e.stopPropagation();closeOptions();return}
 if(k==='KeyQ'||k==='KeyE'){e.preventDefault();e.stopPropagation();cycle(k==='KeyE'?1:-1);return}
 const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(d){e.preventDefault();e.stopPropagation();move(d[0],d[1])}
 if(k==='Tab'){const list=focusables(),i=list.indexOf(document.activeElement as HTMLElement);e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus()}
}
function padLoop(){
 const prior=new Map<number,boolean>();let armed=false;
 const tick=()=>{if(!open)return;const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(p=>p?.connected&&p.mapping==='standard');
  if(pad){const held=(i:number)=>(pad.buttons[i]?.value??0)>.5,ax=pad.axes[0]??0,ay=pad.axes[1]??0,state:[number,boolean][]=[[0,held(0)],[1,held(1)],[4,held(4)],[5,held(5)],[12,held(12)||ay<-.6],[13,held(13)||ay>.6],[14,held(14)||ax<-.6],[15,held(15)||ax>.6],[8,held(8)]];
   if(!armed){if(state.every(([,v])=>!v))armed=true}else for(const [i,v] of state){if(v&&!prior.get(i)){if(i===0)(document.activeElement as HTMLElement)?.click();else if(i===1||i===8)closeOptions();else if(i===4||i===5)cycle(i===5?1:-1);else move(i===14?-1:i===15?1:0,i===12?-1:i===13?1:0)}}
   for(const [i,v] of state)prior.set(i,v)}
  requestAnimationFrame(tick)};requestAnimationFrame(tick);
}
/** Global entry points: O key or the controller View button outside of driving, and any [data-gx-options] button. */
export function installOptions(){
 document.addEventListener('click',e=>{const t=(e.target as Element)?.closest?.('[data-gx-options],[data-gx-log]');if(t){e.preventDefault();if(t.hasAttribute('data-gx-log'))openTourLog();else openOptions()}});
 addEventListener('keydown',e=>{if(e.code!=='KeyO'||e.repeat||open||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target as Element;if(t instanceof HTMLInputElement&&t.type!=='range'||t instanceof HTMLTextAreaElement)return;if(document.body.classList.contains('harbor-race')&&!document.body.classList.contains('race-menu-open'))return;if(document.querySelector('.gx-title:not(.is-leaving)'))return;e.preventDefault();openOptions()});
 let view=false;(function poll(){const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(p=>p?.connected&&p.mapping==='standard');const v=(pad?.buttons[8]?.value??0)>.5;if(v&&!view&&!open&&(!document.body.classList.contains('harbor-race')||document.body.classList.contains('race-menu-open')))openOptions();view=v;requestAnimationFrame(poll)})();
}
