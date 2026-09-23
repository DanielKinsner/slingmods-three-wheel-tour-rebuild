import './milestones.css';
import type {Career} from '../career/store';
import {chapterAvailable,ridgeAvailable} from '../career-experience/model';
import {CREW,type CrewId} from './crew';
import {gameCue} from './audio-bus';
import {tourProgress} from './progress';
import {setPrompts,currentPrompts} from './shell';
/**
 * Career milestones: full-screen title cards the first time a chapter opens, and the Tour Complete finale with crew
 * farewells, career stats and credits. Remembered locally (once each); read-only over the career save.
 */
const KEY='slingmods-gx-milestones-v1';
const seen=():string[]=>{try{return JSON.parse(localStorage.getItem(KEY)??'[]')}catch{return []}};
const mark=(id:string)=>{try{localStorage.setItem(KEY,JSON.stringify([...new Set([...seen(),id])]))}catch{/* private mode */}};
interface Card {id:string;kicker:string;title:string;subtitle:string;speaker:CrewId;line:string;finale?:boolean}
const CARDS:Card[]=[
 {id:'chapter-02',kicker:'CHAPTER 02 UNLOCKED',title:'OWN THE BUILD',subtitle:'The coastline events are open. Earn your parts, then take the Coastline Cup.',speaker:'rae',line:'You earned your place with the crew. Now let\'s see what you build.'},
 {id:'chapter-03',kicker:'CHAPTER 03 UNLOCKED',title:'RIDGE RUN',subtitle:'Smoky Ridge is open: a solo climb, Nico\'s duel and the Summit Invitational at blue hour.',speaker:'nico',line:'The coast was the warm-up. Meet me up on the ridge.'},
 {id:'tour-complete',kicker:'TOUR COMPLETE',title:'RIDGE RUN CHAMPION',subtitle:'Every chapter finished. Every event stays open for a rematch.',speaker:'maya',line:'Two coastlines and a mountain. You drove all of it clean.',finale:true},
];
const FAREWELLS:[CrewId,string][]=[['rae','Proud of you. Same time next season?'],['maya','Clean and fast. Race you again whenever you like.'],['jett','Fine. You\'re quick. Rematch. Now.'],['nico','Beautiful drive. The ridge suits you.']];
const CREDITS=['SLINGMODS · Three-Wheel Tour','Game direction & ownership · Daniel Kinsner, SlingMods','Vehicles · Polaris Slingshot R (2026) · Can-Am Ryker 900','Built with Three.js, Rapier physics, Blender and Vite','Crew portraits · original illustrations generated for this game','Interface & race sounds · original synthesis','Real parts in your build · slingmods.com','Thanks for driving.'];
function due(s:Career){const out:Card[]=[],done=seen();if(chapterAvailable(s)&&!done.includes('chapter-02'))out.push(CARDS[0]);if(ridgeAvailable(s)&&!done.includes('chapter-03'))out.push(CARDS[1]);if(s.ownBuild.ridge.completed['summit-invitational']&&!done.includes('tour-complete'))out.push(CARDS[2]);return out}
let showing=false;
/** Show any milestone the player has not seen yet (latest first wins; earlier ones are marked seen with it). */
export function showMilestones(s:Career|null){if(!s||showing)return;const list=due(s);if(!list.length)return;for(const c of list)mark(c.id);show(list[list.length-1],s)}
export function showFinale(s:Career|null){if(!showing)show(CARDS[2],s)}
// Developer preview of any card: ?milestone=chapter-02|chapter-03|tour-complete (dev server only, never marks it seen).
if(import.meta.env?.DEV){const q=new URLSearchParams(location.search).get('milestone'),c=CARDS.find(x=>x.id===q);if(c)setTimeout(()=>show(c,null),2500)}
function show(card:Card,s:Career|null){
 showing=true;const m=CREW[card.speaker],p=tourProgress(s),prior=currentPrompts();document.body.dataset.gxModal='1';
 const node=document.createElement('section');node.className='gx-milestone';node.dataset.finale=String(!!card.finale);node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',card.kicker);
 node.innerHTML=`<div class="gx-ms-bars" aria-hidden="true"></div><div class="gx-ms-core"><span class="gx-ms-kicker">${card.kicker}</span><h1>${card.title}</h1><p class="gx-ms-sub">${card.subtitle}</p><figure class="gx-ms-line" style="--gx-crew:${m.color}"><img src="${m.portrait}" alt=""><figcaption><b>${m.name}</b><span>${card.line}</span></figcaption></figure>${card.finale?`<div class="gx-ms-stats"><div><b>LV ${p.level}</b><span>${p.title}</span></div><div><b>${p.completed}/${p.total}</b><span>Events</span></div><div><b>${p.rep.toLocaleString('en-US')}</b><span>Tour Rep</span></div><div><b>${p.credits.toLocaleString('en-US')}</b><span>Credits</span></div></div><div class="gx-ms-farewells">${FAREWELLS.map(([id,t])=>`<figure style="--gx-crew:${CREW[id].color}"><img src="${CREW[id].portrait}" alt=""><figcaption><b>${CREW[id].name}</b><span>${t}</span></figcaption></figure>`).join('')}</div><ol class="gx-ms-credits">${CREDITS.map(c=>`<li>${c}</li>`).join('')}</ol>`:''}<button type="button" class="gx-ms-go">${card.finale?'Back to the tour':'Let\'s go'}</button></div>`;
 document.body.append(node);gameCue(card.finale?'gx.levelup':'gx.start');setPrompts([{key:'confirm',label:'Continue'}]);
 const close=()=>{node.classList.add('is-leaving');removeEventListener('keydown',key,true);setTimeout(()=>{node.remove();showing=false;delete document.body.dataset.gxModal;setPrompts(prior)},450);gameCue('gx.back')};
 const key=(e:KeyboardEvent)=>{if(['Enter','Escape','Space'].includes(e.code)){e.preventDefault();e.stopPropagation();close()}};
 addEventListener('keydown',key,true);node.querySelector<HTMLButtonElement>('.gx-ms-go')!.addEventListener('click',close);
 setTimeout(()=>node.querySelector<HTMLButtonElement>('.gx-ms-go')?.focus({preventScroll:true}),card.finale?2200:900);
 let armed=false;(function poll(){if(!node.isConnected||node.classList.contains('is-leaving'))return;const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(g=>g?.connected&&g.mapping==='standard');const a=(pad?.buttons[0]?.value??0)>.5||(pad?.buttons[1]?.value??0)>.5;if(!a)armed=true;else if(armed){close();return}requestAnimationFrame(poll)})();
}
