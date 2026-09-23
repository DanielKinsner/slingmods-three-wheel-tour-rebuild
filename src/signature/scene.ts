import {RYKER_PRESETS} from './ryker-catalog';
import {loadSurfaceMaterials} from '../presentation/surface-materials';
import {CURRENT_HANDLING_PROFILE} from '../simulation/profile';
import {VehicleMirrors} from '../presentation/vehicle-mirrors';
import {VehicleOptics} from '../presentation/vehicle-materials';
import {CURRENT_VEHICLE_CONTEXT} from '../presentation/vehicle-asset';
import {STUDIO_LOOKS,createStudioReflectionEnvironment,createStudioContactOcclusion,loadTourWall} from './studio-look';
import {fitSafeCamera,visibleBounds,type SafeRegion} from '../presentation/safe-camera';
import {SHOWROOM_PRESETS,SHOWROOM_SAFE_VOLUME,presetLimits,containCamera,limitOrbit,snapshotCamera,type CameraSnapshot} from '../presentation/showroom-camera';
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
import {PRODUCTS} from './catalog';
import {loadRouteGraphics} from './route-data';
import {SignatureUI,type SignatureState,type CareerSummary,type DestinationChoice} from './ui';
import {evidenceEnabled} from '../demo/profile';
import {pageActive} from '../demo/recovery';
import {ShowroomDeparture} from './departure';
import {readCareerContext} from '../career/context';
import {sceneOf} from '../career/transfer';
import {nextCareerStep,careerStepHref,careerRecipe,productOwned} from '../career-experience/model';
import {resolveLook,rememberLook,type TimeOfDay} from '../presentation/time-of-day';
import type {Career} from '../career/store';
import type {Appearance} from '../career/catalog';
import {RenderPipeline,SHOWROOM_BLOOM} from '../presentation/render-pipeline';import {loadGraphicsQuality,GRAPHICS_PRESETS} from '../presentation/graphics-settings';

