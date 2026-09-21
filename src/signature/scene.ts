import {VehicleMirrors} from '../presentation/vehicle-mirrors';
import {VehicleOptics} from '../presentation/vehicle-materials';
import {CURRENT_VEHICLE_CONTEXT} from '../presentation/vehicle-asset';
import {STUDIO_LOOKS,createStudioReflectionEnvironment,createStudioContactOcclusion,loadTourWall} from './studio-look';
import {fitSafeCamera,visibleBounds} from '../presentation/safe-camera';
import {vehicleContact} from '../presentation/vehicle-contact';
import {PoweredDisplay} from '../presentation/powered-display';
import {buildCue} from '../audio/actions';
import {prepareDrive,type DrivePreparationReport} from './drive-preparation';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadDrivingHero} from '../presentation/hero';
import {SignatureFinishPresenter,SignatureProducts,loadSignatureShowroom} from '../presentation/signature-art';
import {ProductPresenter} from '../presentation/product';
import {SuspensionPresenter} from '../presentation/suspension';
import {projectedBounds} from '../presentation/inspection';
import {prepareRenderer,preparationVeil} from '../presentation/prepare';
import {Simulation} from '../simulation';
import {GameAudio} from '../audio/game-audio';
import {KeyboardBuffer,type DeviceSample} from '../driving/input';
import {buildRepository,fragmentRecipe,recipeFragment,validateRecipe,freshRecipe,stockRecipe,PRESETS,buildSummary,type BuildRecipe,type DestinationLighting} from './config';
import {PRODUCTS,productById} from './catalog';
import {loadRouteGraphics} from './route-data';
import {SignatureUI,type SignatureState} from './ui';
import {evidenceEnabled} from '../demo/profile';
import {pageActive} from '../demo/recovery';
import {ShowroomDeparture} from './departure';

