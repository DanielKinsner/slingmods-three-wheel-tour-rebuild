import './chapter.css';
import type {CareerClient} from './client';
import {BuildMenuInput} from './menu';
import type {DeviceSample} from '../driving/input';
export interface ChapterHooks {build():void;shakedown():void;race():void;duel():void}
export class ChapterUI {
 readonly root=document.createElement('section');readonly menu:BuildMenuInput;private unsubscribe:()=>void;private pending=false;private invitation=false;private inviteMenu:BuildMenuInput;
 constructor(private client:CareerClient,private hooks:ChapterHooks){
  this.root.id='chapter-panel';this.root.setAttribute('aria-label','Build Matters chapter');
  this.root.innerHTML='<span class="chapter-eyebrow">SLINGMODS / CHAPTER 01</span><h1>Build Matters</h1><p id="chapter-status"></p><ol id="chapter-roadmap"></ol><div class="chapter-actions"><button id="continue-chapter" class="chapter-primary">Continue chapter</button><button id="chapter-time-trial">Time trial</button><button id="chapter-duel">Maya duel</button><button id="chapter-crew">Crew race</button><button id="chapter-build">Build</button></div><small id="chapter-wallet"></small><p id="chapter-feedback" role="status"></p><aside id="crew-invitation" role="dialog" aria-modal="true" aria-label="Crew invitation" hidden><strong>RAE / THE CREW</strong><p id="crew-lines"></p><button id="accept-crew">Skip dialogue · Race</button><button id="dismiss-crew">Later</button></aside>';
  document.querySelector('#app')!.append(this.root);this.menu=new BuildMenuInput(this.root,()=>this.dismiss());this.inviteMenu=new BuildMenuInput(this.root.querySelector('#crew-invitation')!,()=>this.dismiss());
  const on=(id:string,fn:()=>void)=>this.root.querySelector(id)!.addEventListener('click',()=>{if(!this.pending&&!this.client.stale)fn()});
  on('#continue-chapter',()=>this.continue());on('#chapter-time-trial',()=>hooks.shakedown());on('#chapter-duel',()=>{if(client.state.chapters.firstCompletion)hooks.duel()});on('#chapter-crew',()=>{if(this.crewAvailable())this.invite()});on('#chapter-build',()=>hooks.build());on('#accept-crew',()=>void this.accept());on('#dismiss-crew',()=>this.dismiss());
  this.root.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();(this.invitation?this.inviteMenu:this.menu).move(['ArrowUp','ArrowLeft'].includes(e.code)?-1:1)}else if(e.code==='Tab'&&this.invitation){e.preventDefault();this.inviteMenu.move(e.shiftKey?-1:1)}else if(e.code==='Escape'){e.preventDefault();this.dismiss()}});
  this.unsubscribe=client.subscribe(()=>this.update());this.update();
 }
 private crewAvailable(){const s=this.client.state;return s.chapters.firstCompletion&&(s.buildMatters.duelCompleted||s.buildMatters.legacyCrewAccess)}
 private continue(){const s=this.client.state;if(this.client.profile==='demo'){this.hooks.race();return}if(!s.chapters.firstCompletion)this.hooks.shakedown();else if(!s.buildMatters.duelCompleted)this.hooks.duel();else if(!s.suspension.owned&&s.credits>=1000)this.hooks.build();else this.invite()}
 private invite(){this.invitation=true;this.inviteMenu.reset();this.update();this.root.querySelector<HTMLButtonElement>('#accept-crew')!.focus()}
 private async accept(){if(!this.crewAvailable())return;this.pending=true;this.update();try{if(!this.client.state.crew.invitationSeen)await this.client.execute({type:'crew-invitation'});if(this.client.state.crew.cleared&&!this.client.state.crew.clearAcknowledged)await this.client.execute({type:'crew-acknowledge'});this.hooks.race()}catch(e){this.root.querySelector('#chapter-feedback')!.textContent=(e as Error).message}finally{this.pending=false;this.update()}}
 private dismiss(){if(this.pending)return;this.invitation=false;this.update();this.root.querySelector<HTMLButtonElement>('#continue-chapter')!.focus()}
 update(){const s=this.client.state,b=s.buildMatters,u=s.suspension,demo=this.client.profile==='demo';
  this.root.querySelector('#chapter-status')!.textContent=demo?'Prepared demo: Race the Harbor opens the existing crew event. Career progress stays separate.':!s.chapters.firstCompletion?'Learn the Harbor. Earn your workshop fund. Choose a setup. Take on the crew.':!b.duelCompleted?'Maya has a one-lap invitation. A clean finish funds your next build; a win pays extra.':s.crew.cleared?'Crew podium earned. Refine your setup, chase Maya, or improve your solo time.':'Your workshop fund is ready. Fit the DDMWorks suspension and try a setup, then race the crew. Stock is also welcome.';
  this.root.querySelector('#chapter-roadmap')!.innerHTML=`<li>${s.chapters.firstCompletion?'✓':'01'} Solo shakedown <small>First clean lap: 800 credits · repeats: 100</small></li><li>${b.duelCompleted?'✓':'02'} Maya / Find your line <small>New duel · 1 lap · first finish: 650–750</small></li><li>${u.owned?'✓':'03'} Workshop / Build matters <small>DDMWorks SM-3223 · 1000 credits</small></li><li>${s.crew.cleared?'✓':'04'} First Night / Crew race <small>Existing 2-lap event · first podium: +400</small></li>`;
  this.root.querySelector('#continue-chapter')!.textContent=demo?'Race the Harbor':!s.chapters.firstCompletion?'Continue · First lap':!b.duelCompleted?'Continue · Maya duel':!u.owned&&s.credits>=1000?'Continue · Suspension shop':'Continue · Crew race';
  this.root.querySelector('#chapter-wallet')!.textContent=`${demo?'Demo · ':''}${s.credits} game credits · ${u.equipped?'DDMWorks installed':'Stock suspension'}${b.legacyCrewAccess&&!b.duelCompleted?' · Earlier crew access retained':''}${this.client.durable?'':' · Session only'}`;
  for(const child of this.root.children)if(child instanceof HTMLElement&&child.id!=='crew-invitation')child.inert=this.invitation;
  this.root.setAttribute('aria-busy',String(this.pending));for(const button of this.root.querySelectorAll<HTMLButtonElement>('button'))button.disabled=this.pending||this.client.stale;
  this.root.querySelector<HTMLButtonElement>('#chapter-duel')!.disabled ||=!s.chapters.firstCompletion;this.root.querySelector<HTMLButtonElement>('#chapter-crew')!.disabled ||=!this.crewAvailable();
  this.root.querySelector<HTMLElement>('#crew-invitation')!.hidden=!this.invitation;this.root.querySelector('#crew-lines')!.textContent='RAE: Maya knows your line now. Jett brings the pace; Nico keeps it tidy. Two laps, top three. Bring the build you trust.';
 }
 setVisible(value:boolean){this.root.hidden=!value;if(value)this.menu.reset()}
 frame(sample:DeviceSample){if(!this.root.hidden&&!this.pending)(this.invitation?this.inviteMenu:this.menu).frame(sample)}
 inspect(){return {visible:!this.root.hidden,pending:this.pending,invitation:this.invitation,crew:this.client.state.crew}}
 dispose(){this.unsubscribe();this.root.remove()}
}