const params=new URLSearchParams(location.search),started=performance.now(),app=document.querySelector('#app')!;
// One showroom, two modes. main.ts sends the player career garage (?scene=bay) here: same room, vehicle and camera,
// with career permissions and transactions instead of free preview editing.
const garage=sceneOf(new URL(location.href))==='bay',garageKit=garage?import('../showroom/garage'):undefined;
document.body.className='signature-showroom'+(garage?' career-garage':'');app.innerHTML='<div id="viewport"></div>';
const veil=preparationVeil(app,{showroom:true}),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:params.has('captureBuffer')});
const graphics=loadGraphicsQuality();renderer.setPixelRatio(Math.min(devicePixelRatio,GRAPHICS_PRESETS[graphics].pixelRatioCap));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
app.querySelector('#viewport')!.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#777d80');
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.06,80),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.35;
const env=createStudioReflectionEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromScene(env,.04);scene.environment=probe.texture;scene.environmentIntensity=.88;pmrem.dispose();env.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
const hemi=new THREE.HemisphereLight(0xf3f4f5,0x6f6a66,1.1),key=new THREE.DirectionalLight(0xfffbf3,2.1),fill=new THREE.DirectionalLight(0xe5edf7,.8),rim=new THREE.DirectionalLight(0xffffff,.95);key.position.set(-3,6,-4);fill.position.set(5,3,-2);rim.position.set(1,4,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});key.shadow.normalBias=.012;scene.add(hemi,key,fill,rim,key.target);
const loader=new GLTFLoader();const [hero,room,wall,routeGraphics]=await Promise.all([loadDrivingHero(loader),loadSignatureShowroom(loader),loadTourWall(loader),loadRouteGraphics()]);scene.add(hero.root,room);const contact=vehicleContact();hero.root.add(contact.mesh);scene.add(wall.group,createStudioContactOcclusion());
// Career access: the garage transacts through the career client; the free showroom only reads (labels, return path) and relays a temporary career.
const kit=await garageKit,career=kit?await kit.careerClient():undefined,careerView=garage?undefined:await readCareerContext();
const careerState=():Career|null=>career?career.state:careerView?.state??null;
const surfaceFinish=await loadSurfaceMaterials(renderer,room,params.get('surfaces')!=='off');
const [under,shocks,accessories]=await Promise.all([ProductPresenter.load(loader,hero.root,scene),SuspensionPresenter.load(loader,hero.asset),SignatureProducts.load(loader,hero.asset)]),finishes=new SignatureFinishPresenter(hero.asset,{studio:true}),audio=new GameAudio(app);
let reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;try{reducedMotion=localStorage.getItem('slingmods-signature-motion')==='reduced'||reducedMotion}catch{}controls.enableDamping=!reducedMotion;
type Screen=SignatureState['screen'];const SCREENS:readonly Screen[]=['entry','build','events','shop'];const screenFrom=(search:string):Screen=>{const v=new URLSearchParams(search).get('screen');return SCREENS.includes(v as Screen)?v as Screen:'entry'};
const storage=buildRepository();let recipe:BuildRecipe=freshRecipe(),original=freshRecipe(),history:BuildRecipe[]=[],compare=false,lighting:'studio'|'lights'='studio',driverVisible=false,pending=false,status=garage?'':storage.temporary?'Temporary build session; browser storage is unavailable.':careerView?.temporary?'Your temporary career travels with this tab while you preview. Nothing here is spent or earned.':'',screen:Screen=garage?'build':screenFrom(location.search);
if(career){recipe=careerRecipe(career.state);original=structuredClone(recipe)}else{try{recipe=fragmentRecipe(location.hash)??storage.store.draft();original=structuredClone(recipe)}catch(e){status=(e as Error).message}}
let saved:ReturnType<typeof storage.store.recipes>=[];if(!garage)try{saved=storage.store.recipes()}catch(e){status=(e as Error).message}
const simulation=await Simulation.create(undefined,CURRENT_HANDLING_PROFILE),simulationProfile=CURRENT_HANDLING_PROFILE;
simulation.reset({x:0,z:0,y:0,yaw:0});for(let i=0;i<120;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});
let neutral=simulation.telemetry();const display=new PoweredDisplay(hero.asset),optics=new VehicleOptics(hero.asset,true);let ignition=true;hero.pose(neutral,0,false,true);hero.driver.root.visible=false;
const mirrors=new VehicleMirrors(hero.root,hero.asset);
// Same post pipeline as the drive, so the showroom car and the driven car are graded alike (and underglow glows here too).
const pipeline=new RenderPipeline(renderer,graphics);pipeline.onViewTarget(target=>{mirrors.viewTarget=target});
const thumbs=Object.fromEntries(PRODUCTS.map(p=>[p.id,`/assets/p08b/thumbnails/${p.id}.png`]));
let destination:DestinationChoice='express',destinationLighting:DestinationLighting='day';try{const prior=storage.store.drive();destination=prior.route;if(prior.route==='ridge')destinationLighting=prior.lighting??'day'}catch{/* Invalid drive snapshot stays untouched until an explicit new entry. */}
const initialDestination=destination;
// Waterfront looks start from what the drive would resolve anyway (remembered choice or showcase default), now shown and passed explicitly.
const destinationLooks:Record<'express'|'harbor',TimeOfDay>={express:resolveLook({route:'express',career:false,requested:'day',explicitLighting:false,search:''}).id,harbor:resolveLook({route:'harbor',career:false,requested:'day',explicitLighting:false,search:''}).id};
// Scene-owned state for the career garage's presentation overrides (the workshop previews kits/hardware before purchase).
const garageOverride:{under?:[boolean,Appearance];shocks?:boolean}={};
// Declared ahead of the UI: action() and restoreDeparture() may run while the loading veil is still up.
const keyboard=new KeyboardBuffer();
let currentView='hero',viewManual=false,orbiting=false,layoutKey='',cameraTween:{from:THREE.Vector3;to:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3;start:number}|undefined;let departure:ShowroomDeparture|undefined,navigating=false;let drivePreparation:DrivePreparationReport|undefined;
interface ShowroomUI {readonly root:HTMLElement;update(s:SignatureState):void;frame(s:DeviceSample):void;safeRegion():SafeRegion;inspect():unknown;ready?():void}
const ui:ShowroomUI=kit&&career?new kit.GarageUI(app as HTMLElement,career,{view:name=>view(name),saveCamera:()=>snapshotCamera(camera,controls.target,currentView,viewManual),restoreCamera:s=>restoreCamera(s as CameraSnapshot),lighting:look=>{lighting=look;void reapply()},driver:visible=>{driverVisible=visible;hero.driver.root.visible=visible&&currentView!=='SM-28919';if(visible&&!reducedMotion)hero.driver.triggerGesture('acknowledge');refresh()},appearance:(equipped,appearance)=>{garageOverride.under=[equipped,appearance];under.set(equipped,appearance);render()},suspension:equipped=>{garageOverride.shocks=equipped;shocks.set(equipped);shocks.update();render()},cue:(id,key)=>audio.cue(id,key),layout:()=>queueMicrotask(refitLayout)}):new SignatureUI(app,{onChange:change,onAction:action,onSave:save,onNavigate:()=>audio.cue('ui.nav'),onLayout:()=>queueMicrotask(refitLayout)});
const fromCareer=params.get('from')==='career'?'career':params.get('from')==='bay'?'bay':null;
const returnHref=fromCareer==='bay'?`?scene=bay&play=${careerView?.profile==='demo'?'demo':'career'}`:fromCareer==='career'?'?scene=career&play=career':null;
const sameBuild=(a:BuildRecipe,b:BuildRecipe)=>{const c=(r:BuildRecipe)=>JSON.stringify({...r,products:Object.fromEntries(Object.entries(r.products).sort())});return c(a)===c(b)};
function careerSummary():CareerSummary{const s=careerState(),step=nextCareerStep(s);return {label:step.kind==='start'?'Start Career':'Continue Career',detail:step.detail,returning:!!returnHref,returnLabel:fromCareer==='bay'?'Return to career garage':'Return to career',temporary:!!careerView?.temporary||!!career&&!career.durable,earned:!!returnHref&&!!s&&sameBuild(recipe,careerRecipe(s))}}
function state():SignatureState{const s=careerState();return {ignition,initialDestination,destination,destinationLighting,destinationLooks:{...destinationLooks},view:currentView,viewManual,career:careerSummary(),recipe:structuredClone(recipe),pending,status,screen,lighting,driverVisible,compare,reducedMotion,canUndo:history.length>0,savedRecipes:saved.map(r=>({id:r.id,name:r.name})),ownedProductIds:s?PRODUCTS.filter(p=>productOwned(s,p.id)).map(p=>p.id):[],thumbs,routePreviews:{harbor:'/assets/p10b/previews/harbor-day.jpg',express:'/assets/p10b/previews/express-day.jpg',ridge:'/assets/p10b/previews/ridge-day.jpg','ridge-night':'/assets/p10b/previews/ridge-night.jpg'},...routeGraphics}}
function historyFragment(){if(garage)return;window.history.replaceState(window.history.state,'',location.pathname+location.search+recipeFragment(recipe))}
function refresh(){ui.update(state())}
async function apply(){
 const shown=compare?stockRecipe(recipe):recipe;accessories.inspectStorage(false);shocks.inspectionView(null);await finishes.set(shown.finish);accessories.set(Object.keys(shown.products),shown.ryker);const glow=garageOverride.under??[hero.asset.getObjectByName('ryker_foundation')?!!shown.ryker?.underglow:!!shown.products['SM-133'],shown.lights];under.set(glow[0],glow[1]);shocks.set(garageOverride.shocks??!!shown.products['SM-3223']);shocks.update();under.update();hero.driver.root.visible=driverVisible;audio.setExhaustTreatment(!!shown.products['SM-7720']);
 // Recreate only the static diagnostic pose when setup changes; actual drives capture the recipe at entry.
 simulation.reset({x:0,z:0,y:0,yaw:0});simulation.configureSuspension(shown.products['SM-3223']?shown.suspension:null);for(let i=0;i<90;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});neutral=simulation.telemetry();hero.pose(neutral,0,false,true);hero.driver.root.visible=driverVisible;contact.ground(hero.root,()=>0);shocks.update();
 const look=STUDIO_LOOKS[lighting];renderer.toneMappingExposure=look.exposure;scene.environmentIntensity=look.environment;hemi.intensity=look.hemisphere;key.intensity=look.key;fill.intensity=look.fill;rim.intensity=look.rim;scene.background=new THREE.Color(look.background);wall.setLook(lighting);mirrors.invalidate();display.snapshot(renderer,scene.environment,JSON.stringify(shown));layoutKey='';refresh();
}
/** Named views share one table and one containment volume with the career garage (presentation/showroom-camera). */
function view(name:string,animate=true){currentView=name;viewManual=false;hero.driver.root.visible=driverVisible&&name!=='SM-28919';const before=camera.position.clone(),beforeTarget=controls.target.clone();cameraTween=undefined;camera.clearViewOffset();camera.fov=name==='tour-wall'?(screen==='build'&&!garage?60:52):38;camera.updateProjectionMatrix();const preset=presetLimits(name);controls.minDistance=preset.minDistance;controls.maxDistance=preset.maxDistance;accessories.inspectStorage(false);shocks.inspectionView(null);
 if(name==='interior'||name==='cockpit'){if(hero.asset.getObjectByName('ryker_foundation')){camera.position.set(-.7,1.65,.90);controls.target.set(0,.96,-.15)}else if(hero.asset.getObjectByName('model02_2026_foundation')){camera.position.set(-.72,1.42,.22);controls.target.set(-.1,.71,-.33)}else{camera.position.set(-.65,1.35,.95);controls.target.set(0,.62,-.12)}}
 else if(name==='tour-wall'){camera.position.set(5.4,2.25,-1.4);controls.target.set(-2.3,screen==='build'&&!garage?.8:1.45,.8)}
 else if(preset.position&&preset.target){if(name==='SM-28919')accessories.inspectStorage(true);if(name==='SM-3223-front'||name==='SM-3223-rear')shocks.inspectionView(name==='SM-3223-rear'?'rear':'front');camera.position.fromArray(preset.position);controls.target.fromArray(preset.target)}
 else{controls.target.copy(fitSafeCamera(camera,visibleBounds(hero.root),new THREE.Vector3(...(preset.direction??SHOWROOM_PRESETS.hero.direction!)),ui.safeRegion(),innerWidth,innerHeight,.9))}
 containCamera(camera,controls.target);limitOrbit(controls,preset);controls.update();containCamera(camera,controls.target);if(animate&&!reducedMotion){cameraTween={from:before,to:camera.position.clone(),fromTarget:beforeTarget,toTarget:controls.target.clone(),start:performance.now()};camera.position.copy(before);controls.target.copy(beforeTarget)}render();refresh();
}
/** Exact prior view (position, target, lens, preset/manual state), used when the career workshop closes. */
function restoreCamera(s:CameraSnapshot){cameraTween=undefined;currentView=s.view;viewManual=s.manual;camera.clearViewOffset();camera.fov=s.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.position.copy(s.position);controls.target.copy(s.target);containCamera(camera,controls.target);const preset=presetLimits(currentView);controls.minDistance=Math.min(preset.minDistance,camera.position.distanceTo(controls.target));limitOrbit(controls,{...preset,minDistance:controls.minDistance});controls.update();const o=s.offset;if(o&&o.fullWidth===innerWidth&&o.fullHeight===innerHeight){camera.setViewOffset(o.fullWidth,o.fullHeight,o.offsetX,o.offsetY,o.width,o.height);camera.updateProjectionMatrix()}else if(!viewManual)recenterOffset();layoutKey=JSON.stringify([screen,ui.safeRegion(),innerWidth,innerHeight]);render();refresh()}
/** A manual orbit keeps its place on layout changes; only the free-canvas centring follows the panels. */
function recenterOffset(){if(!['hero','front','rear','side','workshop'].includes(currentView))return;const r=ui.safeRegion();camera.setViewOffset(innerWidth,innerHeight,innerWidth/2-(r.left+r.right)/2,innerHeight/2-(r.top+r.bottom)/2,innerWidth,innerHeight);camera.updateProjectionMatrix()}
function refitLayout(){if(departure||!ui||!ui.root.dataset.screen)return;const next=JSON.stringify([screen,ui.safeRegion(),innerWidth,innerHeight]);if(next!==layoutKey){layoutKey=next;if(viewManual){recenterOffset();render()}else view(currentView,false)}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.clearViewOffset();camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,GRAPHICS_PRESETS[graphics].pixelRatioCap));renderer.setSize(innerWidth,innerHeight);pipeline.resize();if(!departure)queueMicrotask(refitLayout)}