const params=new URLSearchParams(location.search),started=performance.now(),app=document.querySelector('#app')!;
document.body.className='signature-showroom';app.innerHTML='<div id="viewport"></div>';
const veil=preparationVeil(app,{showroom:true}),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:params.has('captureBuffer')});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
app.querySelector('#viewport')!.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#777d80');
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.06,80),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.35;
const env=createStudioReflectionEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromScene(env,.04);scene.environment=probe.texture;scene.environmentIntensity=.88;pmrem.dispose();env.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
const hemi=new THREE.HemisphereLight(0xf3f4f5,0x6f6a66,1.1),key=new THREE.DirectionalLight(0xfffbf3,2.1),fill=new THREE.DirectionalLight(0xe5edf7,.8),rim=new THREE.DirectionalLight(0xffffff,.95);key.position.set(-3,6,-4);fill.position.set(5,3,-2);rim.position.set(1,4,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});key.shadow.normalBias=.012;scene.add(hemi,key,fill,rim,key.target);
const loader=new GLTFLoader();const [hero,room,wall,routeGraphics]=await Promise.all([loadDrivingHero(loader),loadSignatureShowroom(loader),loadTourWall(loader),loadRouteGraphics()]);scene.add(hero.root,room);const contact=vehicleContact();hero.root.add(contact.mesh);scene.add(wall.group,createStudioContactOcclusion());
const [under,shocks,accessories]=await Promise.all([ProductPresenter.load(loader,hero.root,scene),SuspensionPresenter.load(loader,hero.asset),SignatureProducts.load(loader,hero.asset)]),finishes=new SignatureFinishPresenter(hero.asset,{studio:true}),audio=new GameAudio(app);
let reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;try{reducedMotion=localStorage.getItem('slingmods-signature-motion')==='reduced'||reducedMotion}catch{}controls.enableDamping=!reducedMotion;
const storage=buildRepository();let recipe:BuildRecipe=freshRecipe(),original=freshRecipe(),history:BuildRecipe[]=[],compare=false,lighting:'studio'|'lights'='studio',driverVisible=false,pending=false,status=storage.temporary?'Temporary build session; browser storage is unavailable.':'',screen:SignatureState['screen']=params.get('screen')==='build'?'build':params.get('screen')==='events'?'events':'entry';
try{recipe=fragmentRecipe(location.hash)??storage.store.draft();original=structuredClone(recipe)}catch(e){status=(e as Error).message}
let saved:ReturnType<typeof storage.store.recipes>=[];try{saved=storage.store.recipes()}catch(e){status=(e as Error).message}
let simulation=await Simulation.create(undefined,recipe.handlingProfile),simulationProfile=recipe.handlingProfile;
simulation.reset({x:0,z:0,y:0,yaw:0});for(let i=0;i<120;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});
let neutral=simulation.telemetry();const display=new PoweredDisplay(hero.asset),optics=new VehicleOptics(hero.asset,true);let ignition=true;hero.pose(neutral,0,false,true);hero.driver.root.visible=false;
const mirrors=new VehicleMirrors(hero.root,hero.asset);
const thumbs=Object.fromEntries(PRODUCTS.map(p=>[p.id,`/assets/p08b/thumbnails/${p.id}.png`]));
let initialDestination:'harbor'|'express'|'ridge'='express',destinationLighting:DestinationLighting='day';try{const prior=storage.store.drive();initialDestination=prior.route;if(prior.route==='ridge')destinationLighting=prior.lighting??'day'}catch{/* Invalid drive snapshot stays untouched until an explicit new entry. */}
const ui=new SignatureUI(app,{onChange:change,onAction:action,onSave:save,onNavigate:()=>audio.cue('ui.nav'),onLayout:()=>queueMicrotask(refitLayout)});
let currentView='hero',layoutKey='',cameraTween:{from:THREE.Vector3;to:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3;start:number}|undefined;let departure:ShowroomDeparture|undefined,navigating=false;let drivePreparation:DrivePreparationReport|undefined;
function state():SignatureState{return {ignition,initialDestination,destinationLighting,recipe:structuredClone(recipe),pending,status,screen,lighting,driverVisible,compare,reducedMotion,canUndo:history.length>0,savedRecipes:saved.map(r=>({id:r.id,name:r.name})),ownedProductIds:[],thumbs,routePreviews:{harbor:'/assets/p10b/previews/harbor-day.jpg',express:'/assets/p10b/previews/express-day.jpg',ridge:'/assets/p10b/previews/ridge-day.jpg','ridge-night':'/assets/p10b/previews/ridge-night.jpg'},...routeGraphics}}
function historyFragment(){window.history.replaceState(null,'',location.pathname+location.search+recipeFragment(recipe))}
function refresh(){ui.update(state())}
async function apply(){
 const shown=compare?stockRecipe(recipe):recipe;if(simulationProfile!==shown.handlingProfile){const next=await Simulation.create(undefined,shown.handlingProfile);simulation.dispose();simulation=next;simulationProfile=shown.handlingProfile;}accessories.inspectStorage(false);shocks.inspectionView(null);await finishes.set(shown.finish);accessories.set(Object.keys(shown.products));under.set(!!shown.products['SM-133'],shown.lights);shocks.set(!!shown.products['SM-3223']);shocks.update();under.update();hero.driver.root.visible=driverVisible;audio.setExhaustTreatment(!!shown.products['SM-7720']);
 // Recreate only the static diagnostic pose when setup changes; actual drives capture the recipe at entry.
 simulation.reset({x:0,z:0,y:0,yaw:0});simulation.configureSuspension(shown.products['SM-3223']?shown.suspension:null);for(let i=0;i<90;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});neutral=simulation.telemetry();hero.pose(neutral,0,false,true);hero.driver.root.visible=driverVisible;contact.ground(hero.root,()=>0);shocks.update();
 const look=STUDIO_LOOKS[lighting];renderer.toneMappingExposure=look.exposure;scene.environmentIntensity=look.environment;hemi.intensity=look.hemisphere;key.intensity=look.key;fill.intensity=look.fill;rim.intensity=look.rim;scene.background=new THREE.Color(look.background);wall.setLook(lighting);display.snapshot(renderer,scene.environment,JSON.stringify(shown));layoutKey='';refresh();
}
function view(name:string,animate=true){currentView=name;hero.driver.root.visible=driverVisible&&name!=='SM-28919';const before=camera.position.clone(),beforeTarget=controls.target.clone();cameraTween=undefined;camera.clearViewOffset();camera.fov=name==='tour-wall'?(screen==='build'?60:52):38;camera.updateProjectionMatrix();controls.minDistance=name==='interior'||name==='cockpit'?.45:3;accessories.inspectStorage(false);shocks.inspectionView(null);const directions:Record<string,THREE.Vector3>={hero:new THREE.Vector3(-5,1.65,-6),front:new THREE.Vector3(0,1.8,-7),rear:new THREE.Vector3(4,2.2,6),side:new THREE.Vector3(7,1.8,0),'tour-wall':new THREE.Vector3(6,1.8,-5)};
 if(name==='interior'||name==='cockpit'){if(hero.asset.getObjectByName('model02_2026_foundation')){camera.position.set(-.72,1.42,.22);controls.target.set(-.1,.71,-.33)}else{camera.position.set(-.65,1.35,.95);controls.target.set(0,.62,-.12)}}
 else if(name==='tour-wall'){camera.position.set(5.4,2.25,-1.4);controls.target.set(-2.3,screen==='build'?.8:1.45,.8)}
 else if(name==='SM-28919'){accessories.inspectStorage(true);camera.position.set(-1.4,1.8,-.35);controls.target.set(-.22,.43,1)}
 else if(name==='SM-3223'){camera.position.set(3,1.3,-3.6);controls.target.set(.5,.55,-1.25)}
 else if(name==='SM-7720'){camera.position.set(3,1.25,5);controls.target.set(0,.45,1.5)}
 else if(name==='SM-26801'){camera.position.set(4,2.5,5);controls.target.set(0,1.2,.7)}
 else{controls.target.copy(fitSafeCamera(camera,visibleBounds(hero.root),directions[name]??directions.hero,ui.safeRegion(),innerWidth,innerHeight,.9))}
 controls.update();if(animate&&!reducedMotion){cameraTween={from:before,to:camera.position.clone(),fromTarget:beforeTarget,toTarget:controls.target.clone(),start:performance.now()};camera.position.copy(before);controls.target.copy(beforeTarget)}render();
}
function refitLayout(){if(departure||!ui||!ui.root.dataset.screen)return;const next=JSON.stringify([screen,ui.safeRegion(),innerWidth,innerHeight]);if(next!==layoutKey){layoutKey=next;view(currentView,false)}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.clearViewOffset();camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!departure)queueMicrotask(refitLayout)}

