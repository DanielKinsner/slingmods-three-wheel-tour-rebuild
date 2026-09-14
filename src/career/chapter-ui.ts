import './chapter.css';
import type {CareerClient} from './client';
import {BuildMenuInput} from './menu';
import type {DeviceSample} from '../driving/input';
export interface ChapterHooks {build():void;shakedown():void;race():void}
/** Bay entry menu. Navigation remains ordinary native buttons and the shared controller menu path. */
export class ChapterUI {
 readonly root=document.createElement('section');readonly menu:BuildMenuInput;private unsubscribe:()=>void;private pending=false;private invitation=false;private message='';
 constructor(private client:CareerClient,private hooks:ChapterHooks){
  this.root.id='chapter-panel';this.root.setAttribute('aria-label','First Night at the Harbor');this.root.innerHTML='<span class="chapter-eyebrow">SLINGMODS / CHAPTER 01</span><h1>First Night<br>at the Harbor</h1><p id="chapter-status"></p><div class="chapter-actions"><button id="continue-chapter" class="chapter-primary">Continue chapter</button><button id="chapter-time-trial">Time trial</button><button id="chapter-build">Build</button></div><small id="chapter-wallet"></small><p id="chapter-feedback" role="status"></p><aside id="crew-invitation" hidden><strong>RAE / THE CREW</strong><p id="crew-lines"></p><button id="accept-crew">Meet the crew →</button><button id="dismiss-crew">Later</button></aside>';
  document.querySelector('#app')!.append(this.root);this.menu=new BuildMenuInput(this.root,()=>this.dismiss());
  this.root.querySelector('#continue-chapter')!.addEventListener('click',()=>this.continue());this.root.querySelector('#chapter-time-trial')!.addEventListener('click',()=>{if(!this.pending&&!this.client.stale)this.hooks.shakedown()});this.root.querySelector('#chapter-build')!.addEventListener('click',()=>{if(!this.pending&&!this.client.stale)this.hooks.build()});
  this.root.querySelector('#accept-crew')!.addEventListener('click',()=>{void this.accept()});this.root.querySelector('#dismiss-crew')!.addEventListener('click',()=>this.dismiss());
  this.root.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();this.menu.move(['ArrowUp','ArrowLeft'].includes(e.code)?-1:1)}else if(e.code==='Escape'){e.preventDefault();this.dismiss()}});
  this.unsubscribe=client.subscribe(()=>this.update());this.update();
 }
 private continue(){if(this.pending||this.client.stale)return;const s=this.client.state;if(!s.chapters.firstCompletion){this.hooks.shakedown();return}if(!s.crew.invitationSeen){this.invitation=true;this.update();this.root.querySelector<HTMLButtonElement>('#accept-crew')!.focus()}else{void this.accept()}}
 private async accept(){if(this.pending)return;this.pending=true;this.message='Saving chapter progress…';this.update();let success=false;try{if(!this.client.state.crew.invitationSeen)await this.client.execute({type:'crew-invitation'});if(this.client.state.crew.cleared&&!this.client.state.crew.clearAcknowledged)await this.client.execute({type:'crew-acknowledge'});success=true}catch(e){this.message=(e as Error).message+' · Retry or choose another activity.'}finally{this.pending=false;this.update()}if(success)this.hooks.race()}
 private dismiss(){if(this.pending)return;this.invitation=false;this.update();this.root.querySelector<HTMLButtonElement>('#continue-chapter')!.focus()}
 update(){const s=this.client.state;this.root.setAttribute('aria-busy',String(this.pending));this.root.querySelector('#chapter-status')!.textContent=s.crew.cleared?'Chapter complete. Race the crew again, set a faster solo lap, or make the build yours.':s.chapters.firstCompletion?'Maya, Jett and Nico are waiting. Two laps after dark. Finish top three to join the crew.':'One clean lap earns your first credits. Then join three rivals for a night at the Harbor.';
  this.root.querySelector('#continue-chapter')!.textContent=s.crew.cleared?'Race again':s.chapters.firstCompletion?'Continue · Meet the crew':'Continue · First lap';
  this.root.querySelector('#chapter-wallet')!.textContent=s.credits+' game credits · '+(s.equipped?'Your saved '+s.appearance.color+' build':s.owned?'Kit owned · currently stock':'Stock is welcome')+(this.client.durable?'':' · Session only');
  this.root.querySelector('#chapter-feedback')!.textContent=this.message;const invitation=this.root.querySelector<HTMLElement>('#crew-invitation')!;invitation.hidden=!this.invitation;
  this.root.querySelector('#crew-lines')!.textContent="A clean lap tells me you know the road. Tonight, we find out how you share it. Two laps. Maya, Jett, Nico. Bring it home in the top three. "+(s.equipped?"There it is. Your build, your color. Now give them something to chase.":"Stock is welcome. The stopwatch doesn't care what you've bought.");
  for(const b of this.root.querySelectorAll<HTMLButtonElement>('button'))b.disabled=this.pending||this.client.stale;
 }
 setVisible(value:boolean){this.root.hidden=!value;if(value)this.menu.reset()}
 frame(sample:DeviceSample){if(!this.root.hidden)this.menu.frame(sample)}
 inspect(){return {visible:!this.root.hidden,pending:this.pending,invitation:this.invitation,crew:this.client.state.crew}}
 dispose(){this.unsubscribe();this.root.remove()}
}
