import {gameCue} from './audio-bus';
import {claimAchievements,type Achievement} from './achievements';
import type {Career} from '../career/store';
/** Achievement unlock toasts: one at a time, top centre; a long backlog (an older save meeting this for the first time) collapses. */
const queue:Achievement[]=[];let showing=false,extra=0;
function next(){
 if(showing)return;const a=queue.shift();if(!a){if(extra){const n=extra;extra=0;show('★',`${n} more unlocked`,'See them all in your Tour Log',false)}return}
 show(a.icon,a.title,a.detail,true);
}
function show(icon:string,title:string,detail:string,sound:boolean){
 showing=true;const t=document.createElement('div');t.className='gx-toast';t.setAttribute('role','status');
 t.innerHTML=`<i aria-hidden="true">${icon}</i><div><small>ACHIEVEMENT UNLOCKED</small><b>${title}</b><span>${detail}</span></div>`;document.body.append(t);if(sound)gameCue('gx.reward');
 setTimeout(()=>t.classList.add('is-out'),2600);setTimeout(()=>{t.remove();showing=false;next()},3100);
}
export function announceAchievements(career:Career|null){const fresh=claimAchievements(career);if(!fresh.length)return;const room=Math.max(0,3-queue.length);queue.push(...fresh.slice(0,room));extra+=Math.max(0,fresh.length-room);setTimeout(next,700)}
