import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadDrivingHero} from '../presentation/hero';
import {SignatureFinishPresenter,SignatureProducts,loadSignatureShowroom} from '../presentation/signature-art';
import {ProductPresenter} from '../presentation/product';
import {SuspensionPresenter} from '../presentation/suspension';
import {inspectionEnvironment,fitInspectionCamera,projectedBounds} from '../presentation/inspection';
import {prepareRenderer,preparationVeil} from '../presentation/prepare';
import {Simulation} from '../simulation';
import {GameAudio} from '../audio/game-audio';
import {KeyboardBuffer,type DeviceSample} from '../driving/input';
import {buildRepository,fragmentRecipe,recipeFragment,validateRecipe,freshRecipe,PRESETS,buildSummary,type BuildRecipe} from './config';
import {PRODUCTS,productById} from './catalog';
import {loadRouteGraphics} from './route-data';
import {SignatureUI,type SignatureState} from './ui';
import {evidenceEnabled} from '../demo/profile';
import {pageActive} from '../demo/recovery';
import {ShowroomDeparture} from './departure';

const params=new URLSearchParams(location.search),started=performance.now(),app=document.querySelector('#app')!;
document.body.className='signature-showroom';app.innerHTML='<div id="viewport"></div>';
const veil=preparationVeil(app),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:params.has('captureBuffer')});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
app.querySelector('#viewport')!.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#777d80');
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.06,80),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.35;
const env=inspectionEnvironment(true),pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromScene(env,.04);scene.environment=probe.texture;scene.environmentIntensity=.88;pmrem.dispose();env.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
const hemi=new THREE.HemisphereLight(0xf3f4f5,0x6f6a66,1.1),key=new THREE.DirectionalLight(0xfffbf3,2.1),fill=new THREE.DirectionalLight(0xe5edf7,.8),rim=new THREE.DirectionalLight(0xffffff,.95);key.position.set(-3,6,-4);fill.position.set(5,3,-2);rim.position.set(1,4,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});key.shadow.normalBias=.012;scene.add(hemi,key,fill,rim,key.target);
const loader=new GLTFLoader();const [hero,room,simulation]=await Promise.all([loadDrivingHero(loader),loadSignatureShowroom(loader),Simulation.create(undefined,'slingmods-sport-v1')]);scene.add(hero.root,room);
const [under,shocks,accessories]=await Promise.all([ProductPresenter.load(loader,hero.root,scene),SuspensionPresenter.load(loader,hero.asset),SignatureProducts.load(loader,hero.asset)]),finishes=new SignatureFinishPresenter(hero.asset),audio=new GameAudio(app);
let reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;try{reducedMotion=localStorage.getItem('slingmods-signature-motion')==='reduced'||reducedMotion}catch{}controls.enableDamping=!reducedMotion;
const storage=buildRepository();let recipe:BuildRecipe=freshRecipe(),original=freshRecipe(),history:BuildRecipe[]=[],compare=false,lighting:'studio'|'lights'='studio',driverVisible=false,pending=false,status=storage.temporary?'Temporary build session; browser storage is unavailable.':'',screen:SignatureState['screen']=params.get('screen')==='build'?'build':params.get('screen')==='events'?'events':'entry';
try{recipe=fragmentRecipe(location.hash)??storage.store.draft();original=structuredClone(recipe)}catch(e){status=(e as Error).message}
let saved:ReturnType<typeof storage.store.recipes>=[];try{saved=storage.store.recipes()}catch(e){status=(e as Error).message}
simulation.reset({x:0,z:0,y:0,yaw:0});for(let i=0;i<120;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});
const neutral=simulation.telemetry();hero.pose(neutral,0,false,true);hero.driver.root.visible=false;
const thumbs=Object.fromEntries(PRODUCTS.map(p=>[p.id,`/assets/p08b/thumbnails/${p.id}.png`]));
const routeGraphics=await loadRouteGraphics();
const ui=new SignatureUI(app,{onChange:change,onAction:action,onSave:save});
let departure:ShowroomDeparture|undefined,navigating=false;
function state():SignatureState{return {recipe:structuredClone(recipe),pending,status,screen,lighting,driverVisible,compare,reducedMotion,canUndo:history.length>0,savedRecipes:saved.map(r=>({id:r.id,name:r.name})),ownedProductIds:[],thumbs,...routeGraphics}}
function historyFragment(){window.history.replaceState(null,'',location.pathname+location.search+recipeFragment(recipe))}
function refresh(){ui.update(state())}
async function apply(){
 const shown=compare?freshRecipe():recipe;accessories.inspectStorage(false);shocks.inspectionView(null);await finishes.set(shown.finish);accessories.set(Object.keys(shown.products));under.set(!!shown.products['SM-133'],shown.lights);shocks.set(!!shown.products['SM-3223']);shocks.update();under.update();hero.driver.root.visible=driverVisible;audio.setExhaustTreatment(!!shown.products['SM-7720']);
 // Recreate only the static diagnostic pose when setup changes; actual drives capture the recipe at entry.
 simulation.reset({x:0,z:0,y:0,yaw:0});simulation.configureSuspension(shown.products['SM-3223']?shown.suspension:null);for(let i=0;i<90;i++)simulation.step({throttle:0,brake:1,steer:0,reverse:false});hero.pose(simulation.telemetry(),0,false,true);hero.driver.root.visible=driverVisible;shocks.update();
 const studio=lighting==='studio';renderer.toneMappingExposure=studio?.95:.82;scene.environmentIntensity=studio?.88:.24;hemi.intensity=studio?1.1:.38;key.intensity=studio?2.1:.55;fill.intensity=studio?.8:.25;rim.intensity=studio?.95:.4;scene.background=new THREE.Color(studio?'#777d80':'#252c34');refresh();
}
function view(name:string){accessories.inspectStorage(false);shocks.inspectionView(null);const directions:Record<string,THREE.Vector3>={hero:new THREE.Vector3(5,2.5,-6),front:new THREE.Vector3(0,1.8,-7),rear:new THREE.Vector3(4,2.2,6),side:new THREE.Vector3(7,1.8,0)};
 if(name==='interior'||name==='cockpit'){camera.position.set(-.8,2.6,1.2);controls.target.set(0,.55,.25)}
 else if(name==='SM-28919'){accessories.inspectStorage(true);camera.position.set(-1.4,1.8,-.35);controls.target.set(-.22,.43,1)}
 else if(name==='SM-3223'){camera.position.set(3,1.3,-3.6);controls.target.set(.5,.55,-1.25)}
 else if(name==='SM-7720'){camera.position.set(3,1.25,5);controls.target.set(0,.45,1.5)}
 else if(name==='SM-26801'){camera.position.set(4,2.5,5);controls.target.set(0,1.2,.7)}
 else{controls.target.copy(fitInspectionCamera(camera,new THREE.Box3().setFromObject(hero.root,true),directions[name]??directions.hero,screen==='entry'?.76:.64))}
 controls.update();render();
}
function resize(){if(departure){camera.aspect=innerWidth/innerHeight;camera.clearViewOffset();camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);return}camera.aspect=innerWidth/innerHeight;camera.setViewOffset(innerWidth,innerHeight,innerWidth>=1100?(screen==='entry'?-Math.min(190,innerWidth*.14):70):0,0,innerWidth,innerHeight);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
async function change(next:BuildRecipe){if(pending)return;try{const verified=validateRecipe(next);storage.store.setDraft(verified);history.push(structuredClone(recipe));history=history.slice(-24);recipe=verified;historyFragment();compare=false;status='Preview updated · career credits unchanged';pending=true;refresh();await apply();pending=false;refresh()}catch(e){pending=false;status=(e as Error).message;refresh()}}
async function save(name:string){if(pending)return;pending=true;refresh();try{await Promise.resolve();storage.store.save(name,recipe);saved=storage.store.recipes();original=structuredClone(recipe);status=storage.temporary?'Build kept for this temporary session. Browser storage is unavailable.':'Build saved on this browser.'}catch(e){status='Save failed: '+(e as Error).message}finally{pending=false;refresh()}}
async function reapply(){pending=true;refresh();try{await apply()}finally{pending=false;refresh()}}
function restoreDeparture(error:unknown){
 navigating=false;departure?.dispose();departure=undefined;keyboard.clear();ui.root.hidden=false;ui.root.inert=false;controls.enabled=true;hero.driver.root.visible=driverVisible;
 const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=false;audioPanel.hidden=false}
 pending=false;status='Could not leave the showroom. Your build is preserved. '+(error instanceof Error?error.message:String(error));resize();view('hero');refresh();ui.root.querySelector<HTMLButtonElement>('[data-action=test-drive]')?.focus();
}
async function action(name:string,value?:unknown){if(pending)return;try{
 if(name==='build'){screen='build';resize();view('hero')}
 else if(name==='quick-race'){screen='events'}
 else if(name==='career'){location.assign('?scene=bay&play=career');return}
 else if(name==='lighting'){lighting=value==='lights'?'lights':'studio';await reapply()}
 else if(name==='motion'){reducedMotion=value==='true';controls.enableDamping=!reducedMotion;try{localStorage.setItem('slingmods-signature-motion',reducedMotion?'reduced':'full')}catch{} }
 else if(name==='driver'){driverVisible=typeof value==='boolean'?value:!driverVisible;hero.driver.root.visible=driverVisible}
 else if(name==='view'){view(String(value))}
 else if(name==='preset'){const p=PRESETS.find(p=>p.id===value);if(p)await change(p.recipe)}
 else if(name==='load-recipe'){const r=saved.find(r=>r.id===value);if(r)await change(r.recipe)}
 else if(name==='undo'){const prior=history.at(-1);if(prior){storage.store.setDraft(prior);recipe=history.pop()!;historyFragment();compare=false;await reapply()}}
 else if(name==='compare'){compare=!compare;await reapply();status=compare?'Stock comparison · your preview is preserved':'Preview restored'}
 else if(name==='reset'){await change(original)}
 else if(name==='shop'){screen='shop'}
 else if(name==='copy'){await navigator.clipboard.writeText(buildSummary(recipe));status='Build summary copied.'}
 else if(name==='back'){if(screen==='build')screen='entry';else screen='build';accessories.inspectStorage(false);shocks.inspectionView(null);resize();view('hero')}
 else if(name==='test-drive'||name==='race'){
  if(value==='duel'||value==='crew'){location.assign('?scene=bay&play=career');return}
  const route=value==='harbor'?'harbor':'express',snapshot=validateRecipe(recipe),destination=`?scene=express&route=${route}&mode=${name==='race'?'race':'test'}&play=preview${recipeFragment(snapshot)}`;
  storage.store.beginDrive(snapshot,route,name==='race'?'race':'test');
  if(name==='race'||reducedMotion){location.assign(destination);return}
  compare=false;await reapply();pending=true;refresh();accessories.inspectStorage(false);shocks.inspectionView(null);
  ui.root.hidden=true;ui.root.inert=true;controls.enabled=false;keyboard.clear();camera.clearViewOffset();camera.updateProjectionMatrix();
  const audioPanel=document.getElementById('game-audio');if(audioPanel){audioPanel.inert=true;audioPanel.hidden=true}hero.driver.root.visible=true;
  departure=new ShowroomDeparture({parent:app,car:hero.root,room,camera,target:controls.target,
   onSoundStart:()=>audio.startBayDoor(),onSoundStop:()=>audio.stopBayDoor(),
   onComplete:()=>{if(navigating)return;navigating=true;try{location.assign(destination)}catch(error){restoreDeparture(error)}}});return
 }
 refresh();
 }catch(e){if(departure||ui.root.hidden)restoreDeparture(e);else{status=(e as Error).message;refresh()}}}
