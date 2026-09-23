import type {PadSample} from '../driving/input';
/**
 * Touch driving for phones and tablets. The overlay publishes a virtual *standard* gamepad, so the existing input
 * resolver (stick X steers, RT gas, LT brake, A reset, Y camera, Start pause) drives exactly as a controller would:
 * no new physics or input rules, and the pad only takes over once it has been neutral, like a real one.
 *
 * Left thumb: drag anywhere on the left side (a floating stick appears where you touch). Right thumb: GAS and BRAKE
 * pedals. Small buttons: camera, reset (hold), pause. On by default on coarse pointers; `?touch=1` forces it (mouse too).
 */
const STICK_RADIUS=64;
export function touchDriveWanted(search=location.search){const q=new URLSearchParams(search).get('touch');if(q==='1')return true;if(q==='0')return false;return matchMedia('(pointer:coarse)').matches&&navigator.maxTouchPoints>0}

export class TouchDrive {
 readonly root=document.createElement('div');
 private steer=0;private stickId:number|null=null;private origin={x:0,y:0};private held=new Map<string,Set<number>>();private visible=false;
 private stick:HTMLElement;private knob:HTMLElement;
 constructor(parent:HTMLElement,private anyPointer=new URLSearchParams(location.search).get('touch')==='1'){
  this.root.className='gx-touch';this.root.hidden=true;this.root.setAttribute('aria-hidden','true');
  this.root.innerHTML=`<div class="gx-touch-steer" data-zone="steer"><div class="gx-touch-stick"><i></i></div><span class="gx-touch-hint">DRAG TO STEER</span></div>
<div class="gx-touch-pedals"><button type="button" class="gx-touch-pedal is-brake" data-btn="6">BRAKE</button><button type="button" class="gx-touch-pedal is-gas" data-btn="7">GAS</button></div>
<div class="gx-touch-tools"><button type="button" data-btn="3" aria-label="Change camera">CAM</button><button type="button" data-btn="0" aria-label="Hold to reset onto the road">RESET</button><button type="button" data-btn="9" aria-label="Pause">II</button></div>`;
  parent.append(this.root);this.stick=this.root.querySelector('.gx-touch-stick')!;this.knob=this.stick.querySelector('i')!;
  const zone=this.root.querySelector<HTMLElement>('[data-zone=steer]')!;
  zone.addEventListener('pointerdown',this.stickDown);zone.addEventListener('pointermove',this.stickMove);for(const t of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(t,this.stickUp as EventListener);
  for(const b of this.root.querySelectorAll<HTMLElement>('[data-btn]')){const id=b.dataset.btn!;this.held.set(id,new Set());
   b.addEventListener('pointerdown',e=>{if(!this.accepts(e))return;e.preventDefault();b.setPointerCapture(e.pointerId);this.held.get(id)!.add(e.pointerId);b.classList.add('is-down');if(id==='7'||id==='6')navigator.vibrate?.(6)});
   const up=(e:PointerEvent)=>{const s=this.held.get(id)!;s.delete(e.pointerId);if(!s.size)b.classList.remove('is-down')};for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,up as EventListener);
   b.addEventListener('contextmenu',e=>e.preventDefault())}
 }
 private accepts(e:PointerEvent){return e.pointerType!=='mouse'||this.anyPointer}
 private stickDown=(e:PointerEvent)=>{if(!this.accepts(e)||this.stickId!==null)return;e.preventDefault();(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);this.stickId=e.pointerId;this.origin={x:e.clientX,y:e.clientY};this.stick.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;this.stick.classList.add('is-on');this.root.classList.add('is-steering');this.stickMove(e)};
 private stickMove=(e:PointerEvent)=>{if(e.pointerId!==this.stickId)return;const dx=Math.max(-STICK_RADIUS,Math.min(STICK_RADIUS,e.clientX-this.origin.x));this.steer=dx/STICK_RADIUS;this.knob.style.transform=`translateX(${dx}px)`};
 private stickUp=(e:PointerEvent)=>{if(e.pointerId!==this.stickId)return;this.stickId=null;this.steer=0;this.knob.style.transform='';this.stick.classList.remove('is-on')};
 /** Show only while driving; hiding releases everything so nothing stays held behind a menu. */
 show(on:boolean){if(on===this.visible)return;this.visible=on;this.root.hidden=!on;if(!on)this.release()}
 private release(){this.stickId=null;this.steer=0;this.knob.style.transform='';this.stick.classList.remove('is-on');for(const s of this.held.values())s.clear();for(const b of this.root.querySelectorAll('.is-down'))b.classList.remove('is-down')}
 /** The virtual controller for this frame (neutral while the overlay is hidden). */
 pad():PadSample{
  const button=(i:number)=>{const on=!!this.held.get(String(i))?.size;return {value:on?1:0,pressed:on}};
  // Always connected: the resolver suspends input when its active pad disappears, so hidden = neutral, not unplugged.
  return {index:90,id:'SlingMods touch controls',connected:true,mapping:'standard',axes:[this.steer,0,0,0],buttons:Array.from({length:17},(_,i)=>button(i))};
 }
 dispose(){this.release();this.root.remove()}
}
