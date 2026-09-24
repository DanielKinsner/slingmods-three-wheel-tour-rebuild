import './preview.css';
import {recoveryCopy,recoveryReport,retainRecoveryReport,type RecoveryKind} from './recovery-report';
declare const __BUILD_REF__:string;
let failed=false,active=true;
export const pageActive=()=>active;
export function showRecovery(kind:RecoveryKind,error?:unknown){
 if(failed)return;failed=true;active=false;window.dispatchEvent(new Event('blur'));
 const root=document.createElement('section');root.className='preview-recovery';root.setAttribute('role','alertdialog');root.setAttribute('aria-label','Game recovery');
 const scene=new URLSearchParams(location.search).get('scene')??'signature',{heading,message}=recoveryCopy(kind,scene);
 const report=recoveryReport(kind,error,{scene,build:typeof __BUILD_REF__==='string'?__BUILD_REF__:'development',elapsedMs:performance.now()});
 try{retainRecoveryReport(report,sessionStorage)}catch{/* Storage getter may also be denied. */}
 root.innerHTML=`<div><img class="recovery-brand" src="./assets/brand/slingmods-logo-main.png" alt="SlingMods"><p>SLINGMODS / RECOVERY</p><h1>${heading}</h1><p>${message}</p><button id="retry-loading">Retry page</button><a href="${location.pathname}">Back to showroom</a><details class="recovery-details"><summary>Error details</summary><pre></pre></details></div>`;
 root.querySelector('pre')!.textContent=JSON.stringify(report,null,2);
 for(const child of document.body.children)if(child instanceof HTMLElement)child.inert=true;document.body.append(root);root.setAttribute('aria-modal','true');root.querySelector<HTMLButtonElement>('button')!.onclick=()=>location.reload();root.addEventListener('keydown',event=>{if(event.code!=='Tab')return;const controls=[...root.querySelectorAll<HTMLElement>('button,a,summary')],index=controls.indexOf(document.activeElement as HTMLElement);event.preventDefault();controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus()});root.querySelector<HTMLButtonElement>('button')!.focus();
}
export function installRecovery(){
 addEventListener('pagehide',()=>{active=false});
 document.addEventListener('webglcontextlost',event=>{event.preventDefault();showRecovery('context')},true);
 // Scenes dispose their renderer/audio on pagehide. A BFCache return must create a new page,
 // not resume a disposed graph or restart a second animation loop in the cached document.
 addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
}
