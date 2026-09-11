import './style.css';
import './workbench.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Simulation} from './simulation';
import {scenarios,type DrivingScenario} from './simulation/scenarios';
import {loadSave,writeSave} from './save';
import {configureShadows,type ShadowMode} from './presentation/shadows';
import {assetStatistics,measurePasses} from './presentation/statistics';
import {inspectionEnvironment,fitInspectionCamera,projectedBounds} from './presentation/inspection';

const query=new URLSearchParams(location.search),driving=query.get('scene')==='pad',bay=(query.get('scene')??'bay')==='bay';
document.body.classList.toggle('inspection-bay',bay);document.body.classList.toggle('debug-overlay',query.has('debug'));
const scene=new THREE.Scene();scene.background=new THREE.Color(bay?'#58616a':'#bac5cc');scene.fog=bay?null:new THREE.Fog('#bac5cc',150,330);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,700);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;document.querySelector('#viewport')!.appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),env=driving?new RoomEnvironment():inspectionEnvironment(bay);scene.environment=pmrem.fromScene(env,.04).texture;env.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}});pmrem.dispose();scene.environmentIntensity=driving?.55:bay?.95:.7;scene.environmentRotation.y=0;
scene.add(new THREE.HemisphereLight(0xebf3ff,driving?0x6d6960:0x77746f,driving?1.6:bay?1.05:1.1));const sun=new THREE.DirectionalLight(driving?0xfff3dc:0xfff9ef,driving?3.2:bay?.8:1.8);sun.position.set(bay?-3:8,bay?5:14,bay?-4:5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:55});sun.shadow.normalBias=.016;scene.add(sun);scene.add(sun.target);
if(!driving){const fill=new THREE.DirectionalLight(0xe5edff,bay?.65:.7);fill.position.set(-5,3,-4);scene.add(fill)}
if(bay){for(const [x,power]of [[-2.5,38],[2.8,26]]){const light=new THREE.SpotLight(0xf8f7f3,power,14,.92,.95,2);light.position.set(x,3.83,0);light.target.position.set(x*.15,0,-.3);scene.add(light,light.target)}}
const loader=new GLTFLoader();const vehicleFile=query.get('asset')==='fleet'?'scale-blockouts.glb':query.get('asset')==='p01'?'slingshot.glb':query.get('asset')==='p03a'?'slingshot-p03a.glb':'slingshot-p03a1.glb';
const [asset,pad]=await Promise.all([loader.loadAsync('/assets/vehicles/'+vehicleFile),loader.loadAsync(bay?'/assets/inspection-bay-p03a1.glb':'/assets/test-pad.glb')]);
const vehicle=new THREE.Group();vehicle.add(asset.scene);scene.add(vehicle);scene.add(pad.scene);
// Preserve graphic edge coverage at oblique inspection angles without raising every map's resolution.
if(vehicleFile==='slingshot-p03a1.glb')asset.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m instanceof THREE.MeshStandardMaterial&&m.name.includes('Radar_Blue')&&m.map){m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());m.map.needsUpdate=true}});
if(!driving&&!bay)pad.scene.traverse(o=>{if(o instanceof THREE.Mesh&&!/^ground$|^outer_field/.test(o.name))o.visible=false});
let shadowMode=(query.get('shadow')??'repaired') as ShadowMode;
let shadowCensus=configureShadows(vehicle,pad.scene,shadowMode,bay);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enabled=!driving;controls.target.set(0,.65,0);
controls.enablePan=!bay;
function render(){
 // Keep inspection views in front of the bay's rear wall (front face z=6.71m).
 // Preserve the viewing ray while dollying in; this also protects the Rear preset and zoom/orbit.
 if(bay&&camera.position.z>6.45){const offset=camera.position.clone().sub(controls.target);camera.position.copy(controls.target).addScaledVector(offset,(6.45-controls.target.z)/offset.z);camera.lookAt(controls.target)}
 renderer.render(scene,camera);
}