async function change(next:BuildRecipe,preset=false){if(pending||garage)return;try{const verified=validateRecipe(next),cue=buildCue(recipe,verified,preset);if(!cue)return;storage.store.setDraft(verified);history.push(structuredClone(recipe));history=history.slice(-24);recipe=verified;historyFragment();compare=false;status='Preview updated · career credits unchanged';pending=true;refresh();await apply();audio.cue(cue);pending=false;refresh()}catch(e){pending=false;status=(e as Error).message;refresh()}}
async function save(name:string){if(pending||garage)return;pending=true;refresh();try{await Promise.resolve();storage.store.save(name,recipe);audio.cue('build.save');saved=storage.store.recipes();original=structuredClone(recipe);status=storage.temporary?'Build kept for this temporary session. Browser storage is unavailable.':'Build saved on this browser.'}catch(e){status='Save failed: '+(e as Error).message}finally{pending=false;refresh()}}
async function reapply(){pending=true;refresh();try{await apply()}finally{pending=false;refresh()}}
function restoreDeparture(error:unknown){
 navigating=false;contact.mesh.visible=true;audio.stopDeparture();audio.stopBayDoor();departure?.dispose();departure=undefined;keyboard.clear();ui.root.hidden=false;ui.root.inert=false;controls.enabled=true;hero.driver.root.visible=driverVisible;
 const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=false;audioPanel.hidden=false}
 pending=false;status='Could not leave the showroom. Your build is preserved. '+(error instanceof Error?error.message:String(error));resize();view('hero');refresh();ui.root.querySelector<HTMLButtonElement>('[data-action=test-drive]')?.focus();
}
// Screen router: every screen has a URL (?screen=), in-app navigation pushes one history entry, recipe edits only replace it.
let navDepth=0;
function screenHref(next:Screen){const q=new URLSearchParams(location.search);if(next==='entry')q.delete('screen');else q.set('screen',next);const search=q.toString();return location.pathname+(search?'?'+search:'')+location.hash}
function goScreen(next:Screen,how:'push'|'replace'='push'){if(garage)return;if(how==='push'&&next!==screen){navDepth++;window.history.pushState({signatureScreen:next,depth:navDepth},'',screenHref(next))}else window.history.replaceState({signatureScreen:next,depth:navDepth},'',screenHref(next));showScreen(next)}
function showScreen(next:Screen){screen=next;accessories.inspectStorage(false);shocks.inspectionView(null);resize();view('hero')}
if(!garage){window.history.replaceState({signatureScreen:screen,depth:0},'',location.href);addEventListener('popstate',e=>{navDepth=typeof e.state?.depth==='number'?e.state.depth:0;const next=screenFrom(location.search);if(departure||navigating)return;if(next!==screen){audio.cue('ui.back');showScreen(next)}historyFragment();refresh()})}
const careerHref=()=>returnHref??careerStepHref(nextCareerStep(careerState()),careerView?.profile??'career');
async function action(name:string,value?:unknown){if(pending)return;try{
 if(name==='ignition'){ignition=value==='true';display.setPower(ignition);audio.cue('power')}
 else if(name==='build'){audio.cue('ui.nav');goScreen('build')}
 else if(name==='quick-race'){audio.cue('ui.nav');goScreen('events')}
 else if(name==='home'){audio.cue('ui.back');goScreen('entry')}
 else if(name==='destination'){destination=value==='ridge'?'ridge':value==='harbor'?'harbor':'express'}
 else if(name==='destination-lighting'){destinationLighting=value==='night'?'night':'day';audio.cue('ui.nav')}
 else if(name==='destination-look'){if(destination!=='ridge'){destinationLooks[destination]=resolveLook({route:destination,career:false,requested:'day',explicitLighting:false,search:'?look='+String(value)}).id;audio.cue('ui.detent')}}
 else if(name==='career'){audio.cue('ui.nav');careerView?careerView.navigate(careerHref()):location.assign(careerHref());return}
 else if(name==='lighting'){lighting=value==='lights'?'lights':'studio';await reapply()}
 else if(name==='motion'){reducedMotion=value==='true';controls.enableDamping=!reducedMotion;try{localStorage.setItem('slingmods-signature-motion',reducedMotion?'reduced':'full')}catch{} }
 else if(name==='driver'){driverVisible=typeof value==='boolean'?value:!driverVisible;hero.driver.root.visible=driverVisible;if(driverVisible&&!reducedMotion)hero.driver.triggerGesture('acknowledge')}
 else if(name==='view'){audio.cue('ui.nav');view(String(value))}
 else if(name==='use-current-driving'){const next=storage.store.useCurrentDriving(recipe);saved=storage.store.recipes();await change(next);status='Current driving copy ready · historical build kept · no career spend'}
 else if(name==='handling'){if(value==='slingmods-sport-v1'||value==='slingmods-sport-v2'||value==='slingmods-sport-v3'||value==='slingmods-sport-v4')await change({...recipe,handlingProfile:value})}
 else if(name==='preset'&&hero.asset.getObjectByName('ryker_foundation')){const p=RYKER_PRESETS.find(p=>p.id===value);if(p)await change({...recipe,ryker:{...p.parts},finish:'blue-orange'},true)}
 else if(name==='preset'){const p=PRESETS.find(p=>p.id===value);if(p)await change(p.recipe,true)}
 else if(name==='load-recipe'){const r=saved.find(r=>r.id===value);if(r)await change(r.recipe,true)}
 else if(name==='undo'){const prior=history.at(-1);if(prior){storage.store.setDraft(prior);recipe=history.pop()!;historyFragment();compare=false;await reapply();audio.cue('ui.back')}}
 else if(name==='compare'){compare=!compare;await reapply();status=compare?'Stock comparison · your preview is preserved':'Preview restored'}
 else if(name==='reset'){await change(original)}
 else if(name==='shop'){audio.cue('ui.nav');goScreen('shop')}
 else if(name==='copy'){await navigator.clipboard.writeText(buildSummary(recipe));status='Build summary copied.'}
 // Back: leave an inspection first, then retrace in-app history, then go up one level. Never toggles.
 else if(name==='back'){audio.cue('ui.back');if(screen==='build'&&currentView!=='hero'&&(currentView.startsWith('SM-')||currentView==='tour-wall'||currentView==='interior'))view('hero');else if(navDepth>0)window.history.back();else if(screen!=='entry')goScreen(screen==='shop'?'build':'entry','replace')}
 else if(name==='test-drive'||name==='race'){
  if(value==='duel'||value==='crew'){careerView?careerView.navigate('?scene=career&play=career'):location.assign('?scene=career&play=career');return}
  const route=value==='ridge'?'ridge':value==='harbor'?'harbor':'express',snapshot=validateRecipe(recipe),look=route==='ridge'?'':destinationLooks[route];if(look)rememberLook(route as 'express'|'harbor',look);
  const target=`?scene=${route==='ridge'?'ridge':'express'}&route=${route}&mode=${name==='race'?'race':'test'}&play=preview${route==='ridge'?'&lighting='+destinationLighting:'&look='+look}${fromCareer?'&from='+fromCareer:''}${recipeFragment(snapshot)}`;
  pending=true;refresh();drivePreparation=await prepareDrive(route,snapshot,name==='race'?'race':'test');pending=false;if(drivePreparation.cancelled){status='Preparation cancelled. Your build is unchanged.';refresh();return}
  storage.store.beginDrive(snapshot,route,name==='race'?'race':'test',destinationLighting);
  // A temporary career rides along in this tab (never into the drive's rewards) so it survives the round trip.
  const destinationHref=careerView?careerView.relay(target):target;
  if(name==='race'||reducedMotion){location.assign(destinationHref);return}
  compare=false;await reapply();pending=true;refresh();accessories.inspectStorage(false);shocks.inspectionView(null);
  contact.mesh.visible=false;ui.root.hidden=true;ui.root.inert=true;controls.enabled=false;keyboard.clear();camera.clearViewOffset();camera.updateProjectionMatrix();
  const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=true;audioPanel.hidden=true}hero.driver.root.visible=true;
  ignition=true;display.setPower(true);audio.beginDeparture(!!snapshot.products['SM-7720']);
  departure=new ShowroomDeparture({parent:app,car:hero.root,room,camera,target:controls.target,
   onWheelPose:spin=>hero.rear.update({...neutral.wheels[2],spin}),onSoundStart:()=>audio.startBayDoor(),onSoundStop:()=>{audio.stopBayDoor();audio.stopDeparture()},onSoundFrame:(elapsed,paused)=>audio.updateDeparture(elapsed,paused),
   onComplete:()=>{if(navigating)return;navigating=true;try{location.assign(destinationHref)}catch(error){restoreDeparture(error)}}});return
 }
 refresh();
 }catch(e){pending=false;if(departure||ui.root.hidden)restoreDeparture(e);else{status=(e as Error).message;refresh()}}}
