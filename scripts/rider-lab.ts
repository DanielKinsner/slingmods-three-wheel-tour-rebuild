import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DriverPresenter, type DriverAttachment } from '../src/presentation/driver';
import { TOUR_RIDER_URL, LEGACY_RIDER_URL } from '../src/presentation/rider-asset';
import type { VehicleTelemetry } from '../src/simulation';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e5e5dd');
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, .04).texture; room.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .01, 50);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minDistance = .35; controls.maxDistance = 10; controls.maxPolarAngle = Math.PI * .51;
const key = new THREE.DirectionalLight(0xfff5e5, 3.3); key.position.set(-3, 5, -4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -3; key.shadow.camera.right = key.shadow.camera.top = 3; key.shadow.normalBias = .008; scene.add(key);
const fill = new THREE.DirectionalLight(0xe5edff, 1.2); fill.position.set(3, 2, 1); scene.add(fill);
scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x747865, 1.1));
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#d1d4c9', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
let vehicle = new THREE.Group(); scene.add(vehicle);
const loader = new GLTFLoader();
let driver: DriverPresenter, wheel: THREE.Object3D, base: THREE.Quaternion, config: DriverAttachment;
let pose = 'idle', time = 0, paused = false, ready = false, detail = false, loadSerial = 0, cockpit = false;
const status = document.querySelector('#status')!;
const select = (id: string) => document.querySelector<HTMLSelectElement>('#'+id)!;
let assetURL = '', error = '';
function cameraView() {
 const ryker = select('vehicle').value === 'ryker', alone = select('vehicle').value === 'none';
 const target = new THREE.Vector3(ryker ? 0 : -.36, detail ? (ryker ? 1.36 : 1.06) : (alone ? .77 : .70), .18);
 controls.target.copy(target);
 camera.position.copy(target).add(new THREE.Vector3(detail ? -.70 : alone ? -1.45 : -3.4, detail ? .14 : alone ? .25 : 1.5, detail ? -1.05 : alone ? -2.15 : -4.2));
 controls.update();
}
function disposeTree(tree: THREE.Object3D) {
 const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), skeletons = new Set<THREE.Skeleton>();
 tree.traverse(o => { if(o instanceof THREE.Mesh){ geometries.add(o.geometry); for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m); for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)} } if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton); });
 geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose()); skeletons.forEach(s=>s.dispose());
}
async function load() {
 const serial=++loadSerial; ready=false; status.textContent='Loading rider…';
 const variant=select('asset').value, car=select('vehicle').value;
 assetURL=variant==='legacy'?LEGACY_RIDER_URL:TOUR_RIDER_URL;
 const attachment=car==='ryker'?'/assets/ryker/driver-attachment.json':'/assets/model02/driver-attachment.json';
 const [person, cfg, model] = await Promise.all([loader.loadAsync(assetURL), fetch(attachment).then(r=>r.json()), loader.loadAsync(car==='ryker'?'/assets/ryker/complete/ryker-900-complete.glb':'/assets/model02/slingshot-2026.glb')]);
 if(serial!==loadSerial){disposeTree(person.scene);if(model)disposeTree(model.scene);return}
 scene.remove(vehicle);disposeTree(vehicle);vehicle=new THREE.Group();scene.add(vehicle);config=cfg;
 if(config.rootOffset)person.scene.position.fromArray(config.rootOffset);vehicle.add(person.scene);
 if(car!=='none'){vehicle.add(model.scene);wheel=model.scene.getObjectByName('steering_control')!}
 else {
   // Same Slingshot wheel transform as the authored contact fixture, without displaying the vehicle.
   model.scene.updateMatrixWorld(true);const source=model.scene.getObjectByName('steering_control')!;
   wheel=new THREE.Object3D();source.matrixWorld.decompose(wheel.position,wheel.quaternion,wheel.scale);vehicle.add(wheel);disposeTree(model.scene);
 }
 base=wheel.quaternion.clone();driver=new DriverPresenter(person.scene,vehicle,wheel,config);
 person.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});
 time=0;ready=true;cameraView();frame(0,true); updateStatus();
}
function telemetry(): VehicleTelemetry {
 const steer=pose==='left'?.4:pose==='right'?-.4:pose==='left-lock'?.62:pose==='right-lock'?-.62:0;
 return {speed:pose==='idle'?0:pose==='brake'?8:22,steer,throttle:pose==='idle'||pose==='brake'?0:.35,brake:pose==='brake'?1:0} as VehicleTelemetry;
}
function frame(dt:number,reset=false,raster=true){
 if(!ready)return;time+=dt;const t=telemetry();
 wheel.quaternion.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(config.handlebar?new THREE.Vector3(0,.968,-.251).normalize():new THREE.Vector3(0,0,1),config.handlebar?t.steer:t.steer*10));
 driver.update(t,dt,cockpit,reset);scene.updateMatrixWorld(true);if(raster)renderer.render(scene,camera);
}
function updateStatus(){
 if(!ready)return;
 let triangles=0,draws=0;driver.root.traverse(o=>{if(o instanceof THREE.Mesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;draws+=Array.isArray(o.material)?o.material.length:1}});
 status.textContent=(select('asset').value==='tour'?'TOUR RIDER / V1':'ORIGINAL RIDER')+'\n'+Math.round(triangles).toLocaleString()+' triangles · '+draws+' surfaces\n'+(driver.inspect().motion?.gesture??'none').replace('none','Breathing / attentive idle');
}
select('asset').onchange=()=>void load().catch(fail);select('vehicle').onchange=()=>void load().catch(fail);
function setPose(value:string){pose=value;document.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===pose)))}
document.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(b=>b.onclick=()=>setPose(b.dataset.pose!));
document.querySelector<HTMLButtonElement>('#nod')!.onclick=()=>{driver?.triggerGesture('acknowledge')};
document.querySelector<HTMLButtonElement>('#glance')!.onclick=()=>{driver?.triggerGesture('look-left')};
document.querySelector<HTMLButtonElement>('#pause')!.onclick=e=>{paused=!paused;(e.target as HTMLElement).textContent=paused?'Play':'Pause'};
document.querySelector<HTMLButtonElement>('#close')!.onclick=e=>{detail=!detail;(e.target as HTMLElement).textContent=detail?'Full view':'Detail view';cameraView()};
function fail(e:unknown){error=String(e);status.textContent=error;console.error(e)}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
const clock=new THREE.Clock();let frames=0;
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.1);controls.update();if(!paused)frame(dt);else renderer.render(scene,camera);if(++frames%30===0)updateStatus()});
Object.assign(window,{__RIDER_LAB:{get ready(){return ready},get error(){return error},async load(asset:string,car:string){select('asset').value=asset;select('vehicle').value=car;await load()},setPose,setCockpit(value:boolean){cockpit=value;frame(0)},step(seconds:number,reset=false){paused=true;if(reset)frame(0,true,false);const count=Math.round(seconds*60);for(let i=0;i<count;i++)frame(1/60,false,i===count-1);return driver.inspect()},sweep(seconds:number){paused=true;let maxHand=0,maxFoot=0,maxSupportingGap=0;for(let i=0;i<Math.round(seconds*60);i++){frame(1/60,false,false);const r=driver.inspect();for(const a of Object.values(r.arms)as any[])maxHand=Math.max(maxHand,a.gap);for(const f of Object.values(r.feet)as any[])maxFoot=Math.max(maxFoot,f.gap);maxSupportingGap=Math.max(maxSupportingGap,Math.min(r.arms.left.rimGap,r.arms.right.rimGap))}renderer.render(scene,camera);return{maxHand,maxFoot,maxSupportingGap,report:driver.inspect()}},gesture:(name:any)=>driver.triggerGesture(name),camera(position:number[],target:number[]){camera.position.fromArray(position);controls.target.fromArray(target);controls.update();renderer.render(scene,camera)},inspect:()=>({assetURL,report:driver.inspect(),renderer:renderer.info.render}),pause(){paused=true}}});
void load().catch(fail);
