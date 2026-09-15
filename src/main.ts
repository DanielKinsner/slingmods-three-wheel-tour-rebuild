import {activeProfile,visitorSearch} from './demo/profile';
import {installRecovery,showRecovery} from './demo/recovery';
installRecovery();
if(import.meta.env.MODE==='demo'){const safe=visitorSearch(location.search);if(new URLSearchParams(location.search).toString()!==safe)history.replaceState(null,'',location.pathname+(safe?'?'+safe:''))}
const params=new URLSearchParams(location.search),mode=params.get('scene')??'bay';
let loadingExit:HTMLAnchorElement|undefined;
async function loadScene(load:()=>Promise<unknown>){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Required scene loading timed out')),120000)})])}finally{clearTimeout(timer)}}
try{
if(!params.has('scene')&&!params.has('test')&&params.get('play')!=='career'){
 const {mountPreview}=await import('./demo/entry');mountPreview();
}else{
loadingExit=document.createElement('a');loadingExit.className='preview-loading-exit';loadingExit.href=location.pathname;loadingExit.textContent='Return to Development Preview';document.body.append(loadingExit);
if (mode === 'calibration') {
  document.querySelector('#stage')!.textContent='P00 / CALIBRATION';
  document.querySelector('#title')!.textContent='Materials. Scale. Motion.';
  document.querySelector('#subtitle')!.textContent='Blender to glTF to Three.js - neutral calibration fixture';
  await loadScene(()=>import('./calibration'));
} else if(mode==='crew') await loadScene(()=>import('./crew'));
else if(mode==='harbor') await loadScene(()=>import('./harbor'));
else await loadScene(()=>import('./workbench'));
loadingExit.remove();
if(activeProfile()==='demo'){const link=document.createElement('a');link.className='preview-return';link.textContent='Development Preview · Demo profile';link.href=location.pathname;document.body.append(link)}
}
}catch(error){showRecovery(/demo session/i.test(String((error as Error)?.message))?'demo':/webgl|context|graphics/i.test(String((error as Error)?.message))?'graphics':'assets')}
export {};
