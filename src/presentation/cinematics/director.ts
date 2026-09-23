import {vehicleContact} from '../vehicle-contact';
import * as THREE from 'three';
import {motionReduced} from '../speed-feel';
import {FILMS,FinishFilmGate,filmDuration,sampleFilm,smooth,type Film} from './tracks';
import type {CinemaLook} from './lens';
import './film.css';

interface RaceState {phase:string;paused:boolean;playerResult?:{valid:boolean;attemptId:string;place:number|null;timeMs:number|null}|null}
interface Options {
  parent:Element; camera:THREE.PerspectiveCamera; hero:THREE.Object3D;
  vehicle:'slingshot'|'ryker'; destination:string; context:string;
  /** false: the victory film never starts by itself (Time Attack keeps retries instant); the launcher still offers it. */
  autoplay?:boolean;
  ground:(x:number,z:number)=>number;
  obstruction:(target:THREE.Vector3,desired:THREE.Vector3)=>number|undefined;
  score:(film:Film|null,elapsed?:number)=>void;
}

/** Owns ONLY the presentation camera and its own overlay. No world/save/award references.
 * Called after the ordinary camera so ending a film naturally restores the live view. */
export class RaceFilmDirector {
  private overlay=document.createElement('section');
  private launcher=document.createElement('details');
  private title=document.createElement('h1');private eyebrow=document.createElement('p');
  private detail=document.createElement('p');private shotLabel=document.createElement('span');
  private progress=document.createElement('i');private skip=document.createElement('button');
  private veil=document.createElement('div');private titleBlock=document.createElement('div');
  private parked=vehicleContact();
  private gate=new FinishFilmGate();private film:Film|null=null;private elapsed=0;private shot=-1;
  private done?:()=>void;private preview=false;private reduced=false;private resumeFocus:HTMLElement|null=null;
  private suppressed:HTMLElement[]=[];private padReleased=false;private dead=false;
  private position=new THREE.Vector3();private target=new THREE.Vector3();private orientation=new THREE.Quaternion();
  private euler=new THREE.Euler();private forward=new THREE.Vector3();
  private result:RaceState['playerResult'];private disabled=false;
  readonly look:CinemaLook={amount:0,focus:5,aperture:0,time:0};
  private key=(e:KeyboardEvent)=>{
    if(!this.active||!['Escape','Space','Enter','Backspace'].includes(e.code))return;
    if((e.target as HTMLElement)?.closest('#game-audio')&&e.code!=='Escape')return;
    e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.end(true);
  };
  constructor(private options:Options){
    options.hero.add(this.parked.mesh);this.parked.mesh.visible=false;
    this.overlay.className='race-film';this.overlay.hidden=true;this.overlay.setAttribute('aria-label','Race cinematic');
    this.overlay.innerHTML='<div class="film-matte film-matte-top"></div><div class="film-matte film-matte-bottom"></div><div class="film-edge"></div><div class="film-brand"><b>SLINGMODS</b><span>THREE WHEEL TOUR</span></div>';
    this.titleBlock.className='film-titles';this.eyebrow.className='film-eyebrow';this.detail.className='film-detail';
    this.titleBlock.append(this.eyebrow,this.title,this.detail);this.titleBlock.setAttribute('aria-live','polite');
    this.veil.className='film-shutter';this.shotLabel.className='film-shot';
    const footer=document.createElement('div');footer.className='film-footer';
    const timeline=document.createElement('span');timeline.className='film-timeline';timeline.setAttribute('aria-hidden','true');timeline.append(this.progress);
    this.skip.className='film-skip';this.skip.textContent='Skip cinematic  ↗';this.skip.onclick=()=>this.end(true);
    footer.append(this.shotLabel,timeline,this.skip);this.overlay.append(this.titleBlock,footer,this.veil);
    this.launcher.className='film-launcher';this.launcher.setAttribute('aria-label','Cinematic previews');
    const label=document.createElement('summary');label.textContent="Director's cut";this.launcher.append(label);const library=document.createElement('div');library.className='film-library';this.launcher.append(library);
    for(const [film,label]of [['arrival','Destination'],['grid','On the grid'],['victory','Victory']] as const){
      const button=document.createElement('button');button.textContent=label;button.dataset.film=film;
      button.onclick=()=>this.play(film,undefined,true);library.append(button);
    }
    const toggle=document.createElement('button');toggle.className='film-auto';toggle.textContent='Auto cinematics: on';toggle.setAttribute('aria-pressed','true');
    try{this.disabled=localStorage.getItem('slingmods-race-films')==='off'}catch{}
    const refresh=()=>{toggle.textContent='Auto cinematics: '+(this.disabled?'off':'on');toggle.setAttribute('aria-pressed',String(!this.disabled))};refresh();
    toggle.onclick=()=>{this.disabled=!this.disabled;try{localStorage.setItem('slingmods-race-films',this.disabled?'off':'on')}catch{}refresh()};
    library.append(toggle);options.parent.append(this.overlay,this.launcher);
    addEventListener('keydown',this.key,true);
  }
  get active(){return this.film!==null}
  /** Returns true only when the actual start must wait for the film's completion. */
  beforeStart(start:()=>void){if(this.disabled||motionReduced())return false;this.play('grid',start);return true}
  play(film:Film,done?:()=>void,preview=false){
    if(this.active||this.dead)return;
    this.film=film;this.done=done;this.preview=preview;this.elapsed=0;this.shot=-1;this.reduced=motionReduced();this.padReleased=false;
    this.resumeFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    this.suppressed=[...this.options.parent.querySelectorAll<HTMLElement>('#harbor-ui,#game-graphics,.film-launcher')].filter(e=>!e.inert);
    for(const node of this.suppressed)node.inert=true;
    this.overlay.hidden=false;document.body.classList.add('race-film-active');this.skip.focus({preventScroll:true});
    this.skip.textContent=done?'Skip · Go to grid  ↗':preview?'Back to race  ↗':'View results  ↗';
    this.overlay.dataset.film=film;
    this.eyebrow.textContent=preview?'DIRECTOR’S CUT / CINEMATIC PREVIEW':film==='victory'?'THE FINISH / '+this.options.destination.toUpperCase():'SLINGMODS / '+this.options.destination.toUpperCase();
    this.title.textContent=film==='arrival'?'Find your\nfreedom.':film==='grid'?'Make it\nyour race.':preview||this.result?.place===1?'You own\nthis moment.':'Leave it all\non the road.';
    const time=this.result?.timeMs;
    this.detail.textContent=film==='victory'&&!preview?`${this.result?.place===1?'VICTORY':`P${this.result?.place??'—'} / FINISH`}  /  ${time==null?'':(time/1000).toFixed(3)+' SEC'}`:film==='arrival'?this.options.destination.toUpperCase()+' / '+this.options.context.toUpperCase():this.options.vehicle==='ryker'?'CAN-AM RYKER 900 / THREE WHEELS. ONE LINE.':'POLARIS SLINGSHOT / THREE WHEELS. ONE LINE.';
    this.options.score(film,0);
  }
  private end(complete:boolean){
    if(!this.active)return;
    const done=this.done;this.done=undefined;this.film=null;this.look.amount=0;this.parked.mesh.visible=false;this.overlay.hidden=true;
    this.options.camera.clearViewOffset();this.options.camera.up.set(0,1,0);this.options.camera.updateProjectionMatrix();
    document.body.classList.remove('race-film-active');for(const node of this.suppressed)node.inert=false;this.suppressed=[];
    this.options.score(null);if(this.resumeFocus?.isConnected&&!this.resumeFocus.closest('[hidden]'))this.resumeFocus.focus({preventScroll:true});
    if(complete)done?.();
  }
  cancel(){this.end(false)}
  /** Called with ordinary sampled controller state; release gate prevents the start press skipping immediately. */
  input(pads:readonly ({buttons:readonly {value:number}[]}|null)[]){
    if(!this.active)return;const pressed=pads.some(p=>p&&[0,1,9].some(i=>(p.buttons[i]?.value??0)>.5));
    if(!pressed)this.padReleased=true;else if(this.padReleased)this.end(true);
  }
  update(dt:number,state:RaceState,hidden=false){
    this.parked.mesh.visible=this.active&&state.phase==='ready';if(this.parked.mesh.visible)this.parked.ground(this.options.hero,this.options.ground);
    const canWatch=(state.phase==='ready'||!!state.playerResult)&&!state.paused;
    this.launcher.hidden=!canWatch||this.active;
    if(this.gate.accept(state.playerResult,state.paused)&&!this.disabled&&this.options.autoplay!==false&&!motionReduced()){
      this.result=state.playerResult;if(!this.active)this.play('victory');
    }
    if(!this.film)return;
    if(hidden||state.paused){this.options.score(null);return}
    // Honour an accessibility preference changed while the film is already playing.
    if(motionReduced()&&!this.reduced){this.end(true);return}
    this.elapsed+=Math.max(0,Math.min(.1,dt));
    const duration=this.reduced?1.2:filmDuration(this.film);
    if(this.elapsed>=duration){this.end(true);return}
    const sample=sampleFilm(this.film,this.reduced?filmDuration(this.film)-1:this.elapsed),{shot}=sample;
    const o=this.options,camera=o.camera,scale=o.vehicle==='ryker'?.7:1;
    // Stabilize roll/pitch: the film tracks the real position/yaw, not suspension vibration.
    this.euler.setFromQuaternion(o.hero.quaternion,'YXZ');this.orientation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,this.euler.y);
    this.position.fromArray(sample.position).multiplyScalar(scale);
    this.target.fromArray(sample.aim).multiplyScalar(scale);
    // Preserve the horizontal composition in portrait view without clipping the vehicle.
    const portrait=camera.aspect<1;
    if(portrait){this.position.x*=.65;this.position.z*=1.28;this.position.y+=.35;this.target.x*=.15}
    this.position.applyQuaternion(this.orientation).add(o.hero.position);
    this.target.applyQuaternion(this.orientation).add(o.hero.position);
    this.position.y=Math.max(this.position.y,o.ground(this.position.x,this.position.z)+.22);
    const distance=this.position.distanceTo(this.target),hit=o.obstruction(this.target,this.position);
    if(hit!==undefined&&hit<distance){
      // Lift over a rail before allowing a tight inward correction; never penetrate scenery.
      this.position.y+=Math.min(4,Math.max(.8,distance-hit));
      const lifted=o.obstruction(this.target,this.position);
      if(lifted!==undefined){this.forward.copy(this.position).sub(this.target).normalize();this.position.copy(this.target).addScaledVector(this.forward,Math.max(.45,lifted-.25))}
    }
    camera.clearViewOffset();camera.position.copy(this.position);camera.up.set(0,1,0);camera.fov=portrait?Math.max(62,sample.fov):sample.fov;camera.lookAt(this.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    this.look.amount=this.reduced?0:1;this.look.focus=camera.position.distanceTo(this.target);this.look.aperture=this.reduced?0:shot.aperture;this.look.time=this.elapsed;
    const show=this.reduced||!!shot.title;
    const reveal=this.reduced?1:smooth((sample.local-.16)/.65);
    this.titleBlock.style.opacity=show?String(reveal):'0';
    this.titleBlock.style.transform=`translate3d(0,${show?(1-reveal)*28:28}px,0)`;
    this.progress.style.transform=`scaleX(${this.elapsed/duration})`;
    // A black shutter at the opening and exit; interior cuts remain clean, with no white flashes.
    const fade=this.reduced?0:Math.max(1-smooth(this.elapsed/.48),smooth((this.elapsed-duration+.35)/.35));
    this.veil.style.opacity=String(fade);
    if(this.shot!==sample.index){this.shot=sample.index;this.shotLabel.textContent=`${String(sample.index+1).padStart(2,'0')} / ${String(FILMS[this.film].length).padStart(2,'0')}   ${shot.name.toUpperCase()}`}
    this.options.score(this.film,this.elapsed);
  }
  seek(seconds:number){if(this.active&&Number.isFinite(seconds))this.elapsed=Math.max(0,seconds)}
  inspect(){return{active:this.active,film:this.film,elapsed:this.elapsed,shot:this.shot,preview:this.preview,reducedMotion:this.reduced,auto:!this.disabled,look:{...this.look}}}
  dispose(){this.dead=true;this.end(false);removeEventListener('keydown',this.key,true);this.parked.dispose();this.overlay.remove();this.launcher.remove()}
}