async function change(next:BuildRecipe,preset=false){if(pending)return;try{const verified=validateRecipe(next),cue=buildCue(recipe,verified,preset);if(!cue)return;storage.store.setDraft(verified);history.push(structuredClone(recipe));history=history.slice(-24);recipe=verified;historyFragment();compare=false;status='Preview updated · career credits unchanged';pending=true;refresh();await apply();audio.cue(cue);pending=false;refresh()}catch(e){pending=false;status=(e as Error).message;refresh()}}
async function save(name:string){if(pending)return;pending=true;refresh();try{await Promise.resolve();storage.store.save(name,recipe);audio.cue('build.save');saved=storage.store.recipes();original=structuredClone(recipe);status=storage.temporary?'Build kept for this temporary session. Browser storage is unavailable.':'Build saved on this browser.'}catch(e){status='Save failed: '+(e as Error).message}finally{pending=false;refresh()}}
async function reapply(){pending=true;refresh();try{await apply()}finally{pending=false;refresh()}}
function restoreDeparture(error:unknown){
 navigating=false;contact.mesh.visible=true;audio.stopDeparture();audio.stopBayDoor();departure?.dispose();departure=undefined;keyboard.clear();ui.root.hidden=false;ui.root.inert=false;controls.enabled=true;hero.driver.root.visible=driverVisible;
 const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=false;audioPanel.hidden=false}
 pending=false;status='Could not leave the showroom. Your build is preserved. '+(error instanceof Error?error.message:String(error));resize();view('hero');refresh();ui.root.querySelector<HTMLButtonElement>('[data-action=test-drive]')?.focus();
}
async function action(name:string,value?:unknown){if(pending)return;try{
 if(name==='ignition'){ignition=value==='true';display.setPower(ignition);audio.cue('power')}
 else if(name==='build'){audio.cue('ui.nav');screen='build';resize();view('hero')}
 else if(name==='quick-race'){audio.cue('ui.nav');screen='events';view('hero')}
 else if(name==='destination-lighting'){destinationLighting=value==='night'?'night':'day';audio.cue('ui.nav')}
 else if(name==='career'){location.assign('?scene=career&play=career');return}
 else if(name==='lighting'){lighting=value==='lights'?'lights':'studio';await reapply()}
 else if(name==='motion'){reducedMotion=value==='true';controls.enableDamping=!reducedMotion;try{localStorage.setItem('slingmods-signature-motion',reducedMotion?'reduced':'full')}catch{} }
 else if(name==='driver'){driverVisible=typeof value==='boolean'?value:!driverVisible;hero.driver.root.visible=driverVisible}
 else if(name==='view'){audio.cue('ui.nav');view(String(value))}
 else if(name==='use-current-driving'){const next=storage.store.useCurrentDriving(recipe);saved=storage.store.recipes();await change(next);status='Current driving copy ready · historical build kept · no career spend'}
 else if(name==='handling'){if(value==='slingmods-sport-v1'||value==='slingmods-sport-v2'||value==='slingmods-sport-v3'||value==='slingmods-sport-v4')await change({...recipe,handlingProfile:value})}
 else if(name==='preset'){const p=PRESETS.find(p=>p.id===value);if(p)await change(p.recipe,true)}
 else if(name==='load-recipe'){const r=saved.find(r=>r.id===value);if(r)await change(r.recipe,true)}
 else if(name==='undo'){const prior=history.at(-1);if(prior){storage.store.setDraft(prior);recipe=history.pop()!;historyFragment();compare=false;await reapply()}}
 else if(name==='compare'){compare=!compare;await reapply();status=compare?'Stock comparison · your preview is preserved':'Preview restored'}
 else if(name==='reset'){await change(original)}
 else if(name==='shop'){screen='shop';view('hero')}
 else if(name==='copy'){await navigator.clipboard.writeText(buildSummary(recipe));status='Build summary copied.'}
 else if(name==='back'){audio.cue('ui.back');if(screen==='build')screen='entry';else screen='build';accessories.inspectStorage(false);shocks.inspectionView(null);resize();view('hero')}
 else if(name==='test-drive'||name==='race'){
  if(value==='duel'||value==='crew'){location.assign('?scene=career&play=career');return}
  const route=value==='ridge'?'ridge':value==='harbor'?'harbor':'express',snapshot=validateRecipe(recipe),destination=`?scene=${route==='ridge'?'ridge':'express'}&route=${route}&mode=${name==='race'?'race':'test'}&play=preview${route==='ridge'?'&lighting='+destinationLighting:''}${recipeFragment(snapshot)}`;
  pending=true;refresh();drivePreparation=await prepareDrive(route,snapshot,name==='race'?'race':'test');pending=false;if(drivePreparation.cancelled){status='Preparation cancelled. Your build is unchanged.';refresh();return}
  storage.store.beginDrive(snapshot,route,name==='race'?'race':'test',destinationLighting);
  if(name==='race'||reducedMotion){location.assign(destination);return}
  compare=false;await reapply();pending=true;refresh();accessories.inspectStorage(false);shocks.inspectionView(null);
  contact.mesh.visible=false;ui.root.hidden=true;ui.root.inert=true;controls.enabled=false;keyboard.clear();camera.clearViewOffset();camera.updateProjectionMatrix();
  const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=true;audioPanel.hidden=true}hero.driver.root.visible=true;
  ignition=true;display.setPower(true);audio.beginDeparture(!!snapshot.products['SM-7720']);
  departure=new ShowroomDeparture({parent:app,car:hero.root,room,camera,target:controls.target,
   onWheelPose:spin=>hero.rear.update({...neutral.wheels[2],spin}),onSoundStart:()=>audio.startBayDoor(),onSoundStop:()=>{audio.stopBayDoor();audio.stopDeparture()},onSoundFrame:(elapsed,paused)=>audio.updateDeparture(elapsed,paused),
   onComplete:()=>{if(navigating)return;navigating=true;try{location.assign(destination)}catch(error){restoreDeparture(error)}}});return
 }
 refresh();
 }catch(e){pending=false;if(departure||ui.root.hidden)restoreDeparture(e);else{status=(e as Error).message;refresh()}}}