function constrainCamera(){const v=camera.position.clone().sub(controls.target);let scale=1;for(const [axis,lo,hi]of [['x',-5.6,5.6],['z',-5.5,5.8]]as const){const end=camera.position[axis];if(end<lo||end>hi)scale=Math.min(scale,((end<lo?lo:hi)-controls.target[axis])/v[axis])}if(scale<1)camera.position.copy(controls.target).addScaledVector(v,Math.max(.1,scale));camera.lookAt(controls.target)}
function render(){if(!departure)constrainCamera();under.update();shocks.update();renderer.render(scene,camera)}
resize();await apply();view('hero');const preparation=await prepareRenderer(renderer,scene,camera);veil.remove();const loadMs=performance.now()-started;
const keyboard=new KeyboardBuffer();let virtual:DeviceSample|undefined;addEventListener('keydown',e=>keyboard.down(e.code,performance.now(),e.repeat));addEventListener('keyup',e=>keyboard.up(e.code));
let showroomFocused=document.hasFocus();addEventListener('focus',()=>{showroomFocused=true});addEventListener('blur',()=>{showroomFocused=false;keyboard.clear();audio.lifecycle(true)});addEventListener('resize',resize);let last=performance.now(),frames=0;const intervals:number[]=[];
function frame(now:number){if(!pageActive()){requestAnimationFrame(frame);return}const dt=Math.min(.1,(now-last)/1000);intervals.push(now-last);if(intervals.length>6000)intervals.shift();last=now;const input=virtual??{...keyboard.read(),pads:Array.from(navigator.getGamepads?.()??[]),focused:document.hasFocus()&&!document.hidden};if(departure)departure.frame(dt,{...input,focused:input.focused&&showroomFocused&&!document.hidden});else{ui.frame(input);controls.update()}audio.update(simulation.telemetry(),document.hidden||!showroomFocused||!!departure?.suspended,false);render();frames++;requestAnimationFrame(frame)}requestAnimationFrame(frame);
function inspect(){return {ready:true,departure:departure?.inspect()??null,showroom:{driverRendered:hero.driver.root.visible,curtainPosition:room.getObjectByName('bay_door_curtain')?.position.toArray(),curtainScale:room.getObjectByName('bay_door_curtain')?.scale.toArray()},build:__BUILD_REF__,recipe:structuredClone(recipe),original,finish:finishes.inspect(),compare,lighting,driverVisible,reducedMotion,status,pending,screen,saved,loadMs,preparation,frames,memory:{...renderer.info.memory},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,products:accessories.inspect?.(),suspension:shocks.inspect(),audio:audio.inspect(),simulation:simulation.telemetry(),profile:simulation.suspensionConfig(),camera:{position:camera.position.toArray(),target:controls.target.toArray()},bounds:projectedBounds(camera,new THREE.Box3().setFromObject(hero.root,true)),resources:performance.getEntriesByType('resource').map((r:any)=>({name:r.name,bytes:r.transferSize,duration:r.duration})),intervals}}
if(evidenceEnabled())(window as any).__SIGNATURE={ready:true,inspect,view,referenceCamera:(position:number[],target:number[])=>{camera.position.fromArray(position);controls.target.fromArray(target);controls.update();render()},setDeviceSample:(s:any)=>{if(!params.has('test'))throw Error('Isolated test required');virtual=s?{...s,keys:new Set(s.keys)}:undefined},startAudioCapture:()=>audio.startEvidenceCapture(),audioSync:(id:string)=>audio.evidenceMarker(id),stopAudioCapture:()=>audio.stopEvidenceCapture()};
addEventListener('pagehide',()=>{departure?.dispose();audio.dispose();simulation.dispose();controls.dispose();under.dispose();shocks.dispose();accessories.dispose();finishes.dispose();renderer.dispose()});
