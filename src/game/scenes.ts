import './scenes.css';
import {CREW,type CrewId} from './crew';
import {gameCue} from './audio-bus';
/**
 * Story scenes: short crew conversations before career events. The first beat of each is the event's existing line
 * (unchanged story text); the rest add the crew's voices. Presentation only; skipping never changes the event.
 */
export type Beat=[CrewId,string];
export const SCENES:Record<string,Beat[]>={
 'open-it-up':[['rae','Open it up on the straight. Brake before the bend. Bring back one clean lap.'],['jett','Or, hear me out, don\'t brake at all.'],['rae','Ignore him. Find your braking landmarks. The boards are there for a reason.'],['maya','One clean lap buys you your first part. Worth being patient for.']],
 'hold-your-nerve':[['jett','Speed is easy. Let\'s see who still has their nerve at the braking boards.'],['maya','He\'s going to dive under you into turn one. He always does.'],['jett','Always works, too.'],['rae','Let him. Stay tidy and pass him on the exit. Finishing moves the chapter; winning pays a bonus.']],
 'coastline-cup':[['maya','Two coastlines, one build. Keep it tidy. Every finish counts.'],['nico','Harbor first, then Express. Points stack, so a clean second beats a crashed first.'],['jett','Speak for yourself. I\'m here for two wins.'],['rae','Same build for both races. Pick your setup like you mean it.']],
 'find-the-ridge':[['rae','New road, same build. Leave room over the crest and find your way back.'],['nico','The ridge climbs, then drops away. The car goes light over the top. Don\'t steer while it\'s light.'],['rae','Solo lap in the late afternoon. Learn it before the others show up.']],
 'nico-ridge-duel':[['nico','I\'ll meet you at the ridge. Settle the car before the downhill bend.'],['jett','Nico drives like he\'s carrying groceries.'],['nico','And I\'m usually first to the finish with them.'],['rae','A valid finish advances you. Beat him and it goes in the record book.']],
 'summit-invitational':[['maya','Two laps before the light goes. Watch the boards, give each other room and enjoy the view.'],['jett','Blue hour, whole crew, no excuses.'],['nico','Lap one, learn the grip. Lap two, use it.'],['rae','Bring it home and Ridge Run is yours. Proud of you either way.']],
 'crew':[['rae','Maya knows your line now. Jett brings the pace; Nico keeps it tidy.'],['jett','Two laps after dark. Hope you saved some speed for the corners.'],['maya','He says that right before braking too late.'],['nico','Top three earns your place. Stock builds welcome.']],
};
/** Mounts a scene into `host`. `done` runs when the last beat is shown; `onFirst` lets the caller relabel its skip button. */
export class ScenePlayer {
 private i=0;private typing=0;private full='';private node=document.createElement('div');
 constructor(host:HTMLElement,private beats:Beat[],private done:()=>void,start=0,private resume=false){
  this.i=Math.min(start,beats.length-1);this.node.className='gx-scene';host.replaceChildren(this.node);this.node.addEventListener('click',e=>{if((e.target as Element).closest('[data-scene-next]')||(e.target as Element).closest('.gx-scene-text'))this.next()});this.show();
 }
 get index(){return this.i}
 private show(){
  const [id,text]=this.beats[this.i],m=CREW[id],last=this.i===this.beats.length-1;this.full=text;
  this.node.style.setProperty('--gx-crew',m.color);
  this.node.innerHTML=`<figure class="gx-scene-portrait"><img src="${m.portrait}" alt=""></figure><div class="gx-scene-body"><header><b>${m.name}</b><small>${m.role}</small><span>${this.i+1} / ${this.beats.length}</span></header><p class="gx-scene-text" aria-live="polite"></p>${last?'':'<button type="button" class="gx-scene-next" data-scene-next>Next <i aria-hidden="true">▸</i></button>'}</div>`;
  const p=this.node.querySelector('.gx-scene-text')!,resumed=this.resume;cancelAnimationFrame(this.typing);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||this.resume){p.textContent=text;this.resume=false}else{const t0=performance.now();const step=(now:number)=>{const n=Math.min(text.length,Math.floor((now-t0)/22));p.textContent=text.slice(0,n);if(n<text.length)this.typing=requestAnimationFrame(step)};this.typing=requestAnimationFrame(step)}
  if(!resumed)gameCue('gx.tab');if(last)this.done();else this.node.querySelector<HTMLElement>('[data-scene-next]')?.focus({preventScroll:true});
 }
 /** First press finishes the typing; the next moves on. */
 next(){const p=this.node.querySelector('.gx-scene-text');if(p&&p.textContent!==this.full){cancelAnimationFrame(this.typing);p.textContent=this.full;return}if(this.i<this.beats.length-1){this.i++;this.show()}}
 dispose(){cancelAnimationFrame(this.typing)}
}