function constrainCamera(){const v=camera.position.clone().sub(controls.target);let scale=1;for(const [axis,lo,hi]of [['x',-5.6,5.6],['z',-5.5,5.8]]as const){const end=camera.position[axis];if(end<lo||end>hi)scale=Math.min(scale,((end<lo?lo:hi)-controls.target[axis])/v[axis])}if(scale<1)camera.position.copy(controls.target).addScaledVector(v,Math.max(.1,scale));camera.lookAt(controls.target)}
function render(){if(!departure)constrainCamera();under.update();shocks.update();optics.update(0,ignition);display.update(neutral,camera,performance.now());renderer.render(scene,camera)}
resize();await apply();view('hero',false);
// Compile showroom-only paint and dashboard-thumbnail variants while the existing
// loading veil is present. Never change the recipe, save, history or action sounds.
const finishPreparation:{finish:string;ms:number;error?:string}[]=[];
for(const finish of ['black-red','white-graphite','graphite-red'] as const){const at=performance.now();try{await finishes.set(finish);await prepareRenderer(renderer,scene,camera);display.snapshot(renderer,scene.environment,'loading-finish:'+finish);finishPreparation.push({finish,ms:performance.now()-at})}catch(error){finishPreparation.push({finish,ms:performance.now()-at,error:String(error)})}}
await apply();const preparation=await prepareRenderer(renderer,scene,camera);veil.remove();const loadMs=performance.now()-started;
controls.addEventListener('start',()=>{cameraTween=undefined});const keyboard=new KeyboardBuffer();let virtual:DeviceSample|undefined;addEventListener('keydown',e=>keyboard.down(e.code,performance.now(),e.repeat));addEventListener('keyup',e=>keyboard.up(e.code));
let showroomFocused=document.hasFocus();addEventListener('focus',()=>{showroomFocused=true});addEventListener('blur',()=>{showroomFocused=false;keyboard.clear();audio.lifecycle(true)});addEventListener('visibilitychange',()=>audio.lifecycle(document.hidden||!showroomFocused));addEventListener('resize',resize);let last=performance.now(),frames=0;const intervals:number[]=[];
function frame(now:number){if(!pageActive()){requestAnimationFrame(frame);return}const dt=Math.min(.1,(now-last)/1000);intervals.push(now-last);if(intervals.length>6000)intervals.shift();last=now;const input=virtual??{...keyboard.read(),pads:Array.from(navigator.getGamepads?.()??[]),focused:document.hasFocus()&&!document.hidden};if(departure)departure.frame(dt,{...input,focused:input.focused&&showroomFocused&&!document.hidden});else{ui.frame(input);if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/800),u=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,u);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,u);if(t===1)cameraTween=undefined}controls.update()}audio.update(neutral,document.hidden||!showroomFocused||!!departure?.suspended,false);render();frames++;requestAnimationFrame(frame)}requestAnimationFrame(frame);
function inspect(){return {mirrors:mirrors.inspect(),vehicleContext:CURRENT_VEHICLE_CONTEXT,visual:hero.inspectVisual(),simulationProfile,display:display.inspect(),optics:optics.inspect(),ready:true,drivePreparation,departure:departure?.inspect()??null,showroom:{tourWall:wall.inspect(),look:STUDIO_LOOKS[lighting],safeRegion:ui.safeRegion(),view:currentView,driverRendered:hero.driver.root.visible,curtainPosition:room.getObjectByName('bay_door_curtain')?.position.toArray(),curtainScale:room.getObjectByName('bay_door_curtain')?.scale.toArray()},build:__BUILD_REF__,recipe:structuredClone(recipe),original,finish:finishes.inspect(),compare,lighting,destinationLighting,driverVisible,reducedMotion,status,pending,screen,saved,loadMs,preparation,frames,memory:{...renderer.info.memory},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,products:accessories.inspect?.(),suspension:shocks.inspect(),audio:audio.inspect(),simulation:simulation.telemetry(),profile:simulation.suspensionConfig(),camera:{position:camera.position.toArray(),target:controls.target.toArray()},finishPreparation,bounds3d:visibleBounds(hero.root),bounds:projectedBounds(camera,visibleBounds(hero.root)),resources:performance.getEntriesByType('resource').map((r:any)=>({name:r.name,bytes:r.transferSize,duration:r.duration})),intervals}}
if(evidenceEnabled())(window as any).__SIGNATURE={ready:true,inspect,view,poseVisual:(steer:number,travel:number,spin:number)=>{if(!params.has('test'))throw Error('Isolated test required');const t=structuredClone(neutral);t.steer=steer;t.wheels.forEach((w,i)=>{w.localCenter.y+=travel;w.steer=i<2?steer:0;w.spin=spin});hero.pose(t,1/60,false,true);render();return hero.inspectVisual()},referenceCamera:(position:number[],target:number[])=>{controls.minDistance=.1;controls.enableDamping=false;camera.clearViewOffset();camera.fov=38;camera.updateProjectionMatrix();camera.position.fromArray(position);controls.target.fromArray(target);controls.update();render()},setDeviceSample:(s:any)=>{if(!params.has('test'))throw Error('Isolated test required');virtual=s?{...s,keys:new Set(s.keys)}:undefined},startAudioCapture:()=>audio.startEvidenceCapture(),audioSync:(id:string)=>audio.evidenceMarker(id),stopAudioCapture:()=>audio.stopEvidenceCapture()};
addEventListener('pagehide',()=>{mirrors.dispose();departure?.dispose();wall.dispose();contact.dispose();probe.dispose();optics.dispose();display.dispose();audio.dispose();simulation.dispose();controls.dispose();under.dispose();shocks.dispose();accessories.dispose();finishes.dispose();renderer.dispose()});
