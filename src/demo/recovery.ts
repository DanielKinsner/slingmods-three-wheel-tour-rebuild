import './preview.css';
let failed=false,active=true;
export const pageActive=()=>active;
export function showRecovery(kind:'assets'|'graphics'|'context'|'demo'){
 if(failed)return;failed=true;active=false;window.dispatchEvent(new Event('blur'));
 const root=document.createElement('section');root.className='preview-recovery';root.setAttribute('role','alertdialog');root.setAttribute('aria-label','Game recovery');
 const heading=kind==='demo'?'This demo session needs a reset':kind==='assets'?'The showroom could not finish loading':kind==='context'?'Graphics connection interrupted':'WebGL 2 is unavailable';
 const message=kind==='demo'?'Your demo session cannot be read. Return to Development Preview and choose Reset demo. This resets only the prepared demo profile; your saved career is preserved.':kind==='assets'?'A required game asset or service could not load. Check your connection and retry the page. Your saved career has not been reset.':kind==='context'?'The game is paused. Reload to create a fresh graphics and audio session. This interrupts the current attempt; your saved career is preserved.':'This preview needs a desktop browser with WebGL 2 enabled. Check browser graphics support, then retry. You can return to the preview without starting a game.';
 root.innerHTML=`<div><img class="recovery-brand" src="./assets/brand/slingmods-logo-main.png" alt="SlingMods"><p>SLINGMODS / CONNECTION &amp; RECOVERY</p><h1>${heading}</h1><p>${message}</p><button id="retry-loading">Retry page</button><a href="${location.pathname}">Back to Showroom</a></div>`;for(const child of document.body.children)if(child instanceof HTMLElement)child.inert=true;document.body.append(root);root.setAttribute('aria-modal','true');root.querySelector<HTMLButtonElement>('button')!.onclick=()=>location.reload();root.addEventListener('keydown',event=>{if(event.code!=='Tab')return;const controls=[...root.querySelectorAll<HTMLElement>('button,a')],index=controls.indexOf(document.activeElement as HTMLElement);event.preventDefault();controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus()});root.querySelector<HTMLButtonElement>('button')!.focus();
}
export function installRecovery(){
 addEventListener('pagehide',()=>{active=false});
 document.addEventListener('webglcontextlost',event=>{event.preventDefault();showRecovery('context')},true);
 // Scenes dispose their renderer/audio on pagehide. A BFCache return must create a new page,
 // not resume a disposed graph or restart a second animation loop in the cached document.
 addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
}
