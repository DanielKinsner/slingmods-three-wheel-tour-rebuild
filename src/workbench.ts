import {prepareRenderer,preparationVeil} from './presentation/prepare';
import {careerClient} from './career/client';
import {BuildUI} from './career/build-ui';
import {ProductPresenter} from './presentation/product';
import './style.css';
import './workbench.css';
import {mountHarborEntry} from './harbor-entry';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Simulation} from './simulation';
import {scenarios,type DrivingScenario} from './simulation/scenarios';
import {loadSave,writeSave,browserStorage} from './save';
import {configureShadows,type ShadowMode} from './presentation/shadows';
import {assetStatistics,measurePasses} from './presentation/statistics';
import {inspectionEnvironment,fitInspectionCamera,projectedBounds} from './presentation/inspection';
import {DrivingSession,PRACTICE_START} from './driving/session';
import {KeyboardBuffer,type DeviceSample} from './driving/input';
import {DrivingCamera,nextDrivingView,type DrivingView} from './presentation/driving-camera';
import {GameAudio,renderOfflineGameAudio} from './audio/game-audio';
import {RearDiagnostic} from './presentation/rear-diagnostic';
import {RearPresenter,type RearRig} from './presentation/rear';
import {CURRENT_VEHICLE,CURRENT_REAR_RIG} from './presentation/vehicle-asset';
import {DriverPresenter,type DriverAttachment} from './presentation/driver';

const query=new URLSearchParams(location.search),driving=query.get('scene')==='pad',bay=(query.get('scene')??'bay')==='bay';
document.body.classList.toggle('inspection-bay',bay);document.body.classList.toggle('debug-overlay',query.has('debug'));
const workbenchStarted=performance.now(),prepVeil=preparationVeil(document.querySelector('#app')!);
const scene=new THREE.Scene();scene.background=new THREE.Color(bay?'#58616a':'#bac5cc');scene.fog=bay?null:new THREE.Fog('#bac5cc',150,330);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,700);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;document.querySelector('#viewport')!.appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),env=driving?new RoomEnvironment():inspectionEnvironment(bay);scene.environment=pmrem.fromScene(env,.04).texture;env.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}});pmrem.dispose();scene.environmentIntensity=driving?.55:bay?.95:.7;scene.environmentRotation.y=0;
scene.add(new THREE.HemisphereLight(0xebf3ff,driving?0x6d6960:0x77746f,driving?1.6:bay?1.05:1.1));const sun=new THREE.DirectionalLight(driving?0xfff3dc:0xfff9ef,driving?3.2:bay?.8:1.8);sun.position.set(bay?-3:8,bay?5:14,bay?-4:5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:55});sun.shadow.normalBias=.016;scene.add(sun);scene.add(sun.target);
if(!driving){const fill=new THREE.DirectionalLight(0xe5edff,bay?.65:.7);fill.position.set(-5,3,-4);scene.add(fill)}
if(bay){for(const [x,power]of [[-2.5,38],[2.8,26]]){const light=new THREE.SpotLight(0xf8f7f3,power,14,.92,.95,2);light.position.set(x,3.83,0);light.target.position.set(x*.15,0,-.3);scene.add(light,light.target)}}
const proofAsset=query.has('test')&&/^p03a2-proof0[12]$/.test(query.get('asset')??'')?`slingshot-${query.get('asset')}.glb`:undefined;
const loader=new GLTFLoader();const vehicleFile=proofAsset??(['p03a2','p04a1'].includes(query.get('asset')??'')?CURRENT_VEHICLE:query.get('asset')==='fleet'?'scale-blockouts.glb':query.get('asset')==='p01'?'slingshot.glb':query.get('asset')==='p03a'?'slingshot-p03a.glb':query.get('asset')==='p03a1'?'slingshot-p03a1.glb':CURRENT_VEHICLE);
const [asset,pad]=await Promise.all([loader.loadAsync('/assets/vehicles/'+vehicleFile),loader.loadAsync(bay?'/assets/inspection-bay-p03a1.glb':'/assets/test-pad.glb')]);
const vehicle=new THREE.Group();vehicle.add(asset.scene);scene.add(vehicle);scene.add(pad.scene);
const career=await careerClient(),product=vehicleFile===CURRENT_VEHICLE?await ProductPresenter.load(loader,vehicle,scene):undefined;
let buildUI:BuildUI|undefined;const syncProduct=()=>product?.set(career.state.equipped,career.state.appearance);syncProduct();const unsubCareer=career.subscribe(()=>{if(!buildUI)syncProduct()});
// Preserve graphic edge coverage at oblique inspection angles without raising every map's resolution.
if(['slingshot-p03a1.glb','slingshot-p03a2.glb',CURRENT_VEHICLE].includes(vehicleFile))asset.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m instanceof THREE.MeshStandardMaterial&&m.name.includes('Radar_Blue')&&m.map){m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());m.map.needsUpdate=true}});
if(!driving&&!bay)pad.scene.traverse(o=>{if(o instanceof THREE.Mesh&&!/^ground$|^outer_field/.test(o.name))o.visible=false});
let shadowMode=(query.get('shadow')??'repaired') as ShadowMode;
let shadowCensus=configureShadows(vehicle,pad.scene,shadowMode,bay);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enabled=!driving;controls.target.set(0,.65,0);
controls.enablePan=!bay;
function render(){
 // Keep inspection views in front of the bay's rear wall (front face z=6.71m).
 // Preserve the viewing ray while dollying in; this also protects the Rear preset and zoom/orbit.
 if(bay&&camera.position.z>6.45){const offset=camera.position.clone().sub(controls.target);camera.position.copy(controls.target).addScaledVector(offset,(6.45-controls.target.z)/offset.z);camera.lookAt(controls.target)}
 product?.update();renderer.render(scene,camera);
}

