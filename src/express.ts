import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EXPRESS_ROUTE,EXPRESS_DESIGN,loadExpressPresentation} from './express/index';
import {createCourseEnvironment,type CourseRoute} from './course/environment';
import {CrewRace,createCrewGrid,RivalController} from './competition';
import {RaceWorld,FIXED_DT,type VehicleControl,type VehicleTelemetry} from './simulation';
import {DrivingSession} from './driving/session';
import {KeyboardBuffer,type DeviceSample} from './driving/input';
import {DrivingCamera,nextDrivingView,type DrivingView} from './presentation/driving-camera';
import {loadDrivingHero} from './presentation/hero';
import {SignatureFinishPresenter,SignatureProducts} from './presentation/signature-art';
import {ProductPresenter} from './presentation/product';
import {SuspensionPresenter} from './presentation/suspension';
import {createHarborRenderer} from './presentation/harbor-renderer';
import {loadOutdoorEnvironment} from './presentation/outdoor-environment';
import {loadShowcaseHarbor} from './presentation/showcase';
import {harborLighting} from './presentation/harbor-lighting';
import {prepareRenderer,preparationVeil} from './presentation/prepare';
import {RuntimeProfile} from './presentation/runtime-profile';
import {GameAudio} from './audio/game-audio';
import {CrewUI} from './crew-ui';
import {buildRepository,fragmentRecipe,recipeFragment,previewSnapshot} from './signature/config';
import {loadSave,browserStorage} from './save';
import {pageActive} from './demo/recovery';
import {evidenceEnabled} from './demo/profile';
import './style.css';import './harbor.css';import './crew.css';

const params=new URLSearchParams(location.search),test=params.has('test'),controlled=test&&params.get('clock')==='controlled',started=performance.now(),handlingProfile='slingmods-sport-v1' as const;
const storage=buildRepository(),snapshot=fragmentRecipe(location.hash)?previewSnapshot(fragmentRecipe(location.hash)!,params.get('route')==='harbor'?'harbor':'express',params.get('mode')==='race'?'race':'test'):storage.store.drive(),recipe=snapshot.recipe,free=snapshot.mode==='test',express=snapshot.route==='express',preset='day' as const,quality=params.get('quality')==='low'?'low':'standard';
document.body.className='harbor-race signature-race';const app=document.querySelector('#app')!;app.innerHTML='<div id="viewport"></div>';const veil=preparationVeil(app),profile=new RuntimeProfile(params.has('profile'));
const renderer=createHarborRenderer(params.has('captureBuffer'));renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;app.querySelector('#viewport')!.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.06,2200),loader=new GLTFLoader(),outdoor=await loadOutdoorEnvironment(scene,renderer,preset);
const route:CourseRoute=express?EXPRESS_ROUTE:await(await fetch('/assets/harbor/route.json')).json(),hero=await loadDrivingHero(loader);scene.add(hero.root);
let updateWorld:(camera:THREE.Vector3,time:number)=>void=()=>{};
if(express){const presentation=await loadExpressPresentation(scene,preset);updateWorld=(p,t)=>presentation.update?.(p,t)}else{const original=await loader.loadAsync('/assets/harbor/harbor.glb');scene.add(original.scene);const presentation=await loadShowcaseHarbor(scene,original.scene,preset,'full');updateWorld=(p,t)=>presentation.update(p,t)}
const colors:Record<string,[string,string]>={maya:['#d7dddd','#57bab7'],jett:['#6d161e','#aa3838'],nico:['#3c444c','#e9b454']};const peers=Object.fromEntries((free?[]:['maya','jett','nico']).map(id=>[id,hero.cloneRival(...colors[id])]));for(const p of Object.values(peers))scene.add(p.root);
const finishes=new SignatureFinishPresenter(hero.asset);await finishes.set(recipe.finish);
const [under,shocks,accessories]=await Promise.all([ProductPresenter.load(loader,hero.root,scene),SuspensionPresenter.load(loader,hero.asset),SignatureProducts.load(loader,hero.asset)]);under.set(!!recipe.products['SM-133'],recipe.lights);shocks.set(!!recipe.products['SM-3223']);accessories.set(Object.keys(recipe.products));
const ids=free?['player']:['maya','jett','nico','player'],rivalIds=ids.filter(id=>id!=='player'),grid=createCrewGrid(route,ids),world=await RaceWorld.create(createCourseEnvironment(route),handlingProfile);
for(const id of ids)world.addVehicle(id,grid[id]);world.get('player').configureSuspension(recipe.products['SM-3223']?recipe.suspension:null);
const eventId=(express?'harbor-express':'harbor-preview')+(free?'-test-v1':'-quick-race-v1'),race=new CrewRace(route,ids,'player',false,{eventId,laps:1,handlingProfileId:handlingProfile,freeDrive:free});

