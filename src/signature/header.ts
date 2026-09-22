/**
 * One persistent game header for the free showroom, the career garage and the career hub. Home always means the
 * opening screen; Career is always one action away and becomes the explicit return path for career-originated previews.
 */
export type HeaderCurrent='entry'|'build'|'events'|'shop'|'career';
export interface HeaderCareer {label:string;detail:string;returning:boolean;returnLabel:string}
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function gameHeader(options:{current:HeaderCurrent;career?:HeaderCareer}){
 const item=(label:string,action:string,current:boolean)=>`<button data-action="${action}" aria-current="${current?'page':'false'}">${label}</button>`,c=options.career,back=!!c?.returning;
 return `<header class="sig-header"><button class="sig-brand" data-action="home" aria-label="SlingMods home · opening screen"><img src="./assets/brand/slingmods-logo-main.png" alt="SlingMods"><span class="sig-game">THREE-WHEEL TOUR</span></button><nav class="sig-navigation" aria-label="Main navigation">${item('BUILD','build',options.current==='build')}${item('DESTINATIONS','quick-race',options.current==='events')}${item('SHOP THIS BUILD','shop',options.current==='shop')}<button data-action="career" class="sig-nav-career${back?' is-return':''}" aria-current="${options.current==='career'?'page':'false'}" aria-label="${esc(back?c!.returnLabel:'Career · '+(c?.detail??'Chapter 01'))}">${back?'<span aria-hidden="true">←</span> RETURN TO CAREER':'CAREER'}</button></nav></header>`;
}