const wheelNames=['front_left','front_right','rear'];const bindings=wheelNames.map(id=>{const steer=asset.scene.getObjectByName(id+'_steer');const spin=asset.scene.getObjectByName(id+'_spin');const positionNode=steer??spin;return {id,steer,spin,positionNode,basePos:positionNode?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
if(query.has('diagnostic'))asset.scene.traverse(o=>{if(o instanceof THREE.Mesh){const arrayMaterial=Array.isArray(o.material);const mats=arrayMaterial?o.material as THREE.Material[]:[o.material as THREE.Material];o.material=mats.map(m=>{const copy=m.clone() as THREE.MeshStandardMaterial;if(query.get('diagnostic')==='shape'||copy.name.includes('Radar_Blue')){copy.color.set('#969da3');copy.map=null;copy.normalMap=null;copy.roughnessMap=null;copy.roughness=query.get('diagnostic')==='gloss'?.16:.65;copy.metalness=0}return copy});if(!arrayMaterial)o.material=(o.material as THREE.Material[])[0]}});
const rearPresenter=vehicleFile===CURRENT_VEHICLE?new RearPresenter(asset.scene,await(await fetch(CURRENT_REAR_RIG)).json() as RearRig):undefined;
const rearDiagnostic=query.has('test')&&rearPresenter?new RearDiagnostic(rearPresenter):undefined;
const rearCaliper=asset.scene.getObjectByName('suspension_rear__Brake_Caliper'),rearCaliperBase=rearCaliper?.position.clone();
const steeringControl=asset.scene.getObjectByName('steering_control');const steeringBase=steeringControl?.quaternion.clone();const steeringAxis=new THREE.Vector3(0,0,1); // Blender XZ rim exports to runtime XY; 10:1 display ratio is an estimate.
let sim=driving?await Simulation.create():null;
let current=sim?.telemetry(),previous=current;let accumulator=0,manual=query.has('test')&&!query.has('clock'),paused=false,cap=Number(query.get('cap')||60),last=performance.now(),lastDraw=last;let cameraMode:DrivingView=loadSave(browserStorage()).settings.camera,reverse=false;
let activeScenario:DrivingScenario|undefined;let sweeping=false,sweepAngle=0;
const input={throttle:0,brake:0,steer:0,reverse:false,tractionControl:true};const keyboard=new KeyboardBuffer();const keys=keyboard.held;
const controlledClock=query.has('test')&&query.get('clock')==='controlled';
let virtualSample:DeviceSample|undefined,normalPresenting=false,lookBack=false;
const readDevices=():DeviceSample=>virtualSample??{...keyboard.read(),pads:typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()):[],focused:document.hasFocus()&&!document.hidden};
const session=sim?new DrivingSession(sim,readDevices):undefined;
let inputState:ReturnType<DrivingSession['frame']>|undefined;
const chase=new DrivingCamera(camera);
let driver:DriverPresenter|undefined,driverStatistics:ReturnType<typeof assetStatistics>|undefined;if(driving&&steeringControl){const configuration:DriverAttachment=await(await fetch('/assets/drivers/test-driver-attachment.json')).json();const driverAsset=await loader.loadAsync('/assets/drivers/test-driver.glb');vehicle.add(driverAsset.scene);driver=new DriverPresenter(driverAsset.scene,vehicle,steeringControl,configuration);driverStatistics=assetStatistics(driverAsset.scene);chase.eye.fromArray(configuration.eye)}
const gameAudio=driving?new GameAudio(document.querySelector('#app')!):undefined;let audioFrame:ReturnType<GameAudio['update']>|undefined;
addEventListener('pagehide',()=>gameAudio?.dispose());
if(driving){const route=await loader.loadAsync('/assets/practice-p03b1.glb');route.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=true}});scene.add(route.scene)}
const hud=document.createElement('aside');hud.id='telemetry';document.querySelector('#app')!.append(hud);
const fidelity=vehicleFile==='slingshot-p03a1.glb'||vehicleFile==='slingshot-p03a2.glb'||vehicleFile===CURRENT_VEHICLE,proof=!!proofAsset,candidate=fidelity||proof||vehicleFile==='slingshot-p03a.glb';
document.querySelector('#stage')!.textContent=(proof?'P03A2 / LOCAL PROOF':bay?(fidelity?(vehicleFile===CURRENT_VEHICLE?'P04B1 / MAKE IT YOURS':'P03A1 / INSPECTION'):'P03A / INSPECTION'):driving?'P03B2 / FIRST DRIVE':'NEUTRAL / INSPECTION')+' · '+__BUILD_REF__;
document.querySelector('#title')!.textContent=vehicleFile==='scale-blockouts.glb'?'Three distinct proportions':'2024 Slingshot R';
document.querySelector('#subtitle')!.textContent=driving?'AutoDrive · Handling practice':candidate?'Radar Blue Fade · AutoDrive':'P01 clay baseline';
document.querySelector('#hint')!.textContent=driving?'W/S drive & brake · A/D steer · C camera · B look back · R hold reset · Esc pause':'Drag to orbit · Scroll to inspect';
const assetQuery=vehicleFile===CURRENT_VEHICLE?'&asset=p04a1':(fidelity||proof)?'&asset=p03a1':candidate?'&asset=p03a':vehicleFile==='scale-blockouts.glb'?'&asset=fleet':'&asset=p01';
const nav=document.createElement('nav');nav.innerHTML=`<button id="inspect-action" type="button">Inspect</button><a class="drive-action" href="?scene=pad${assetQuery}">Drive</a><a href="?scene=bay${assetQuery}">Bay</a>`;document.querySelector('#app')!.append(nav);
const viewsBar=document.createElement('div');viewsBar.className='view-tools';viewsBar.hidden=true;viewsBar.innerHTML='<button data-view="front">Front</button><button data-view="side">Side</button><button data-view="rearquarter">Rear</button><button data-view="cockpit">Cockpit</button><button data-view="material">Material</button><button id="sweep-action">Light sweep</button>';document.querySelector('#app')!.append(viewsBar);
nav.querySelector('#inspect-action')!.addEventListener('click',()=>{if(driving){location.href='?scene=bay'+assetQuery;return}viewsBar.hidden=!viewsBar.hidden;view('threequarter')});
viewsBar.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>{sweeping=false;view(b.dataset.view!)}));viewsBar.querySelector('#sweep-action')!.addEventListener('click',()=>{sweeping=!sweeping});
if(driving){const help=document.createElement('details');help.id='driving-controls';help.innerHTML='<summary>Controls & practice route</summary><p>Launch straight → gentle slalom → broad sweeper → stop box.<br>Cones are visual guides.</p><p>Keyboard: W/S throttle/brake · A/D steer · C near/far/cockpit · hold B quick glance · X direction · hold R one second to reset · Esc pause.</p><p>Controller: RT/LT throttle/brake · left stick steer · top face camera · LB look back · right face direction · hold bottom face reset · Menu pause.</p>';document.querySelector('#app')!.append(help);
const reset=document.createElement('button');reset.id='practice-reset';reset.textContent='Reset to practice start';reset.addEventListener('click',()=>{session!.reset();current=session!.current;previous=current;accumulator=0;draw(0,true)});help.append(reset);
const status=document.createElement('div');status.id='controller-status';document.querySelector('#app')!.append(status);
const resume=document.createElement('button');resume.id='resume-driving';resume.textContent='Resume · release driving controls';resume.hidden=true;resume.addEventListener('click',()=>{session!.input.paused=false;session!.input.armed=false});document.querySelector('#app')!.append(resume)}
const diagnostics=document.createElement('button');diagnostics.className='diagnostics-toggle';diagnostics.textContent='Diagnostics';diagnostics.addEventListener('click',()=>document.body.classList.toggle('debug-overlay'));document.querySelector('#app')!.append(diagnostics);
const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),cameraRay=new THREE.Raycaster();
function pose(t:any){
 if(!t)return;vehicle.position.set(t.position.x,t.position.y,t.position.z);vehicle.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
 t.wheels.forEach((w:any,i:number)=>{const b=bindings[i];if(!b)return;if(b.positionNode&&b.basePos){b.positionNode.position.copy(b.basePos);b.positionNode.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
 // The caliper follows rear suspension travel without inheriting wheel spin. P01 has no such island.
 if(rearPresenter)rearPresenter.update(t.wheels[2]);
 else if(rearCaliper&&rearCaliperBase&&bindings[2].basePos){rearCaliper.position.copy(rearCaliperBase);rearCaliper.position.y+=t.wheels[2].localCenter.y-bindings[2].basePos.y}
 if(steeringControl&&steeringBase)steeringControl.quaternion.copy(steeringBase).multiply(q.setFromAxisAngle(steeringAxis,t.steer*10));const root=vehicle.position;sun.position.set(root.x+8,root.y+14,root.z+5);sun.target.position.copy(root);
}
function cameraChase(dt:number,snap=false){
 chase.update(vehicle.position,vehicle.quaternion,current?.speed??0,dt,cameraMode,lookBack,snap,(target,desired)=>{const ray=desired.clone().sub(target);cameraRay.set(target,ray.clone().normalize());cameraRay.far=ray.length();return cameraRay.intersectObject(pad.scene,true)[0]?.distance});
}
function reviewOrbit(angle:number){
 const bounds=new THREE.Box3().setFromObject(vehicle,true);controls.target.copy(fitInspectionCamera(camera,bounds,new THREE.Vector3(Math.sin(angle),.32,-Math.cos(angle)),.78));controls.update();render();return projectedBounds(camera,bounds);
}
function view(name:string){
 if(name==='bay'){controls.target.copy(fitInspectionCamera(camera,new THREE.Box3().setFromObject(vehicle,true),new THREE.Vector3(.7,.37,-1),.78));controls.update();render();return}
 const presets:Record<string,[number,number,number]>={front:[0,.9,-7.6],rear:[0,1,7.6],side:[7.5,.9,0],threequarter:[5,3.3,-6],rearquarter:[4.6,2.8,6],cockpit:[-.55,2.2,1.2],material:[2.3,1.15,-2.2],bay:[4.2,2.4,-6.3],fleet:[8,5,-11]};const p=presets[name]??presets.threequarter;if(!driving&&['front','rear','side','threequarter','rearquarter'].includes(name)){controls.target.copy(fitInspectionCamera(camera,new THREE.Box3().setFromObject(vehicle,true),new THREE.Vector3(p[0],p[1]-.6,p[2]),.76));controls.update();render();return}camera.position.set(...p);controls.target.set(name==='material'?.55:0,name==='material'?.52:.6,name==='material'?-1.25:0);camera.lookAt(controls.target);controls.update();render();
}
function updateHUD(){
 if(!current){document.querySelector('#status')!.textContent=candidate?(proof?'P03A2 diagnostic, one brow · ':fidelity?(vehicleFile===CURRENT_VEHICLE?'P04B1 candidate · ':'P03A1 candidate · '):'P03A candidate · ')+(bay?'Inspection bay':'Neutral inspection')+' · G3 pending':'P01 clay baseline · Neutral runtime inspection';hud.innerHTML='<span class="metric">'+(candidate?(proof?'P03A2 / LOCAL PROOF':fidelity?(vehicleFile===CURRENT_VEHICLE?'P04B1 / CANDIDATE':'P03A1 / CANDIDATE'):'P03A / CANDIDATE'):'P01 / CLAY')+'</span><p>'+renderer.info.render.calls+' renderer calls · '+renderer.info.render.triangles.toLocaleString()+' submitted triangles</p>';return}
 const t=current;hud.innerHTML=`<div class="speed">${Math.round(Math.abs(t.speed)*2.23694)}<small>MPH</small></div><div class="drive-info">${t.gear<0?'R':t.gear} <span>GEAR</span> <em class=engine-meta>${Math.round(t.rpm)} <span>RPM</span></em></div><div class="contacts">${t.wheels.map((w:any)=>`<div><b>${w.id.replace('front_','F·').replace('rear','R')}</b><span>${w.contact?'●':'○'} ${Math.round(w.load)} N</span><i style="width:${Math.min(100,w.load/60)}%"></i></div>`).join('')}</div><p>${paused?'PAUSED':!session?.input.armed?'RELEASE CONTROLS':t.reversePending?'BRAKING FOR DIRECTION':t.shifting?'SHIFTING':reverse?'REVERSE SELECTED':'AUTODRIVE'} · ${lookBack?'REARWARD':cameraMode.toUpperCase()}</p>`;
 document.querySelector('#status')!.textContent=document.body.classList.contains('debug-overlay')?`P03B1 prototype · 60 Hz physics · ${t.wheels.filter((w:any)=>w.contact).length}/3 contacts · ${t.wheels.map((w:any)=>w.surface).filter((x:any,i:number,a:any[])=>a.indexOf(x)===i).join('/')} · sim ${t.time.toFixed(1)} s`:'Handling practice · launch → slalom → sweeper → stop';
 const status=document.querySelector('#controller-status');if(status)status.textContent=(inputState?.status??'Press a controller button to connect')+' · '+(inputState?.activeDevice.startsWith('pad:')?'Controller':'Keyboard')+(session?.input.paused?' · Paused':!session?.input.armed?' · Release controls to arm':'');const resume=document.querySelector<HTMLButtonElement>('#resume-driving');if(resume)resume.hidden=!paused;
}
addEventListener('keydown',e=>{const editing=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement;if(editing)return;if(driving&&['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(driving)keyboard.down(e.code,performance.now(),e.repeat);if(e.repeat)return;if(e.code==='KeyI')document.body.classList.toggle('debug-overlay');const views=['front','side','rear','threequarter','rearquarter'];if(!driving&&e.code.startsWith('Digit'))view(views[Number(e.code.slice(-1))-1]??'threequarter')});
addEventListener('keyup',e=>keyboard.up(e.code));
function suspendDriving(){gameAudio?.lifecycle(true);keyboard.clear();session?.input.suspend();paused=!!session;accumulator=0;updateHUD()}
addEventListener('blur',suspendDriving);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendDriving();last=performance.now()});
addEventListener('gamepaddisconnected',()=>{if(driving){session?.input.disconnect();suspendDriving()}});
function step(control:typeof input,dt=1/60){if(!sim)return;previous=current;sim.step(activeScenario?activeScenario.control(current?.time??0,current!):control,dt);current=sim.telemetry();if(activeScenario&&current.time>=activeScenario.seconds){paused=true}}
function draw(dt:number,snap=false,present=true){
 if(current){const t=structuredClone(current);if(previous&&(!manual||normalPresenting)){const a=Math.min(1,accumulator*60);for(const c of ['x','y','z'] as const)t.position[c]=THREE.MathUtils.lerp(previous.position[c],current.position[c],a);const qa=new THREE.Quaternion(previous.quaternion.x,previous.quaternion.y,previous.quaternion.z,previous.quaternion.w).slerp(new THREE.Quaternion(current.quaternion.x,current.quaternion.y,current.quaternion.z,current.quaternion.w),a);Object.assign(t.quaternion,{x:qa.x,y:qa.y,z:qa.z,w:qa.w})}pose(t);driver?.update(t,dt,cameraMode==='cockpit'&&!lookBack,snap);cameraChase(dt,snap);audioFrame=gameAudio?.update(current,paused,cameraMode==='cockpit'&&!lookBack,snap)}else controls.update();if(present){render();updateHUD()}
}
if(driving){sim!.reset(PRACTICE_START);for(let i=0;i<120;i++)step(input);session!.sync();draw(1/60,true)}else{view(query.get('view')??(vehicleFile==='scale-blockouts.glb'?'fleet':bay?'bay':'threequarter'));updateHUD()}
function normalFrame(now:number,present=true){
 buildUI?.frame(readDevices());if(!session)return;const result=session.frame(now);inputState=result;current=result.current;previous=result.previous;accumulator=result.alpha/60;paused=result.paused;reverse=result.control.reverse;lookBack=result.lookBack;
 if(result.camera){cameraMode=nextDrivingView(cameraMode);const saved=loadSave(browserStorage());saved.settings.camera=cameraMode;writeSave(browserStorage(),saved)}
 normalPresenting=true;draw(result.dt,result.reset,present);normalPresenting=false;
}
const preparation=product?await product.prepare(()=>prepareRenderer(renderer,scene,camera)):await prepareRenderer(renderer,scene,camera);prepVeil.remove();const workbenchLoadMs=performance.now()-workbenchStarted;
const debug={ready:true,rearDiagnosticPose:(y:number,spin=0,overlay=false)=>{if(!query.has('test')||!rearPresenter)throw Error('Current rear rig in isolated test context required');manual=true;const w=bindings[2];w.positionNode!.position.set(0,y,rearPresenter.rig.wheelCenter[2]);w.spin!.quaternion.copy(w.baseSpin!).multiply(q.setFromAxisAngle(axisX,-spin));rearPresenter.update({localCenter:{x:0,y,z:rearPresenter.rig.wheelCenter[2]},spin});rearDiagnostic?.set(overlay);render();return debug.inspect()},rearOverlay:(enabled:boolean)=>{if(!query.has('test'))throw Error('Test context required');rearDiagnostic?.set(enabled);render();return rearPresenter?.inspect()},suspendAudio:async()=>{if(!query.has('test'))throw new Error('Test context required');await gameAudio?.suspendContext()},renderOfflineAudio:async(timeline:Parameters<typeof renderOfflineGameAudio>[0],duration:number)=>{if(!query.has('test'))throw new Error('Test context required');return renderOfflineGameAudio(timeline,duration)},normalFrame:(now:number,present=true)=>{if(!controlledClock)throw new Error('Controlled clock requires an isolated test context');normalFrame(now,present);return debug.inspect()},setDeviceSample:(sample:{keys:string[];pads:DeviceSample['pads'];focused?:boolean}|null)=>{if(!query.has('test'))throw new Error('Device injection is test-only');virtualSample=sample?{keys:new Set(sample.keys),pads:sample.pads,focused:sample.focused!==false}:undefined},reviewOrbit,referenceCamera:(position:number[],target:number[],fov=38)=>{if(!query.has('test'))throw new Error('Test context required');camera.fov=fov;camera.updateProjectionMatrix();camera.position.fromArray(position);controls.target.fromArray(target);camera.lookAt(controls.target);controls.update();render();return projectedBounds(camera,new THREE.Box3().setFromObject(vehicle,true))},diagnosticFrame:(t:any,cameraPosition?:number[])=>{if(!query.has('test'))throw new Error('Diagnostic frame requires test context');manual=true;current=t;previous=t;draw(1/60,true);if(cameraPosition){camera.position.fromArray(cameraPosition);render()}},playScenario:(name:string)=>{const selected=scenarios.find(s=>s.name===name);if(!selected||!sim)throw new Error('Unknown driving scenario');activeScenario=selected;sim.reset(selected.pose);current=sim.telemetry();previous=current;manual=false;paused=false;accumulator=0;draw(1/60,true);return selected.seconds},mode:driving?'pad':bay?'bay':'vehicle',asset:vehicleFile,view,orbitView:(angle:number,radius=7.2,height=2.3)=>{if(driving)return;camera.position.set(Math.sin(angle)*radius,height,-Math.cos(angle)*radius);controls.target.set(0,.6,0);camera.lookAt(controls.target);controls.update();render()},lightSweep:(angle:number)=>{scene.environmentRotation.y=angle;sun.position.set(vehicle.position.x+8*Math.cos(angle),vehicle.position.y+14,vehicle.position.z+8*Math.sin(angle));render()},setShadows:(mode:ShadowMode)=>{shadowMode=mode;shadowCensus=configureShadows(vehicle,pad.scene,mode,bay);renderer.shadowMap.needsUpdate=true;draw(1/60,true);return shadowCensus},measurePasses:()=>measurePasses(renderer,scene,camera,pad.scene),inspect:()=>({workbenchLoadMs,preparation,programs:renderer.info.programs?.length??0,commit:__BUILD_REF__,product:product?.inspect(),career:career.state,build:buildUI?.inspect(),memory:{...renderer.info.memory},rear:rearPresenter?.inspect(),assetStatistics:assetStatistics(asset.scene),shadowMode,shadowCensus,bounds:new THREE.Box3().setFromObject(asset.scene,true).getSize(new THREE.Vector3()).toArray(),nodes:bindings.map(b=>({id:b.id,steer:!!b.steer,spin:!!b.spin,position:b.basePos?.toArray(),presentedPosition:b.positionNode?.position.toArray(),spinQuaternion:b.spin?.quaternion.toArray(),steerQuaternion:b.steer?.quaternion.toArray()})),telemetry:current??null,rearCaliper:rearCaliper?{base:rearCaliperBase?.toArray(),position:rearCaliper.position.toArray(),quaternion:rearCaliper.quaternion.toArray()}:null,steeringControlQuaternion:steeringControl?.quaternion.toArray(),driverStatistics,driver:driver?.inspect(),driverProjection:driver?Object.fromEntries(Object.entries(driver.inspect().arms??{}).map(([side,a])=>[side,new THREE.Vector3().fromArray((a as any).contact).project(camera).toArray()])):null,cameraMode,activeView:chase.activeView,audio:gameAudio?.inspect(),audioFrame,inputState:inputState?{...inputState,current:undefined,previous:undefined}:null,cameraTarget:chase.target.toArray(),cameraPosition:camera.position.toArray(),cameraFov:camera.fov,projectedBounds:projectedBounds(camera,new THREE.Box3().setFromObject(vehicle,true)),renderInfo:renderer.info.render,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)}),telemetry:()=>current,reset:(p?:any)=>{activeScenario=undefined;sim?.reset(p);current=sim?.telemetry();previous=current;accumulator=0;session?.sync();draw(1/60,true)},advance:(control:typeof input,seconds:number)=>{manual=true;for(let i=0;i<Math.round(seconds*60);i++)step(control);draw(seconds,true);return current},renderFrame:(control:typeof input,delta:number,present=true)=>{manual=true;accumulator+=delta;while(accumulator+1e-10>=1/60){step(control);accumulator-=1/60}if(present)draw(delta);return current},captureView:view,setCamera:(name:DrivingView)=>{cameraMode=name;draw(1/60,true)}};(window as any).__TWT=debug;
function frame(now:number){const elapsed=Math.min((now-last)/1000,.1);last=now;
 if(!driving&&!controlledClock)buildUI?.frame(readDevices());
 if(driving&&!manual&&!controlledClock){if(activeScenario&&!paused){accumulator+=elapsed;while(accumulator>=1/60){step(input);accumulator-=1/60}draw(elapsed)}else normalFrame(now)}else if(!driving&&!manual)draw(elapsed);
 if(sweeping&&!driving){sweepAngle+=elapsed*.35;scene.environmentRotation.y=sweepAngle;sun.position.set(8*Math.cos(sweepAngle),14,8*Math.sin(sweepAngle));render()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(buildUI?.inspect().open)fitBuild();draw(1/60)});addEventListener('pagehide',()=>{buildUI?.dispose();unsubCareer();career.close();product?.dispose();sim?.dispose();renderer.dispose();controls.dispose()});







let normalCamera: {position:THREE.Vector3;target:THREE.Vector3;fov:number}|undefined;
const normalLights=new Map<THREE.Light,number>();scene.traverse(o=>{if(o instanceof THREE.Light&&o.name!=='SM133_reserved_emitter')normalLights.set(o,o.intensity)});const normalEnvironment=scene.environmentIntensity;
function fitBuild(){
 camera.clearViewOffset();camera.aspect=Math.max(300,innerWidth-370)/innerHeight;camera.fov=38;
 const target=fitInspectionCamera(camera,new THREE.Box3().setFromObject(asset.scene,true),new THREE.Vector3(4,2.3,-5),.79);controls.target.copy(target);
 const free=Math.max(300,innerWidth-370);camera.aspect=innerWidth/innerHeight;camera.setViewOffset(free,innerHeight,-370,0,innerWidth,innerHeight);camera.updateProjectionMatrix();controls.update();render();
}
if(bay){
 mountHarborEntry();const button=document.createElement('button');button.id='open-build';button.textContent='Build · Make it yours';document.querySelector('#app')!.append(button);
 buildUI=new BuildUI(career,{open:opened=>{controls.enabled=!opened;if(opened){normalCamera={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};fitBuild()}else if(normalCamera){camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.fov=normalCamera.fov;camera.position.copy(normalCamera.position);controls.target.copy(normalCamera.target);camera.lookAt(controls.target);camera.updateProjectionMatrix();render()}},previewNight:enabled=>{normalLights.forEach((power,light)=>light.intensity=power*(enabled?.24:1));scene.environmentIntensity=enabled?.24:normalEnvironment;render()},appearance:(equipped,appearance)=>{product?.set(equipped,appearance);render()}});button.onclick=()=>buildUI?.open();
 if(query.get('view')==='build')buildUI.open();
}else if(!career.durable){const note=document.createElement('small');note.className='career-session';note.textContent='Session only — progress cannot be saved';document.querySelector('#app')!.append(note)}

