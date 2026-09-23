import './chapter.css';
import '../game/garage.css';
import {CREW,portraitMarkup} from '../game/crew';
import type {CareerClient} from './client';
import {BuildMenuInput} from './menu';
import type {DeviceSample} from '../driving/input';
import {nextCareerStep,careerStepHref,chapterAvailable} from '../career-experience/model';
export interface ChapterHooks {build():void;shakedown():void;race():void;duel():void}
export class ChapterUI {
 readonly root=document.createElement('section');readonly menu:BuildMenuInput;private unsubscribe:()=>void;private pending=false;private invitation=false;private inviteMenu:BuildMenuInput;
 constructor(private client:CareerClient,private hooks:ChapterHooks){
  this.root.id='chapter-panel';this.root.setAttribute('aria-label','Build Matters chapter');
  this.root.innerHTML='<span class="chapter-eyebrow">SLINGMODS / CHAPTER 01</span><h1>Build Matters</h1><p id="chapter-status"></p><ol id="chapter-roadmap"></ol><div class="chapter-actions"><button id="continue-chapter" class="chapter-primary">Continue chapter</button><button id="chapter-time-trial">Time trial</button><button id="chapter-duel">Maya duel</button><button id="chapter-crew">Crew race</button><button id="chapter-build">Workshop</button></div><small id="chapter-wallet"></small><p id="chapter-feedback" role="status"></p><aside id="crew-invitation" role="dialog" aria-modal="true" aria-label="Crew invitation" hidden><strong>RAE / THE CREW</strong><p id="crew-lines"></p><button id="accept-crew">Skip dialogue · Race</button><button id="dismiss-crew">Later</button></aside>';
  const nextChapter=document.createElement('a');nextChapter.href='?scene=career&play=career';nextChapter.textContent='Chapters 02–03 · Own the build →';nextChapter.className='chapter-next';nextChapter.style.cssText='display:inline-block;color:inherit;padding:12px 0;font-weight:bold';this.root.querySelector('.chapter-actions')!.append(nextChapter);
  document.querySelector('#app')!.append(this.root);this.menu=new BuildMenuInput(this.root,()=>this.dismiss());this.inviteMenu=new BuildMenuInput(this.root.querySelector('#crew-invitation')!,()=>this.dismiss());
  const on=(id:string,fn:()=>void)=>this.root.querySelector(id)!.addEventListener('click',()=>{if(!this.pending&&!this.client.stale)fn()});
  on('#continue-chapter',()=>this.continue());on('#chapter-time-trial',()=>hooks.shakedown());on('#chapter-duel',()=>{if(client.state.chapters.firstCompletion)hooks.duel()});on('#chapter-crew',()=>{if(this.crewAvailable())this.invite()});on('#chapter-build',()=>hooks.build());on('#accept-crew',()=>void this.accept());on('#dismiss-crew',()=>this.dismiss());
  this.root.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();(this.invitation?this.inviteMenu:this.menu).move(['ArrowUp','ArrowLeft'].includes(e.code)?-1:1)}else if(e.code==='Tab'&&this.invitation){e.preventDefault();this.inviteMenu.move(e.shiftKey?-1:1)}else if(e.code==='Escape'){e.preventDefault();this.dismiss()}});
  this.unsubscribe=client.subscribe(()=>this.update());this.update();
 }
 private crewAvailable(){const s=this.client.state;return s.chapters.firstCompletion&&(s.buildMatters.duelCompleted||s.buildMatters.legacyCrewAccess)}
 /** Shared resolver: the main line only. The optional workshop and rematches keep their own buttons. */
 private continue(){if(this.client.profile==='demo'){this.hooks.race();return}const step=nextCareerStep(this.client.state);if(step.kind==='start'||step.kind==='shakedown')this.hooks.shakedown();else if(step.kind==='duel')this.hooks.duel();else if(step.kind==='crew')this.invite();else this.client.navigate(careerStepHref(step))}
 private invite(){this.invitation=true;this.inviteMenu.reset();this.update();this.root.querySelector<HTMLButtonElement>('#accept-crew')!.focus()}
 private async accept(){if(!this.crewAvailable())return;this.pending=true;this.update();try{if(!this.client.state.crew.invitationSeen)await this.client.execute({type:'crew-invitation'});if(this.client.state.crew.cleared&&!this.client.state.crew.clearAcknowledged)await this.client.execute({type:'crew-acknowledge'});this.hooks.race()}catch(e){this.root.querySelector('#chapter-feedback')!.textContent=(e as Error).message}finally{this.pending=false;this.update()}}
 private dismiss(){if(this.pending)return;this.invitation=false;this.update();this.root.querySelector<HTMLButtonElement>('#continue-chapter')!.focus()}
 update(){const s=this.client.state,b=s.buildMatters,u=s.suspension,ryker=s.ownBuild.vehicle==='can-am-ryker-900',demo=this.client.profile==='demo';
  this.root.querySelector('#chapter-status')!.textContent=demo?'Prepared demo: Race the Harbor opens the existing crew event. Career progress stays separate.':!s.chapters.firstCompletion?'Learn the Harbor. Earn your workshop fund. Choose a setup. Take on the crew.':!b.duelCompleted?'Maya has a one-lap invitation. A clean finish funds your next build; a win pays extra.':chapterAvailable(s)?'Chapter 01 complete. The coastline is open: Continue takes you to Chapter 02. Rematches and the workshop stay here.':'Your workshop fund is ready. The DDMWorks suspension is optional; stock builds are welcome in the crew race.';
  const steps:[boolean,string,string,string][]=[[s.chapters.firstCompletion,'01','Solo shakedown','First clean lap: 800 credits · repeats: 100'],[b.duelCompleted,'02','Maya / Find your line','One-rival duel · 1 lap · first finish: 650–750'],[!!(ryker?s.ownBuild.ryker?.owned.includes('shocks'):u.owned),'03','Workshop / Build matters',`Optional · ${ryker?'Elka Stage 3':'DDMWorks SM-3223'} · 1000 credits`],[s.crew.cleared,'04','First Night / Crew race','2-lap crew event · first podium: +400']];const next=steps.findIndex((x,i)=>!x[0]&&i!==2);
  this.root.querySelector('#chapter-roadmap')!.innerHTML=steps.map(([done,n,title,detail],i)=>`<li data-done="${done}" data-next="${i===next}"><i aria-hidden="true">${done?'✓':n}</i><span>${done?'<b class="gx-sr">Complete: </b>':''}${title}<small>${detail}</small></span></li>`).join('');
  const step=nextCareerStep(s);this.root.querySelector('#continue-chapter')!.textContent=demo?'Race the Harbor':step.kind==='start'?'Start · First lap':step.label;this.root.querySelector('#continue-chapter')!.setAttribute('aria-description',demo?'Prepared demo crew event':step.detail);
  this.root.querySelector('#chapter-wallet')!.textContent=`${demo?'Demo · ':''}${s.credits} game credits · ${ryker?s.ownBuild.ryker?.recipe.ryker?.shocks?'Elka Stage 3 installed':'Stock Ryker suspension':u.equipped?'DDMWorks installed':'Stock suspension'}${b.legacyCrewAccess&&!b.duelCompleted?' · Earlier crew access retained':''}${this.client.durable?'':' · Session only'}`;
  for(const child of this.root.children)if(child instanceof HTMLElement&&child.id!=='crew-invitation')child.inert=this.invitation;
  this.root.setAttribute('aria-busy',String(this.pending));for(const button of this.root.querySelectorAll<HTMLButtonElement>('button'))button.disabled=this.pending||this.client.stale;
  this.root.querySelector<HTMLButtonElement>('#chapter-duel')!.disabled ||=!s.chapters.firstCompletion;this.root.querySelector<HTMLButtonElement>('#chapter-crew')!.disabled ||=!this.crewAvailable();
  this.root.querySelector<HTMLElement>('#crew-invitation')!.hidden=!this.invitation;const lines=this.root.querySelector<HTMLElement>('#crew-lines')!;if(!lines.dataset.gx){lines.dataset.gx='1';lines.textContent='Maya knows your line now. Jett brings the pace; Nico keeps it tidy. Two laps, top three. Bring the build you trust.';lines.insertAdjacentHTML('beforebegin',portraitMarkup(CREW.rae));lines.insertAdjacentHTML('afterend',`<div class="gx-lineup">${(['maya','jett','nico'] as const).map(id=>portraitMarkup(CREW[id],'gx-portrait is-small')).join('')}</div>`)}
 }
 setVisible(value:boolean){this.root.hidden=!value;if(value)this.menu.reset()}
 frame(sample:DeviceSample){if(!this.root.hidden&&!this.pending)(this.invitation?this.inviteMenu:this.menu).frame(sample)}
 inspect(){return {visible:!this.root.hidden,pending:this.pending,invitation:this.invitation,crew:this.client.state.crew}}
 dispose(){this.unsubscribe();this.root.remove()}
}