function render(){if(!departure)containCamera(camera,controls.target,SHOWROOM_SAFE_VOLUME);mirrors.update(camera,innerHeight,!departure&&(currentView==='interior'||currentView==='cockpit'));mirrors.render(renderer,scene,camera);under.update();shocks.update();optics.update(0,ignition);display.update(neutral,camera,performance.now());pipeline.render(scene,camera,{bloom:SHOWROOM_BLOOM})}
resize();await apply();view('hero',false);ui.ready?.();
// Compile showroom-only paint and dashboard-thumbnail variants while the existing
// loading veil is present. Never change the recipe, save, history or action sounds.
const finishPreparation:{finish:string;ms:number;error?:string}[]=[];
for(const finish of ['black-red','white-graphite','graphite-red','blue-orange'].filter(f=>f!==recipe.finish).slice(0,3) as ('black-red'|'white-graphite'|'graphite-red'|'blue-orange')[]){const at=performance.now();try{await finishes.set(finish);await prepareRenderer(renderer,scene,camera);display.snapshot(renderer,scene.environment,'loading-finish:'+finish);finishPreparation.push({finish,ms:performance.now()-at})}catch(error){finishPreparation.push({finish,ms:performance.now()-at,error:String(error)})}}
await apply();const preparation=await prepareRenderer(renderer,scene,camera,()=>pipeline.render(scene,camera));veil.remove();const loadMs=performance.now()-started;
// The career garage follows purchases, equipment and finish changes made through its own workshop or another tab.
career?.subscribe(()=>{if(!career)return;const next=careerRecipe(career.state);if(sameBuild(next,recipe))return;recipe=next;original=structuredClone(next);void apply()});
let graphicsControl:{root:HTMLElement;dispose():void}|undefined;if(garage){const {installGraphicsControl}=await import('../presentation/graphics-control');graphicsControl=installGraphicsControl(app,renderer,pipeline,GRAPHICS_PRESETS[graphics].lighting);graphicsControl.root.style.display='flex'}
// Orbiting away from a named view clears its pressed state (the view stays where the player put it).
controls.addEventListener('start',()=>{cameraTween=undefined;orbiting=true});controls.addEventListener('change',()=>{if(orbiting&&!viewManual){viewManual=true;refresh()}});controls.addEventListener('end',()=>{orbiting=false});let virtual:DeviceSample|undefined;addEventListener('keydown',e=>keyboard.down(e.code,performance.now(),e.repeat));addEventListener('keyup',e=>keyboard.up(e.code));
let showroomFocused=document.hasFocus();addEventListener('focus',()=>{showroomFocused=true});addEventListener('blur',()=>{showroomFocused=false;keyboard.clear();audio.lifecycle(true)});addEventListener('visibilitychange',()=>audio.lifecycle(document.hidden||!showroomFocused));addEventListener('resize',resize);
// Dragging the window to another monitor changes devicePixelRatio without always firing resize.
(function watchPixelRatio(){matchMedia(`(resolution:${devicePixelRatio}dppx)`).addEventListener('change',()=>{resize();watchPixelRatio()},{once:true})})();
let last=performance.now(),frames=0;const intervals:number[]=[];
function frame(now:number){if(!pageActive()){requestAnimationFrame(frame);return}const dt=Math.min(.1,(now-last)/1000);intervals.push(now-last);if(intervals.length>6000)intervals.shift();last=now;const input=virtual??{...keyboard.read(),pads:Array.from(navigator.getGamepads?.()??[]),focused:document.hasFocus()&&!document.hidden};if(departure)departure.frame(dt,{...input,focused:input.focused&&showroomFocused&&!document.hidden});else{ui.frame(input);const preset=presetLimits(currentView);if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/800),u=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,u);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,u);if(t===1)cameraTween=undefined}
  // Orbit, wheel/touch zoom and controller-driven view changes all pass through the same room limits before and after the orbit update.
  limitOrbit(controls,cameraTween?{...preset,minDistance:.05}:preset);controls.update()}if(!departure&&hero.driver.root.visible&&!reducedMotion&&showroomFocused&&hero.driver.inspect().motion?.enabled)hero.driver.update(neutral,dt,false);audio.update(neutral,document.hidden||!showroomFocused||!!departure?.suspended,false);render();frames++;requestAnimationFrame(frame)}requestAnimationFrame(frame);