let rivals=Object.fromEntries(rivalIds.map(id=>[id,new RivalController(route,id,11,handlingProfile)]));world.initialize();let currentField=world.telemetry(),previousField=currentField,attemptId:string|null=null,attempt=0,prepared=false,confirmBlocked=false;
const keyboard=new KeyboardBuffer(),releaseKeys=new Set<string>();let virtual:DeviceSample|undefined,sampled:DeviceSample={keys:new Set(),pads:[],focused:true},cameraMode:DrivingView=loadSave(browserStorage()).settings.camera,lookBack=false,resetPresentation=true;
const audio=new GameAudio(app),chase=new DrivingCamera(camera,handlingProfile);audio.setExhaustTreatment(!!recipe.products['SM-7720']);chase.eye.fromArray(hero.attachment.eye);
const lights=harborLighting(scene,hero.asset,route,preset,quality);
const sim={telemetry:()=>world.get('player').telemetry(),reset:()=>{for(const[id,pose]of Object.entries(grid))world.get(id).reset(pose);rivals=Object.fromEntries(rivalIds.map(id=>[id,new RivalController(route,id,11,handlingProfile)]));previousField=currentField=world.telemetry()},step:(control:VehicleControl,dt=FIXED_DT)=>{previousField=currentField;const controls:Record<string,VehicleControl>={player:race.control('player',control)};for(const[id,rival]of Object.entries(rivals)){controls[id]=race.control(id,rival.control(currentField[id],currentField,dt));if(rival.inspect().retiredReason)race.retire(id,rival.inspect().retiredReason!)}world.step(controls,dt);currentField=world.telemetry();race.tick(previousField,currentField,dt)}};
const ui=new CrewUI(app,menuAction,false,{title:express?'Harbor Express':'Original Harbor',subtitle:free?'Unscored build test · daylight':'Quick race · daylight · 1 lap',preview:true,freeDrive:free,route});
const session=new DrivingSession(sim,()=>sampled,{profileId:handlingProfile,onReset:()=>{attemptId=crypto.randomUUID();attempt++;race.restart(attemptId);for(const k of keyboard.held)releaseKeys.add(k);keyboard.clear();resetPresentation=true},onPause:p=>race.setPaused(p)});session.sync();
function menuAction(action:string){if(!prepared)return;profile.mark(action,{ticks:session.ticks});if(action==='bay'||action==='events'){location.assign(action==='events'?'?scene=signature&screen=events'+recipeFragment(recipe):snapshot.returnTo+recipeFragment(recipe));return}if(action==='resume'){session.input.paused=!session.input.paused;session.input.armed=false;race.setPaused(session.input.paused);audio.lifecycle(session.input.paused);confirmBlocked=true;return}session.input.paused=false;session.reset();confirmBlocked=true}
function source():DeviceSample{if(virtual)return virtual;const state=keyboard.read();return {...state,keys:new Set([...state.keys,...releaseKeys]),pads:Array.from(navigator.getGamepads?.()??[]),focused:document.hasFocus()&&!document.hidden}}
let lastInput:ReturnType<DrivingSession['frame']>|undefined,lastWall:number|undefined;
function present(dt:number,alpha:number,reset:boolean,raster:boolean){
 const t=structuredClone(session.current),p=session.previous;for(const k of ['x','y','z']as const)t.position[k]=THREE.MathUtils.lerp(p.position[k],t.position[k],alpha);const q=new THREE.Quaternion(p.quaternion.x,p.quaternion.y,p.quaternion.z,p.quaternion.w).slerp(new THREE.Quaternion(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w),alpha);Object.assign(t.quaternion,{x:q.x,y:q.y,z:q.z,w:q.w});hero.pose(t,dt,cameraMode==='cockpit'&&!lookBack,reset);chase.update(hero.root.position,hero.root.quaternion,t.speed,dt,cameraMode,lookBack,reset);
 for(const[id,peer]of Object.entries(peers))peer.pose(currentField[id],dt,false,reset);lights.update(hero.root.position,t.brake);shocks.update();under.update();audio.update(session.current,session.input.paused||race.snapshot().phase==='ready',cameraMode==='cockpit'&&!lookBack,reset);audio.updateOpponents(session.current,Object.fromEntries(Object.entries(currentField).filter(([id])=>id!=='player')));updateWorld(camera.position,session.current.time);
 if(raster){const begin=performance.now();renderer.render(scene,camera);profile.renderMs=performance.now()-begin;ui.update(race.snapshot(),session.current,session.input.armed,chase.activeView,null,'Preview drive · no career credits','',false);const events=app.querySelector<HTMLAnchorElement>('a.shop-build-route');if(events)events.href='?scene=signature&screen=events'+recipeFragment(recipe)}
}
function normalFrame(now:number,raster=true){sampled=source();ui.menuInput(sampled,race.snapshot());if(confirmBlocked){const held=sampled.pads.some(p=>p&&(p.buttons[0]?.value??0)>.5);if(!held)confirmBlocked=false;else sampled={...sampled,pads:sampled.pads.map(p=>p?{...p,buttons:p.buttons.map((b,i)=>i===0?{value:0,pressed:false}:b)}:p)}}
 if(race.snapshot().phase==='ready'){present(1/60,1,resetPresentation,raster);resetPresentation=false;return}
 lastInput=session.frame(now);if(lastInput.camera)cameraMode=nextDrivingView(cameraMode);lookBack=lastInput.lookBack;present(lastInput.dt,lastInput.alpha,resetPresentation||lastInput.reset,raster);resetPresentation=false;
}
function suspend(){keyboard.clear();releaseKeys.clear();ui.suspendInput();session.input.suspend();race.setPaused(true);audio.lifecycle(true)}
addEventListener('keydown',e=>{if((e.target as HTMLElement)?.matches('input,textarea,select'))return;keyboard.down(e.code,performance.now(),e.repeat);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});addEventListener('keyup',e=>{keyboard.up(e.code);releaseKeys.delete(e.code)});addEventListener('blur',suspend);addEventListener('visibilitychange',()=>{if(document.hidden)suspend()});
addEventListener('gamepaddisconnected',()=>{session.input.disconnect();suspend()});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
present(0,1,true,true);const preparation=await prepareRenderer(renderer,scene,camera);veil.remove();prepared=true;const loadMs=performance.now()-started;
function frame(now:number){if(pageActive()&&!controlled){const begin=performance.now();normalFrame(now);profile.frame(now,lastWall===undefined?0:now-lastWall,performance.now()-begin,session.ticks,{...race.snapshot(),attempt},cameraMode,renderer,scene);lastWall=now}requestAnimationFrame(frame)}requestAnimationFrame(frame);
function inspect(){const gl=renderer.getContext();return {build:__BUILD_REF__,handlingProfile,eventId,preview:true,free,recipe:structuredClone(recipe),race:race.snapshot(),telemetry:session.current,field:currentField,ticks:session.ticks,attemptId,rewardPending:false,careerTouched:false,route:{id:route.id,version:route.version,length:route.length},design:express?EXPRESS_DESIGN:null,suspension:shocks.inspect(),simulationSuspension:world.get('player').suspensionConfig(),products:accessories.inspect?.(),input:lastInput,audio:audio.inspect(),memory:{...renderer.info.memory},renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL??gl.RENDERER),size:renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),dpr:renderer.getPixelRatio(),loadMs,preparation}}
if(evidenceEnabled())(window as any).__EXPRESS={ready:true,inspect,route,lightweight:()=>({telemetry:session.current,race:race.snapshot(),field:currentField,ticks:session.ticks,attemptId}),profile:()=>({...profile.export(),loadMs,preparation,handlingProfile,route:route.id}),normalFrame:(now:number,raster=true)=>{if(!controlled)throw Error('Controlled test context required');normalFrame(now,raster);return inspect()},setDeviceSample:(v:any)=>{if(!test)throw Error('Isolated test required');virtual=v?{...v,keys:new Set(v.keys)}:undefined},startAudioCapture:()=>audio.startEvidenceCapture(),audioSync:(id:string)=>audio.evidenceMarker(id),stopAudioCapture:()=>audio.stopEvidenceCapture()};
addEventListener('pagehide',()=>{suspend();audio.dispose();world.dispose();under.dispose();shocks.dispose();accessories.dispose();finishes.dispose();renderer.dispose()});
