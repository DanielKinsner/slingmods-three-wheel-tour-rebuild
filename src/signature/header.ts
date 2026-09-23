import {vehicleSelection} from '../presentation/ryker-selection';
import type {TourProgress} from '../game/progress';
/**
 * One persistent game header for the free showroom, the career garage and the career hub. Home always means the
 * opening screen; Career is always one action away and becomes the explicit return path for career-originated previews.
 * Tabs carry data-gx-tab so Q/E (LB/RB) cycle them; the player card shows Tour Rep level and credits.
 */
export type HeaderCurrent='entry'|'build'|'events'|'shop'|'career';
export interface HeaderCareer {label:string;detail:string;returning:boolean;returnLabel:string;progress?:TourProgress}
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function playerCard(p:TourProgress|undefined){
 if(!p)return '';
 return `<div class="gx-player" aria-label="Tour Rep level ${p.level}, ${p.title}. ${p.credits} credits"><span class="gx-player-level"><small>LV</small>${p.level}</span><span class="gx-player-rank"><b>${esc(p.title)}</b><span class="gx-player-bar"><i style="--gx-fill:${p.fraction.toFixed(3)}"></i></span></span><span class="gx-player-credits"><b>${p.credits.toLocaleString('en-US')}</b><small>CR</small></span></div>`;
}
export function gameHeader(options:{current:HeaderCurrent;career?:HeaderCareer}){
 const item=(label:string,action:string,current:boolean)=>`<button data-action="${action}" aria-current="${current?'page':'false'}" data-gx-tab>${label}</button>`,c=options.career,back=!!c?.returning;
 return `<header class="sig-header"><button class="sig-brand" data-action="home" aria-label="SlingMods home · opening screen"><img src="./assets/brand/slingmods-logo-main.png" alt="SlingMods"><span class="sig-game">THREE-WHEEL TOUR</span></button><nav class="sig-navigation" aria-label="Main navigation" data-gx-tabs><kbd class="gx-tab-hint" aria-hidden="true" data-gx-hint="prev"></kbd>${item('HOME','home',options.current==='entry')}${item('GARAGE','build',options.current==='build')}${item('RACE','quick-race',options.current==='events')}${item('SHOP','shop',options.current==='shop')}<button data-action="career" class="sig-nav-career${back?' is-return':''}" aria-current="${options.current==='career'?'page':'false'}" aria-label="${esc(back?c!.returnLabel:'Career · '+(c?.detail??'Chapter 01'))}">${back?'<span aria-hidden="true">←</span> RETURN TO CAREER':'CAREER'}</button><kbd class="gx-tab-hint" aria-hidden="true" data-gx-hint="next"></kbd></nav>${playerCard(c?.progress)}${vehicleSelection()}</header>`;
}