function inspect(){return {mode:garage?'career-garage':'free-preview',surfaceFinish:surfaceFinish.inspect(),pipeline:pipeline.inspect(),mirrors:mirrors.inspect(),vehicleContext:CURRENT_VEHICLE_CONTEXT,visual:hero.inspectVisual(),simulationProfile,display:display.inspect(),optics:optics.inspect(),ready:true,drivePreparation,departure:departure?.inspect()??null,showroom:{tourWall:wall.inspect(),look:STUDIO_LOOKS[lighting],safeRegion:ui.safeRegion(),view:currentView,viewManual,driverRendered:hero.driver.root.visible,safeVolume:{min:SHOWROOM_SAFE_VOLUME.min.toArray(),max:SHOWROOM_SAFE_VOLUME.max.toArray()},controls:{minDistance:controls.minDistance,maxDistance:controls.maxDistance},curtainPosition:room.getObjectByName('bay_door_curtain')?.position.toArray(),curtainScale:room.getObjectByName('bay_door_curtain')?.scale.toArray()},ui:ui.inspect(),career:career?{state:structuredClone(career.state),durable:career.durable,profile:career.profile}:careerView?{state:careerView.state?structuredClone(careerView.state):null,temporary:careerView.temporary,source:careerView.source,profile:careerView.profile,returnHref}:null,build:__BUILD_REF__,recipe:structuredClone(recipe),original,finish:finishes.inspect(),compare,lighting,destination,destinationLighting,destinationLooks:{...destinationLooks},driverVisible,reducedMotion,status,pending,screen,saved,loadMs,preparation,frames,memory:{...renderer.info.memory},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,products:accessories.inspect?.(),suspension:shocks.inspect(),product:under.inspect(),audio:audio.inspect(),simulation:simulation.telemetry(),profile:simulation.suspensionConfig(),camera:{position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov,viewOffset:camera.view?.enabled?{x:camera.view.offsetX,y:camera.view.offsetY}:null},finishPreparation,bounds3d:visibleBounds(hero.root),bounds:projectedBounds(camera,visibleBounds(hero.root)),resources:performance.getEntriesByType('resource').map((r:any)=>({name:r.name,bytes:r.transferSize,duration:r.duration})),intervals}}
const referenceCamera=(position:number[],target:number[])=>{currentView='reference';viewManual=false;controls.minDistance=.1;controls.enableDamping=false;camera.clearViewOffset();camera.fov=38;camera.updateProjectionMatrix();camera.position.fromArray(position);controls.target.fromArray(target);controls.update();render()};
if(evidenceEnabled()){const api={ready:true,inspect,view,referenceCamera,poseVisual:(steer:number,travel:number,spin:number)=>{if(!params.has('test'))throw Error('Isolated test required');const t=structuredClone(neutral);t.steer=steer;t.wheels.forEach((w,i)=>{w.localCenter.y+=travel;w.steer=i<2?steer:0;w.spin=spin});hero.pose(t,1/60,false,true);render();return hero.inspectVisual()},setDeviceSample:(s:any)=>{if(!params.has('test'))throw Error('Isolated test required');virtual=s?{...s,keys:new Set(s.keys)}:undefined},startAudioCapture:()=>audio.startEvidenceCapture(),audioSync:(id:string)=>audio.evidenceMarker(id),stopAudioCapture:()=>audio.stopEvidenceCapture()};(window as any).__SIGNATURE=api;
 // Historical garage scripts keep their hook name; its inspect() carries the legacy recipe/finish/products/camera fields.
 if(garage)(window as any).__TWT={...api,inspect:()=>{const i=inspect();return {...i,career:career?.state,cameraPosition:i.camera.position,cameraFov:i.camera.fov,build:(ui.inspect() as any).build,chapter:(ui.inspect() as any).chapter}}}}
addEventListener('pagehide',()=>{surfaceFinish.dispose();pipeline.dispose();mirrors.dispose();departure?.dispose();wall.dispose();contact.dispose();probe.dispose();optics.dispose();display.dispose();audio.dispose();simulation.dispose();controls.dispose();under.dispose();shocks.dispose();accessories.dispose();finishes.dispose();graphicsControl?.dispose();careerView?.dispose();career?.close();renderer.dispose()});
