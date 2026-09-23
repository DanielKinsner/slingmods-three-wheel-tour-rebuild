import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {gameCue} from './audio-bus';
import {setPrompts} from './shell';
/**
 * Photo mode: from the pause menu, a free orbit camera around your car with the HUD hidden, a lens (FOV) control and
 * a PNG capture of the actual rendered frame. The race stays paused; nothing in the simulation or race state changes.
 * The orbit drives its own camera, copied onto the game camera after the chase camera has run, so gameplay camera code
 * never needs to know photo mode exists.
 */
export class PhotoMode {
 active=false;
 private rig=new THREE.PerspectiveCamera();private controls?:OrbitControls;private ui=document.createElement('div');private fov=45;private captureNext=false;private padToken=0;private hideUI=false;
 constructor(private canvas:HTMLCanvasElement,private camera:THREE.PerspectiveCamera,private target:()=>THREE.Vector3,private ground:(x:number,z:number)=>number,private onExit:()=>void){
  this.ui.className='gx-photo-ui';this.ui.hidden=true;
  this.ui.innerHTML=`<span class="gx-photo-title">PHOTO MODE</span><label>LENS<input type="range" min="20" max="90" step="1" value="45" data-photo="fov"><output>45°</output></label><button data-photo="hide">Hide UI</button><button data-photo="capture" class="is-primary">Capture</button><button data-photo="exit">Back</button><small>Drag to orbit · wheel to zoom · right-drag to pan</small>`;
  document.body.append(this.ui);
  this.ui.addEventListener('input',e=>{const t=e.target as HTMLInputElement;if(t.dataset.photo==='fov'){this.fov=Number(t.value);(t.nextElementSibling as HTMLOutputElement).value=t.value+'°'}});
  this.ui.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-photo]');if(!b)return;if(b.dataset.photo==='capture')this.capture();else if(b.dataset.photo==='exit')this.exit();else if(b.dataset.photo==='hide')this.toggleUI()});
  addEventListener('keydown',this.onKey,true);
 }
 private onKey=(e:KeyboardEvent)=>{if(!this.active)return;if(e.code==='Escape'||e.code==='Backspace'){e.preventDefault();e.stopPropagation();if(this.hideUI)this.toggleUI();else this.exit()}else if(e.code==='KeyH'){e.stopPropagation();this.toggleUI()}else if(e.code==='Enter'||e.code==='Space'){if(!(e.target instanceof HTMLButtonElement)){e.preventDefault();e.stopPropagation();this.capture()}}};
 private toggleUI(){this.hideUI=!this.hideUI;document.body.classList.toggle('gx-photo-clean',this.hideUI)}
 enter(){
  if(this.active)return;this.active=true;this.hideUI=false;document.body.classList.add('gx-photo');document.body.classList.remove('gx-photo-clean');
  this.rig.position.copy(this.camera.position);this.rig.quaternion.copy(this.camera.quaternion);this.fov=Math.round(this.camera.fov);this.rig.fov=this.fov;this.rig.aspect=this.camera.aspect;this.rig.near=this.camera.near;this.rig.far=this.camera.far;this.rig.updateProjectionMatrix();
  const fovInput=this.ui.querySelector<HTMLInputElement>('[data-photo=fov]')!;fovInput.value=String(this.fov);(fovInput.nextElementSibling as HTMLOutputElement).value=this.fov+'°';
  document.body.dataset.gxModal='1';this.controls=new OrbitControls(this.rig,this.canvas);this.controls.target.copy(this.target());this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minDistance=1.4;this.controls.maxDistance=26;this.controls.maxPolarAngle=Math.PI*.495;this.controls.update();
  this.ui.hidden=false;gameCue('gx.select');setPrompts([{key:'orbit',label:'Orbit'},{key:'confirm',label:'Capture'},{key:'back',label:'Back'}]);this.padLoop();
 }
 exit(){if(!this.active)return;this.active=false;delete document.body.dataset.gxModal;this.padToken++;this.controls?.dispose();this.controls=undefined;this.ui.hidden=true;document.body.classList.remove('gx-photo','gx-photo-clean');gameCue('gx.back');setPrompts(null);this.onExit()}
 /** After the gameplay camera ran: substitute the photo rig. Returns true while photo mode owns the view. */
 apply(){
  if(!this.active||!this.controls)return false;this.controls.update();
  const floor=this.ground(this.rig.position.x,this.rig.position.z)+.25;if(this.rig.position.y<floor){this.rig.position.y=floor;this.controls.update()}
  this.camera.position.copy(this.rig.position);this.camera.quaternion.copy(this.rig.quaternion);this.camera.fov=this.fov;this.camera.updateProjectionMatrix();return true;
 }
 capture(){this.captureNext=true;gameCue('gx.slam');this.ui.classList.remove('is-flash');void this.ui.offsetWidth;this.ui.classList.add('is-flash')}
 /** Call right after the frame is rendered (same task), so the drawing buffer still holds the image. */
 afterRender(){if(!this.captureNext)return;this.captureNext=false;this.canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');a.href=URL.createObjectURL(blob);a.download=`slingmods-tour-${stamp}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)},'image/png')}
 private padLoop(){const token=++this.padToken;let prior=[true,true];const tick=()=>{if(!this.active||token!==this.padToken||!this.controls)return;const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(p=>p?.connected&&p.mapping==='standard');
  if(pad){const dead=(v:number)=>Math.abs(v)<.15?0:v,ax=dead(pad.axes[0]??0),ay=dead(pad.axes[1]??0),zoom=dead(pad.axes[3]??0);
   if(ax||ay){const o=this.rig.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(o);s.theta-=ax*.035;s.phi=THREE.MathUtils.clamp(s.phi+ay*.03,.15,Math.PI*.495);o.setFromSpherical(s);this.rig.position.copy(this.controls.target).add(o)}
   if(zoom){const o=this.rig.position.clone().sub(this.controls.target);o.setLength(THREE.MathUtils.clamp(o.length()*(1+zoom*.025),1.4,26));this.rig.position.copy(this.controls.target).add(o)}
   const a=(pad.buttons[0]?.value??0)>.5,b=(pad.buttons[1]?.value??0)>.5;if(a&&!prior[0])this.capture();if(b&&!prior[1]){this.exit();return}prior=[a,b]}
  requestAnimationFrame(tick)};requestAnimationFrame(tick)}
 dispose(){this.exit();removeEventListener('keydown',this.onKey,true);this.ui.remove()}
}
