/** Keep race-menu focus inside the menu and audio controls while driving is paused. */
export function installRaceMenuFocus(root:HTMLElement){
 const onKey=(event:KeyboardEvent)=>{
  const menu=root.querySelector<HTMLElement>('#race-menu');if(!root.isConnected||root.closest('[inert]')||!menu||menu.hidden)return;
  const audio=document.querySelector<HTMLElement>('#game-audio'),target=event.target as Node|null;
  if(target&&target!==document.body&&!root.contains(target)&&!audio?.contains(target))return;
  const choices=[...menu.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary'),...document.querySelectorAll<HTMLElement>('#game-audio button:not(:disabled),#game-audio input,#game-audio summary')].filter(e=>!e.hidden&&!!e.getClientRects().length);
  if(!choices.length)return;const index=choices.indexOf(document.activeElement as HTMLElement);
  if(event.code==='Tab'||['ArrowUp','ArrowDown'].includes(event.code)){if(event.target instanceof HTMLInputElement&&event.code!=='Tab')return;event.preventDefault();const direction=event.code==='ArrowUp'||event.code==='Tab'&&event.shiftKey?-1:1;choices[(index+direction+choices.length)%choices.length].focus()}
 };
 // Audio is a sibling of the race root, so its key events must reach this same handler.
 document.addEventListener('keydown',onKey);
 const dispose=()=>{document.removeEventListener('keydown',onKey);observer.disconnect();window.removeEventListener('pagehide',dispose)};
 const observer=new MutationObserver(()=>{if(!root.isConnected)dispose()});observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pagehide',dispose,{once:true});return dispose;
}
