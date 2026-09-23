import './interface/install';
import {activeProfile,visitorSearch} from './demo/profile';
import {showModelCandidate} from './presentation/model-candidate';
import {installVehicleSelection} from './presentation/ryker-selection';
import {installRecovery,showRecovery} from './demo/recovery';
installRecovery();
if(import.meta.env.MODE==='demo'){const safe=visitorSearch(location.search);if(new URLSearchParams(location.search).toString()!==safe)history.replaceState(null,'',location.pathname+(safe?'?'+safe:'')+location.hash)}
const params=new URLSearchParams(location.search),mode=params.get('scene')??'bay';
// The player career garage runs on the one showroom (signature scene, career mode). The retired workbench bay stays a
// developer tool, reached only through its explicit inspection/fixture parameters or ?workbench=1.
const developerBay=mode==='bay'&&['workbench','neutral','asset','diagnostic','shadow','debug'].some(key=>params.has(key)),garage=mode==='bay'&&!developerBay;
let loadingExit:HTMLAnchorElement|undefined;
async function loadScene(load:()=>Promise<unknown>){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Required scene loading timed out')),120000)})])}finally{clearTimeout(timer)}}
try{
if(!params.has('scene')&&!params.has('test')&&params.get('play')!=='career'){
 await loadScene(()=>import('./signature/scene'));
}else{
if(!['signature','express','ridge'].includes(mode)&&!garage){loadingExit=document.createElement('a');loadingExit.className='preview-loading-exit';loadingExit.href=location.pathname;loadingExit.textContent='Leave to the showroom';document.body.append(loadingExit)}
if (mode === 'calibration') {
  document.querySelector('#stage')!.textContent='P00 / CALIBRATION';
  document.querySelector('#title')!.textContent='Materials. Scale. Motion.';
  document.querySelector('#subtitle')!.textContent='Blender to glTF to Three.js - neutral calibration fixture';
  await loadScene(()=>import('./calibration'));
} else if(mode==='signature'||garage) await loadScene(()=>import('./signature/scene'));
else if(mode==='career') await loadScene(()=>import('./career-experience/hub'));
else if((mode==='express'||mode==='ridge')) await loadScene(()=>import('./express'));
else if(mode==='crew') await loadScene(()=>import('./express'));
else if(mode==='harbor') await loadScene(()=>import('./express'));
else await loadScene(()=>import('./workbench'));
loadingExit?.remove();
if(activeProfile()==='demo'&&!garage){const link=document.createElement('a');link.className='preview-return';link.textContent='Demo profile · Home';link.href=location.pathname;document.body.append(link)}
}
showModelCandidate();
installVehicleSelection();
}catch(error){console.error(error);showRecovery(/demo session/i.test(String((error as Error)?.message))?'demo':/webgl|context|graphics/i.test(String((error as Error)?.message))?'graphics':'assets')}
export {};
