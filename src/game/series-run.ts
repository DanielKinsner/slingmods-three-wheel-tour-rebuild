import {gameCue} from './audio-bus';
import {CREW,type CrewId} from './crew';
import {seriesState,recordSeriesRace,seriesTotals,seriesComplete,advanceSeries,abandonSeries,currentRace,SERIES_RACES,ROUTE_NAMES,type SeriesState} from './series';
import type {TrialRoute} from './time-attack';
/** In-drive side of the Tour Series: records the finished field, shows standings, chains to the next race. */
interface Snap {phase:string;attemptId?:string|null;playerResult:unknown;allFinished:boolean;standings:{id:string;place:number;status:string}[]}
const NAMES:Record<string,string>={player:'YOU',maya:'MAYA',jett:'JETT',nico:'NICO'};
export class SeriesRun {
 private recorded='';private observer?:MutationObserver;
 constructor(private nextHref:(r:TrialRoute)=>string,private showroomHref:()=>string){
 }
 static active(route:string,params:URLSearchParams){const s=seriesState();return params.get('series')==='1'&&!!s&&currentRace(s)===route}
 get state(){return seriesState()}
 private attach(){if(this.observer)return;const menu=document.getElementById('race-menu');if(!menu)return;this.observer=new MutationObserver(()=>this.decorate(menu));this.observer.observe(menu,{childList:true});this.decorate(menu);const st=seriesState(),top=document.querySelector('.race-course-title');if(st&&top)top.textContent=`TOUR SERIES ${st.index+1}/${SERIES_RACES.length} · ${top.textContent}`}
 update(s:Snap){
  this.attach();
  if(s.playerResult&&s.allFinished&&s.attemptId&&this.recorded!==s.attemptId){this.recorded=s.attemptId;recordSeriesRace(s.standings,s.attemptId);const menu=document.getElementById('race-menu');if(menu){menu.querySelector('.gx-series')?.remove();this.decorate(menu)}const st=seriesState();if(st&&seriesComplete(st))setTimeout(()=>gameCue(seriesTotals(st)[0].id==='player'?'gx.levelup':'gx.reward'),600)}
 }
 private table(s:SeriesState,showLast:boolean){return `<ol class="gx-series-table">${seriesTotals(s).map((r,i)=>`<li data-you="${r.id==='player'}" style="--gx-crew:${r.id==='player'?'var(--gx-hot)':CREW[r.id as CrewId]?.color??'#fff'}"><b>${i+1}</b><span>${NAMES[r.id]}</span>${showLast&&r.last!==null?`<em>+${r.last}</em>`:'<em></em>'}<strong>${r.points}</strong></li>`).join('')}</ol>`}
 private decorate(menu:HTMLElement){
  const s=seriesState();if(!s||menu.hidden||menu.querySelector('.gx-series'))return;const phase=menu.dataset.phase,race=s.index+1,total=SERIES_RACES.length;
  const panel=document.createElement('section');panel.className='gx-series';
  if(phase==='ready'){panel.innerHTML=`<header><span>TOUR SERIES</span><b>RACE ${race} / ${total}</b></header><p class="gx-series-route">${SERIES_RACES.map((r,i)=>`<i data-state="${i<s.index?'done':i===s.index?'now':'next'}">${ROUTE_NAMES[r]}</i>`).join('')}</p>${s.index>0?this.table(s,false):'<p class="gx-series-note">10 · 7 · 5 · 3 points per finish. Most points after three races takes the title.</p>'}`}
  else if(phase==='result'){
   const done=s.results[s.index]!==null;
   if(!done){panel.innerHTML=`<header><span>TOUR SERIES</span><b>RACE ${race} / ${total}</b></header><p class="gx-series-note">Waiting for the field to finish…</p>`}
   else if(seriesComplete(s)){const champ=seriesTotals(s)[0],you=champ.id==='player';panel.dataset.final='true';panel.innerHTML=`<header><span>TOUR SERIES · FINAL STANDINGS</span><b>${you?'SERIES CHAMPION':'CHAMPION: '+NAMES[champ.id]}</b></header>${you?'<div class="gx-series-trophy" aria-hidden="true">🏆</div>':''}${this.table(s,true)}<div class="gx-series-actions"><button type="button" data-series="finish" class="is-primary">Finish series</button><button type="button" data-series="again">Run it again</button></div>`}
   else{const next=SERIES_RACES[s.index+1];panel.innerHTML=`<header><span>TOUR SERIES · AFTER RACE ${race} / ${total}</span><b>STANDINGS</b></header>${this.table(s,true)}<div class="gx-series-actions"><button type="button" data-series="next" class="is-primary">Next race: ${ROUTE_NAMES[next]} →</button></div>`}
  }else return;
  panel.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-series]');if(!b)return;gameCue('gx.select');const a=b.dataset.series;
   if(a==='next'){const st=advanceSeries();if(st)location.assign(this.nextHref(currentRace(st)))}
   if(a==='finish'){abandonSeries();location.assign(this.showroomHref())}
   if(a==='again'){const d=s.difficulty;abandonSeries();import('./series').then(m=>{const st=m.startSeries(d);location.assign(this.nextHref(currentRace(st)))})}});
  const anchor=menu.querySelector('.gx-reward,.menu-actions');menu.insertBefore(panel,anchor);
  if(phase==='result'&&done())panel.querySelector<HTMLElement>('[data-series]')?.focus({preventScroll:true});
  function done(){return s!.results[s!.index]!==null}
 }
 dispose(){this.observer?.disconnect()}
}