const wheelNames=['front_left','front_right','rear'];const bindings=wheelNames.map(id=>{const steer=asset.scene.getObjectByName(id+'_steer');const spin=asset.scene.getObjectByName(id+'_spin');const positionNode=steer??spin;return {id,steer,spin,positionNode,basePos:positionNode?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
if(query.has('diagnostic'))asset.scene.traverse(o=>{if(o instanceof THREE.Mesh){const arrayMaterial=Array.isArray(o.material);const mats=arrayMaterial?o.material as THREE.Material[]:[o.material as THREE.Material];o.material=mats.map(m=>{const copy=m.clone() as THREE.MeshStandardMaterial;if(query.get('diagnostic')==='shape'||copy.name.includes('Radar_Blue')){copy.color.set('#969da3');copy.map=null;copy.normalMap=null;copy.roughnessMap=null;copy.roughness=query.get('diagnostic')==='gloss'?.16:.65;copy.metalness=0}return copy});if(!arrayMaterial)o.material=(o.material as THREE.Material[])[0]}});
const rearCaliper=asset.scene.getObjectByName('suspension_rear__Brake_Caliper'),rearCaliperBase=rearCaliper?.position.clone();
const steeringControl=asset.scene.getObjectByName('steering_control');const steeringBase=steeringControl?.quaternion.clone();const steeringAxis=new THREE.Vector3(0,0,1); // Blender XZ rim exports to runtime XY; 10:1 display ratio is an estimate.
let sim=driving?await Simulation.create():null;
let current=sim?.telemetry(),previous=current;let accumulator=0,manual=query.has('test'),paused=false,cap=Number(query.get('cap')||60),last=performance.now(),lastDraw=last;let far=loadSave(localStorage).settings.camera==='far',reverse=false,resetHeld=0;
let activeScenario:DrivingScenario|undefined;let sweeping=false,sweepAngle=0;
const input={throttle:0,brake:0,steer:0,reverse:false,tractionControl:true};const keys=new Set<string>();
const hud=document.createElement('aside');hud.id='telemetry';document.querySelector('#app')!.append(hud);
const fidelity=vehicleFile==='slingshot-p03a1.glb',candidate=fidelity||vehicleFile==='slingshot-p03a.glb';
document.querySelector('#stage')!.textContent=(bay?(fidelity?'P03A1 / INSPECTION':'P03A / INSPECTION'):driving?'P02 / DRIVING PAD':'NEUTRAL / INSPECTION')+' · '+__BUILD_REF__;
document.querySelector('#title')!.textContent=vehicleFile==='scale-blockouts.glb'?'Three distinct proportions':'2024 Slingshot R';
document.querySelector('#subtitle')!.textContent=driving?'AutoDrive · Three-wheel test pad':candidate?'Radar Blue Fade · AutoDrive':'P01 clay baseline';
document.querySelector('#hint')!.textContent=driving?'W / S drive & brake · A / D steer · C camera · R hold reset · Esc pause':'Drag to orbit · Scroll to inspect';
const assetQuery=fidelity?'&asset=p03a1':candidate?'&asset=p03a':vehicleFile==='scale-blockouts.glb'?'&asset=fleet':'&asset=p01';
const nav=document.createElement('nav');nav.innerHTML=`<button id="inspect-action" type="button">Inspect</button><a class="drive-action" href="?scene=pad${assetQuery}">Drive</a><a href="?scene=bay${assetQuery}">Bay</a>`;document.querySelector('#app')!.append(nav);
const viewsBar=document.createElement('div');viewsBar.className='view-tools';viewsBar.hidden=true;viewsBar.innerHTML='<button data-view="front">Front</button><button data-view="side">Side</button><button data-view="rearquarter">Rear</button><button data-view="cockpit">Cockpit</button><button data-view="material">Material</button><button id="sweep-action">Light sweep</button>';document.querySelector('#app')!.append(viewsBar);
nav.querySelector('#inspect-action')!.addEventListener('click',()=>{if(driving){location.href='?scene=bay'+assetQuery;return}viewsBar.hidden=!viewsBar.hidden;view('threequarter')});
viewsBar.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>{sweeping=false;view(b.dataset.view!)}));viewsBar.querySelector('#sweep-action')!.addEventListener('click',()=>{sweeping=!sweeping});
const diagnostics=document.createElement('button');diagnostics.className='diagnostics-toggle';diagnostics.textContent='Diagnostics';diagnostics.addEventListener('click',()=>document.body.classList.toggle('debug-overlay'));document.querySelector('#app')!.append(diagnostics);
const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),cameraRay=new THREE.Raycaster();
function pose(t:any){
 if(!t)return;vehicle.position.set(t.position.x,t.position.y,t.position.z);vehicle.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w:any,i:number)=>{const b=bindings[i];if(!b)return;if(b.positionNode&&b.basePos){b.positionNode.position.copy(b.basePos);b.positionNode.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 // The caliper follows rear suspension travel without inheriting wheel spin. P01 has no such island.
 if(rearCaliper&&rearCaliperBase&&bindings[2].basePos){rearCaliper.position.copy(rearCaliperBase);rearCaliper.position.y+=t.wheels[2].localCenter.y-bindings[2].basePos.y}
 if(steeringControl&&steeringBase)steeringControl.quaternion.copy(steeringBase).multiply(q.setFromAxisAngle(steeringAxis,t.steer*10));const root=vehicle.position;sun.position.set(root.x+8,root.y+14,root.z+5);sun.target.position.copy(root);
}
function cameraChase(dt:number,snap=false){
 const yaw=new THREE.Euler().setFromQuaternion(vehicle.quaternion,'YXZ').y;const orientation=new THREE.Quaternion().setFromAxisAngle(axisY,yaw);
 const desired=new THREE.Vector3(0,far?3.5:2.25,far?8.4:5.7).applyQuaternion(orientation).add(vehicle.position);
 const target=new THREE.Vector3(0,.7,-2.8).applyQuaternion(orientation).add(vehicle.position);
 const direction=desired.clone().sub(target),distance=direction.length();cameraRay.set(target,direction.normalize());cameraRay.far=distance;const obstruction=cameraRay.intersectObject(pad.scene,true)[0];if(obstruction)desired.copy(target).addScaledVector(direction,Math.max(.5,obstruction.distance-.3));
 camera.position.lerp(desired,snap?1:1-Math.exp(-dt*7));camera.lookAt(target);camera.fov=THREE.MathUtils.lerp(camera.fov,38+Math.min(Math.abs(current?.speed??0)*.15,7),snap?1:1-Math.exp(-dt*3));camera.updateProjectionMatrix();
}
function reviewOrbit(angle:number){
 const bounds=new THREE.Box3().setFromObject(vehicle,true);controls.target.copy(fitInspectionCamera(camera,bounds,new THREE.Vector3(Math.sin(angle),.32,-Math.cos(angle)),.78));controls.update();render();return projectedBounds(camera,bounds);
}
function view(name:string){
 if(name==='bay'){controls.target.copy(fitInspectionCamera(camera,new THREE.Box3().setFromObject(vehicle,true),new THREE.Vector3(.7,.37,-1),.78));controls.update();render();return}
 const presets:Record<string,[number,number,number]>={front:[0,.9,-7.6],rear:[0,1,7.6],side:[7.5,.9,0],threequarter:[5,3.3,-6],rearquarter:[4.6,2.8,6],cockpit:[-.55,2.2,1.2],material:[2.3,1.15,-2.2],bay:[4.2,2.4,-6.3],fleet:[8,5,-11]};const p=presets[name]??presets.threequarter;if(!driving&&['front','rear','side','threequarter','rearquarter'].includes(name)){controls.target.copy(fitInspectionCamera(camera,new THREE.Box3().setFromObject(vehicle,true),new THREE.Vector3(p[0],p[1]-.6,p[2]),.76));controls.update();render();return}camera.position.set(...p);controls.target.set(name==='material'?.55:0,name==='material'?.52:.6,name==='material'?-1.25:0);camera.lookAt(controls.target);controls.update();render();
}
function updateHUD(){
 if(!current){document.querySelector('#status')!.textContent=candidate?(fidelity?'P03A1 candidate · ':'P03A candidate · ')+(bay?'Inspection bay':'Neutral inspection')+' · G3 pending':'P01 clay baseline · Neutral runtime inspection';hud.innerHTML='<span class="metric">'+(candidate?(fidelity?'P03A1 / CANDIDATE':'P03A / CANDIDATE'):'P01 / CLAY')+'</span><p>'+renderer.info.render.calls+' renderer calls · '+renderer.info.render.triangles.toLocaleString()+' submitted triangles</p>';return}
 const t=current;hud.innerHTML=`<div class="speed">${Math.round(Math.abs(t.speed)*2.23694)}<small>MPH</small></div><div class="drive-info">${t.gear<0?'R':t.gear} <span>GEAR</span> ${Math.round(t.rpm)} <span>RPM</span></div><div class="contacts">${t.wheels.map((w:any)=>`<div><b>${w.id.replace('front_','F·').replace('rear','R')}</b><span>${w.contact?'●':'○'} ${Math.round(w.load)} N</span><i style="width:${Math.min(100,w.load/60)}%"></i></div>`).join('')}</div><p>${paused?'PAUSED':t.shifting?'SHIFTING':reverse?'REVERSE SELECTED':'AUTODRIVE'} · ${far?'FAR':'NEAR'} CHASE</p>`;
 document.querySelector('#status')!.textContent=`P02 prototype · 60 Hz physics · ${t.wheels.filter((w:any)=>w.contact).length}/3 contacts · ${t.wheels.map((w:any)=>w.surface).filter((x:any,i:number,a:any[])=>a.indexOf(x)===i).join('/')} · sim ${t.time.toFixed(1)} s`;
}
addEventListener('keydown',e=>{if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyX')reverse=!reverse;if(e.code==='KeyC'){far=!far;const s=loadSave(localStorage);s.settings.camera=far?'far':'near';writeSave(localStorage,s)}if(e.code==='Escape'){paused=!paused;accumulator=0;resetHeld=0;keys.clear();updateHUD()}if(e.code==='KeyI')document.body.classList.toggle('debug-overlay');const views=['front','side','rear','threequarter','rearquarter'];if(!driving&&e.code.startsWith('Digit'))view(views[Number(e.code.slice(-1))-1]??'threequarter')});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyR')resetHeld=0});addEventListener('blur',()=>{keys.clear();resetHeld=0;if(driving)paused=true;accumulator=0;updateHUD()});document.addEventListener('visibilitychange',()=>{keys.clear();resetHeld=0;accumulator=0;if(document.hidden&&driving)paused=true;last=performance.now();updateHUD()});
function step(control:typeof input,dt=1/60){if(!sim)return;previous=current;sim.step(activeScenario?activeScenario.control(current?.time??0,current!):control,dt);current=sim.telemetry();if(activeScenario&&current.time>=activeScenario.seconds){paused=true}}
function draw(dt:number,snap=false){
 if(current){const t=structuredClone(current);if(previous&&!manual){const a=Math.min(1,accumulator*60);for(const c of ['x','y','z'] as const)t.position[c]=THREE.MathUtils.lerp(previous.position[c],current.position[c],a);const qa=new THREE.Quaternion(previous.quaternion.x,previous.quaternion.y,previous.quaternion.z,previous.quaternion.w).slerp(new THREE.Quaternion(current.quaternion.x,current.quaternion.y,current.quaternion.z,current.quaternion.w),a);Object.assign(t.quaternion,{x:qa.x,y:qa.y,z:qa.z,w:qa.w})}pose(t);cameraChase(dt,snap)}else controls.update();render();updateHUD();
}
if(driving){for(let i=0;i<120;i++)step(input);draw(1/60,true)}else{view(query.get('view')??(vehicleFile==='scale-blockouts.glb'?'fleet':bay?'bay':'threequarter'));updateHUD()}
const debug={ready:true,reviewOrbit,referenceCamera:(position:number[],target:number[],fov=38)=>{if(!query.has('test'))throw new Error('Test context required');camera.fov=fov;camera.updateProjectionMatrix();camera.position.fromArray(position);controls.target.fromArray(target);camera.lookAt(controls.target);controls.update();render();return projectedBounds(camera,new THREE.Box3().setFromObject(vehicle,true))},diagnosticFrame:(t:any,cameraPosition?:number[])=>{if(!query.has('test'))throw new Error('Diagnostic frame requires test context');manual=true;current=t;previous=t;draw(1/60,true);if(cameraPosition){camera.position.fromArray(cameraPosition);render()}},playScenario:(name:string)=>{const selected=scenarios.find(s=>s.name===name);if(!selected||!sim)throw new Error('Unknown driving scenario');activeScenario=selected;sim.reset(selected.pose);current=sim.telemetry();previous=current;manual=false;paused=false;accumulator=0;draw(1/60,true);return selected.seconds},mode:driving?'pad':bay?'bay':'vehicle',asset:vehicleFile,view,orbitView:(angle:number,radius=7.2,height=2.3)=>{if(driving)return;camera.position.set(Math.sin(angle)*radius,height,-Math.cos(angle)*radius);controls.target.set(0,.6,0);camera.lookAt(controls.target);controls.update();render()},lightSweep:(angle:number)=>{scene.environmentRotation.y=angle;sun.position.set(vehicle.position.x+8*Math.cos(angle),vehicle.position.y+14,vehicle.position.z+8*Math.sin(angle));render()},setShadows:(mode:ShadowMode)=>{shadowMode=mode;shadowCensus=configureShadows(vehicle,pad.scene,mode,bay);renderer.shadowMap.needsUpdate=true;draw(1/60,true);return shadowCensus},measurePasses:()=>measurePasses(renderer,scene,camera,pad.scene),inspect:()=>({assetStatistics:assetStatistics(asset.scene),shadowMode,shadowCensus,bounds:new THREE.Box3().setFromObject(asset.scene,true).getSize(new THREE.Vector3()).toArray(),nodes:bindings.map(b=>({id:b.id,steer:!!b.steer,spin:!!b.spin,position:b.basePos?.toArray(),presentedPosition:b.positionNode?.position.toArray(),spinQuaternion:b.spin?.quaternion.toArray(),steerQuaternion:b.steer?.quaternion.toArray()})),telemetry:current??null,rearCaliper:rearCaliper?{base:rearCaliperBase?.toArray(),position:rearCaliper.position.toArray(),quaternion:rearCaliper.quaternion.toArray()}:null,steeringControlQuaternion:steeringControl?.quaternion.toArray(),cameraPosition:camera.position.toArray(),cameraFov:camera.fov,projectedBounds:projectedBounds(camera,new THREE.Box3().setFromObject(vehicle,true)),renderInfo:renderer.info.render,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)}),telemetry:()=>current,reset:(p?:any)=>{activeScenario=undefined;sim?.reset(p);current=sim?.telemetry();previous=current;accumulator=0;draw(1/60,true)},advance:(control:typeof input,seconds:number)=>{manual=true;for(let i=0;i<Math.round(seconds*60);i++)step(control);draw(seconds,true);return current},renderFrame:(control:typeof input,delta:number,present=true)=>{manual=true;accumulator+=delta;while(accumulator+1e-10>=1/60){step(control);accumulator-=1/60}if(present)draw(delta);return current},captureView:view,setCamera:(name:string)=>{far=name==='far';draw(1/60,true)}};(window as any).__TWT=debug;
function frame(now:number){const elapsed=Math.min((now-last)/1000,.1);last=now;if(!manual&&!paused&&!document.hidden){if(sim){input.throttle=Number(keys.has('KeyW')||keys.has('ArrowUp'));input.brake=Number(keys.has('KeyS')||keys.has('ArrowDown'));input.steer=Number(keys.has('KeyA')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight'));input.reverse=reverse;if(!keys.has('KeyR'))resetHeld=0;else if(resetHeld===0)resetHeld=now;if(resetHeld>0&&now-resetHeld>=1000){debug.reset();resetHeld=-1}accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps++<6){step(input);accumulator-=1/60}}if(now-lastDraw>=1000/cap-1){draw((now-lastDraw)/1000);lastDraw=now}}if(sweeping&&!driving){sweepAngle+=elapsed*.35;scene.environmentRotation.y=sweepAngle;sun.position.set(8*Math.cos(sweepAngle),14,8*Math.sin(sweepAngle));render()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);draw(1/60)});addEventListener('pagehide',()=>{sim?.dispose();renderer.dispose();controls.dispose()});






