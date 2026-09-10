import './style.css';
import './workbench.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Simulation} from './simulation';
import {loadSave,writeSave} from './save';

const query=new URLSearchParams(location.search),driving=query.get('scene')==='pad';
const scene=new THREE.Scene();scene.background=new THREE.Color('#bac5cc');scene.fog=new THREE.Fog('#bac5cc',150,330);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,700);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;document.querySelector('#viewport')!.appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();scene.environmentIntensity=.55;
scene.add(new THREE.HemisphereLight(0xebf3ff,0x6d6960,1.6));const sun=new THREE.DirectionalLight(0xfff3dc,3.2);sun.position.set(8,14,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:55});sun.shadow.normalBias=.016;scene.add(sun);scene.add(sun.target);
const loader=new GLTFLoader();const vehicleFile=query.get('asset')==='fleet'?'scale-blockouts.glb':'slingshot.glb';
const [asset,pad]=await Promise.all([loader.loadAsync('/assets/vehicles/'+vehicleFile),loader.loadAsync('/assets/test-pad.glb')]);
const vehicle=new THREE.Group();vehicle.add(asset.scene);scene.add(vehicle);scene.add(pad.scene);
scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enabled=!driving;controls.target.set(0,.65,0);
const wheelNames=['front_left','front_right','rear'];const bindings=wheelNames.map(id=>{const steer=asset.scene.getObjectByName(id+'_steer');const spin=asset.scene.getObjectByName(id+'_spin');const positionNode=steer??spin;return {id,steer,spin,positionNode,basePos:positionNode?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
let sim=driving?await Simulation.create():null;
let current=sim?.telemetry(),previous=current;let accumulator=0,manual=query.has('test'),paused=false,cap=Number(query.get('cap')||60),last=performance.now(),lastDraw=last;let far=loadSave(localStorage).settings.camera==='far',reverse=false,resetHeld=0;
const input={throttle:0,brake:0,steer:0,reverse:false,tractionControl:true};const keys=new Set<string>();
const hud=document.createElement('aside');hud.id='telemetry';document.querySelector('#app')!.append(hud);
document.querySelector('#stage')!.textContent=driving?'P02 · DRIVING PAD':'P01 · RECOGNITION';document.querySelector('#title')!.textContent=driving?'Feel the foundation.':'2024 Slingshot R';if(vehicleFile==='scale-blockouts.glb')document.querySelector('#title')!.textContent='Three distinct proportions';document.querySelector('#subtitle')!.textContent=driving?'Three physical contacts · rear drive · AutoDrive prototype':'Neutral clay study · Blender source · runtime export';
document.querySelector('#hint')!.textContent=driving?'W throttle · S brake · A/D steer · X reverse · C camera · Hold R reset · Esc pause':'Drag to orbit · Scroll to inspect · 1/2/3/4/5 views';
const nav=document.createElement('nav');nav.innerHTML='<a href="?scene=vehicle">Inspect vehicle</a><a href="?scene=pad">Drive test pad</a><a href="?scene=calibration">Calibration</a>';document.querySelector('#app')!.append(nav);
const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),cameraRay=new THREE.Raycaster();
function pose(t:any){
 if(!t)return;vehicle.position.set(t.position.x,t.position.y,t.position.z);vehicle.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w:any,i:number)=>{const b=bindings[i];if(!b)return;if(b.positionNode&&b.basePos){b.positionNode.position.copy(b.basePos);b.positionNode.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 const root=vehicle.position;sun.position.set(root.x+8,root.y+14,root.z+5);sun.target.position.copy(root);
}
function cameraChase(dt:number,snap=false){
 const yaw=new THREE.Euler().setFromQuaternion(vehicle.quaternion,'YXZ').y;const orientation=new THREE.Quaternion().setFromAxisAngle(axisY,yaw);
 const desired=new THREE.Vector3(0,far?3.5:2.25,far?8.4:5.7).applyQuaternion(orientation).add(vehicle.position);
 const target=new THREE.Vector3(0,.7,-2.8).applyQuaternion(orientation).add(vehicle.position);
 const direction=desired.clone().sub(target),distance=direction.length();cameraRay.set(target,direction.normalize());cameraRay.far=distance;const obstruction=cameraRay.intersectObject(pad.scene,true)[0];if(obstruction)desired.copy(target).addScaledVector(direction,Math.max(.5,obstruction.distance-.3));
 camera.position.lerp(desired,snap?1:1-Math.exp(-dt*7));camera.lookAt(target);camera.fov=THREE.MathUtils.lerp(camera.fov,38+Math.min(Math.abs(current?.speed??0)*.15,7),snap?1:1-Math.exp(-dt*3));camera.updateProjectionMatrix();
}
function view(name:string){
 const presets:Record<string,[number,number,number]>={front:[0,.9,-7.6],rear:[0,1,7.6],side:[7.5,.9,0],threequarter:[5,3.3,-6],rearquarter:[4.6,2.8,6],cockpit:[-.5,2.4,1.4],fleet:[8,5,-11]};const p=presets[name]??presets.threequarter;camera.position.set(...p);controls.target.set(0,.6,0);camera.lookAt(controls.target);controls.update();renderer.render(scene,camera);
}
function updateHUD(){
 if(!current){document.querySelector('#status')!.textContent='P01 clay study · source Blender 4.5.2 · neutral runtime inspection';hud.innerHTML='<span class="metric">CLAY / 01</span><p>Diagnostic geometry<br>Not a finished vehicle</p>';return}
 const t=current;hud.innerHTML=`<div class="speed">${Math.round(Math.abs(t.speed)*2.23694)}<small>MPH</small></div><div class="drive-info">${t.gear<0?'R':t.gear} <span>GEAR</span> ${Math.round(t.rpm)} <span>RPM</span></div><div class="contacts">${t.wheels.map((w:any)=>`<div><b>${w.id.replace('front_','F·').replace('rear','R')}</b><span>${w.contact?'●':'○'} ${Math.round(w.load)} N</span><i style="width:${Math.min(100,w.load/60)}%"></i></div>`).join('')}</div><p>${paused?'PAUSED':t.shifting?'SHIFTING':reverse?'REVERSE SELECTED':'AUTODRIVE'} · ${far?'FAR':'NEAR'} CHASE</p>`;
 document.querySelector('#status')!.textContent=`P02 prototype · 60 Hz physics · ${t.wheels.filter((w:any)=>w.contact).length}/3 contacts · ${t.wheels.map((w:any)=>w.surface).filter((x:any,i:number,a:any[])=>a.indexOf(x)===i).join('/')} · sim ${t.time.toFixed(1)} s`;
}
addEventListener('keydown',e=>{if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyX')reverse=!reverse;if(e.code==='KeyC'){far=!far;const s=loadSave(localStorage);s.settings.camera=far?'far':'near';writeSave(localStorage,s)}if(e.code==='Escape'){paused=!paused;accumulator=0;updateHUD()}const views=['front','side','rear','threequarter','rearquarter'];if(!driving&&e.code.startsWith('Digit'))view(views[Number(e.code.slice(-1))-1]??'threequarter')});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(driving)paused=true;accumulator=0;updateHUD()});document.addEventListener('visibilitychange',()=>{keys.clear();accumulator=0;if(document.hidden&&driving)paused=true;last=performance.now();updateHUD()});
function step(control:typeof input,dt=1/60){if(!sim)return;previous=current;sim.step(control,dt);current=sim.telemetry()}
function draw(dt:number,snap=false){
 if(current){const t=structuredClone(current);if(previous&&!manual){const a=Math.min(1,accumulator*60);for(const c of ['x','y','z'] as const)t.position[c]=THREE.MathUtils.lerp(previous.position[c],current.position[c],a);const qa=new THREE.Quaternion(previous.quaternion.x,previous.quaternion.y,previous.quaternion.z,previous.quaternion.w).slerp(new THREE.Quaternion(current.quaternion.x,current.quaternion.y,current.quaternion.z,current.quaternion.w),a);Object.assign(t.quaternion,{x:qa.x,y:qa.y,z:qa.z,w:qa.w})}pose(t);cameraChase(dt,snap)}else controls.update();renderer.render(scene,camera);updateHUD();
}
if(driving){for(let i=0;i<120;i++)step(input);draw(1/60,true)}else{view(query.get('view')??(vehicleFile==='scale-blockouts.glb'?'fleet':'threequarter'));updateHUD()}
const debug={ready:true,mode:driving?'pad':'vehicle',asset:vehicleFile,view,inspect:()=>({bounds:new THREE.Box3().setFromObject(asset.scene).getSize(new THREE.Vector3()).toArray(),nodes:bindings.map(b=>({id:b.id,steer:!!b.steer,spin:!!b.spin,position:b.basePos?.toArray()})),telemetry:current??null,renderInfo:renderer.info.render,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)}),telemetry:()=>current,reset:(p?:any)=>{sim?.reset(p);current=sim?.telemetry();previous=current;accumulator=0;draw(1/60,true)},advance:(control:typeof input,seconds:number)=>{manual=true;for(let i=0;i<Math.round(seconds*60);i++)step(control);draw(seconds,true);return current},renderFrame:(control:typeof input,delta:number,present=true)=>{manual=true;accumulator+=delta;while(accumulator+1e-10>=1/60){step(control);accumulator-=1/60}if(present)draw(delta);return current},captureView:view,setCamera:(name:string)=>{far=name==='far';draw(1/60,true)}};(window as any).__TWT=debug;
function frame(now:number){const elapsed=Math.min((now-last)/1000,.1);last=now;if(!manual&&!paused&&!document.hidden){if(sim){input.throttle=Number(keys.has('KeyW')||keys.has('ArrowUp'));input.brake=Number(keys.has('KeyS')||keys.has('ArrowDown'));input.steer=Number(keys.has('KeyA')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight'));input.reverse=reverse;resetHeld=keys.has('KeyR')?resetHeld+elapsed:0;if(resetHeld>1){debug.reset();resetHeld=0}accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps++<6){step(input);accumulator-=1/60}}if(now-lastDraw>=1000/cap-1){draw((now-lastDraw)/1000);lastDraw=now}}if(manual)renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);draw(1/60)});addEventListener('pagehide',()=>{sim?.dispose();renderer.dispose();controls.dispose()});



