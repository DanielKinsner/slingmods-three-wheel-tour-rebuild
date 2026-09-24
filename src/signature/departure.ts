import * as THREE from 'three';
import type {DeviceSample} from '../driving/input';
import './departure.css';

import {departurePose,DEPARTURE_SECONDS} from './departure-motion';
interface DepartureOptions {
 wheelRadius?:number;wheelbase?:number;parent:Element;car:THREE.Object3D;room:THREE.Object3D;camera:THREE.PerspectiveCamera;target:THREE.Vector3;
 onComplete:()=>void;onSoundStart?:()=>void;onSoundStop?:()=>void;onSoundFrame?:(elapsed:number,paused:boolean)=>void;onWheelPose?:(spin:number,steer:number,speed:number)=>void;
}
/** An interruptible real-scene animation; scene owns the immutable navigation snapshot. */
export class ShowroomDeparture {
 readonly root=document.createElement('section');private elapsed=0;private done=false;private paused=false;private focused=true;private padHeld=true;
 private curtain:THREE.Object3D|undefined;private doorStart?:THREE.Vector3;private doorScale?:THREE.Vector3;private carStart:THREE.Vector3;private carRotation:THREE.Quaternion;
 private cameraStart:THREE.Vector3;private cameraFov:number;private targetStart:THREE.Vector3;private previousFocus:HTMLElement|null;private wheels:{node:THREE.Object3D;rotation:THREE.Quaternion}[];
 private skipButton:HTMLButtonElement;private pauseButton:HTMLButtonElement;private label:HTMLElement;
 constructor(private options:DepartureOptions){
  this.curtain=options.room.getObjectByName('bay_door_curtain');this.doorStart=this.curtain?.position.clone();this.doorScale=this.curtain?.scale.clone();
  this.carStart=options.car.position.clone();this.carRotation=options.car.quaternion.clone();this.cameraStart=options.camera.position.clone();this.cameraFov=options.camera.fov;this.targetStart=options.target.clone();
  this.wheels=['front_left_spin','front_right_spin','rear_spin'].map(name=>options.car.getObjectByName(name)).filter((node):node is THREE.Object3D=>!!node).map(node=>({node,rotation:node.quaternion.clone()}));
  this.previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  this.root.className='sig-departure';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','Leaving the showroom');
  this.root.innerHTML='<i class="sig-matte sig-matte-top" aria-hidden="true"></i><i class="sig-matte sig-matte-bottom" aria-hidden="true"></i><div class="sig-departure-bar"><div><span class="sig-eyebrow">YOUR BUILD. YOUR DRIVE.</span><p aria-live="polite">Opening the bay</p></div><div class="sig-departure-actions"><button type="button" data-departure="pause">Pause</button><button type="button" data-departure="skip">Skip to drive <small>Esc</small></button></div></div>';
  this.skipButton=this.root.querySelector('[data-departure=skip]')!;this.pauseButton=this.root.querySelector('[data-departure=pause]')!;this.label=this.root.querySelector('p')!;
  this.skipButton.onclick=()=>this.finish();this.pauseButton.onclick=()=>this.togglePause();
  options.parent.append(this.root);document.addEventListener('keydown',this.key,true);document.addEventListener('focusin',this.focus,true);this.skipButton.focus();try{options.onSoundStart?.()}catch(error){this.cleanup();throw error}
 }
 private key=(event:KeyboardEvent)=>{if(this.done||this.root.closest('[inert]'))return;if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.finish()}else if(event.code==='Tab'){event.preventDefault();event.stopImmediatePropagation();(document.activeElement===this.skipButton?this.pauseButton:this.skipButton).focus()}};
 private focus=(event:FocusEvent)=>{if(!this.done&&!this.root.closest('[inert]')&&!this.root.contains(event.target as Node))this.skipButton.focus()};
 private togglePause(){this.paused=!this.paused;this.pauseButton.textContent=this.paused?'Resume':'Pause';this.updateLabel()}
 private updateLabel(){this.label.textContent=this.paused||!this.focused?'Departure paused':this.elapsed<2.3?'Opening the bay':'See you on the road'}
 frame(dt:number,input:DeviceSample){
  if(this.done)return;this.focused=input.focused;
  const accept=input.pads.some(p=>p?.connected&&p.mapping==='standard'&&(p.buttons[0]?.value??0)>.5),pause=input.pads.some(p=>p?.connected&&p.mapping==='standard'&&(p.buttons[9]?.value??0)>.5);
  if(input.focused&&!this.padHeld){if(accept){this.finish();return}if(pause)this.togglePause()}this.padHeld=accept||pause;
  this.updateLabel();if(this.paused||!input.focused){this.options.onSoundFrame?.(this.elapsed,true);return;}
  this.elapsed=Math.min(DEPARTURE_SECONDS,this.elapsed+Math.min(.1,Math.max(0,dt)));const pose=departurePose(this.elapsed);
  if(this.curtain&&this.doorStart&&this.doorScale){this.curtain.position.copy(this.doorStart).add(new THREE.Vector3(0,3.35*pose.door,0));this.curtain.scale.y=this.doorScale.y*(1-.975*pose.door);}
  this.options.car.position.copy(this.carStart).add(new THREE.Vector3(pose.x,0,pose.z));this.options.car.quaternion.copy(this.carRotation).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),pose.yaw));
  for(const wheel of this.wheels)wheel.node.quaternion.copy(wheel.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-pose.travel*8.3/(this.options.wheelRadius??.32)));
  const prior=departurePose(Math.max(2.3,this.elapsed-.016)),distance=Math.hypot(pose.x-prior.x,pose.z-prior.z),steer=this.options.wheelbase&&distance>.0001?THREE.MathUtils.clamp(Math.atan(this.options.wheelbase*(pose.yaw-prior.yaw)/distance),-.6,.6):0;this.options.onWheelPose?.(pose.travel*8.3/(this.options.wheelRadius??.32),steer,distance/.016);
  this.options.camera.position.lerpVectors(this.cameraStart,new THREE.Vector3(-2.8,2.25,-4.8),pose.camera);this.options.target.lerpVectors(this.targetStart,new THREE.Vector3(pose.x*.7,.65,pose.z),pose.camera);this.options.camera.fov=this.cameraFov+(46-this.cameraFov)*Math.min(1,this.elapsed);this.options.camera.updateProjectionMatrix();this.options.camera.lookAt(this.options.target);
  this.options.onSoundFrame?.(this.elapsed,false);if(pose.complete)this.finish();
 }
 get suspended(){return this.paused||!this.focused}
 inspect(){return {active:!this.done,elapsed:this.elapsed,paused:this.paused,focused:this.focused,doorFound:!!this.curtain,pose:departurePose(this.elapsed),car:this.options.car.position.toArray(),door:this.curtain?.position.toArray()}}
 finish(){if(this.done)return;this.done=true;this.options.onSoundStop?.();this.cleanup();this.options.onComplete()}
 dispose(){this.done=true;this.options.onSoundStop?.();this.cleanup();this.options.car.position.copy(this.carStart);this.options.car.quaternion.copy(this.carRotation);for(const w of this.wheels)w.node.quaternion.copy(w.rotation);if(this.curtain&&this.doorStart)this.curtain.position.copy(this.doorStart);if(this.curtain&&this.doorScale)this.curtain.scale.copy(this.doorScale);this.options.camera.fov=this.cameraFov;this.options.camera.updateProjectionMatrix();this.previousFocus?.focus()}
 private cleanup(){document.removeEventListener('keydown',this.key,true);document.removeEventListener('focusin',this.focus,true);this.root.remove()}
}
