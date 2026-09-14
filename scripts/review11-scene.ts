import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {loadDrivingHero} from '../src/presentation/hero';
import {harborLighting} from '../src/presentation/harbor-lighting';
import {DrivingCamera} from '../src/presentation/driving-camera';
import {ProductPresenter} from '../src/presentation/product';
import {prepareRenderer} from '../src/presentation/prepare';
import {sampleRoad} from '../src/course/environment';
import {loadShowcaseHarbor} from '../src/presentation/showcase';
import type {VehicleTelemetry} from '../src/simulation';
/** Staged visual calibration only. Transforms here are never race/performance evidence. */
void(async()=>{
 const params=new URLSearchParams(location.search),preset=params.get('preset')==='day'?'day':'night';
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=preset==='night'?1.05:.95;document.body.style.margin='0';document.body.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.06,1600),loader=new GLTFLoader(),pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
 const [route,world,hero,base]=await Promise.all([fetch('/assets/harbor/route.json').then(r=>r.json()),loader.loadAsync('/assets/harbor/harbor.glb'),loadDrivingHero(loader),fetch('/__review11_telemetry').then(r=>r.json() as Promise<VehicleTelemetry>)]);
 scene.add(world.scene,hero.root);world.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=!(Array.isArray(o.material)?o.material:[o.material]).every(m=>/asphalt|ground|land|water|paint|runoff/i.test(m.name));for(const m of(Array.isArray(o.material)?o.material:[o.material])as THREE.MeshStandardMaterial[]){if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(m.emissive&&/lamp|lumin|emissive|light/i.test(m.name))m.emissiveIntensity=preset==='night'?2:.08}}});
 const showcaseStage=params.get('showcase');const showcase=showcaseStage?await loadShowcaseHarbor(scene,world.scene,preset,showcaseStage==='sample'?'sample':'full'):undefined;
 const rivals={maya:hero.cloneRival('#d7dddd','#57bab7'),jett:hero.cloneRival('#6d161e','#aa3838'),nico:hero.cloneRival('#3c444c','#e9b454')};Object.values(rivals).forEach(r=>scene.add(r.root));
 const lights=harborLighting(scene,hero.asset,route,preset,'standard'),product=await ProductPresenter.load(loader,hero.root,scene),chase=new DrivingCamera(camera);chase.eye.fromArray(hero.attachment.eye);chase.cockpitPitch=-.26;chase.cockpitFov=76;
 const swatch=new THREE.Mesh(new THREE.BoxGeometry(.55,.65,.08),new THREE.MeshStandardMaterial({color:'#808080',roughness:.6,metalness:0}));swatch.castShadow=false;scene.add(swatch);
 const carLength=new THREE.Box3().setFromObject(hero.asset).getSize(new THREE.Vector3()).z;let config:unknown;
 function pose(distance:number,id:keyof typeof rivals,spacing:number,view:'near'|'cockpit',kit:'stock'|'cyan'|'red',showSwatch=false,district=false){
  const centerSeparation=spacing+carLength;const p=sampleRoad(route,distance),yaw=Math.atan2(-p.dx,-p.dz),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),t=structuredClone(base);Object.assign(t.position,{x:p.x,y:base.position.y,z:p.z});Object.assign(t.quaternion,{x:q.x,y:q.y,z:q.z,w:q.w});hero.pose(t,0,view==='cockpit',true);
  for(const [key,r]of Object.entries(rivals)){r.root.visible=!district&&key===id;const peer=structuredClone(t);peer.position.x+=p.dx*centerSeparation;peer.position.z+=p.dz*centerSeparation;r.pose(peer,0,false,true)}
  swatch.visible=showSwatch;swatch.position.set(p.x+p.dx*centerSeparation+p.dz*1.5,.65,p.z+p.dz*centerSeparation-p.dx*1.5);swatch.quaternion.copy(q);
  product.set(kit!=='stock',{color:kit==='red'?'red':'cyan',brightness:.6,enabled:true});product.update();lights.update(hero.root.position,0);chase.update(hero.root.position,q,0,0,view,false,true);showcase?.update(camera.position,0);renderer.render(scene,camera);
  config={distance,id,spacing,spacingMeaning:"bumper clearance in meters",centerSeparation,view,kit,showSwatch,district,preset,exposure:renderer.toneMappingExposure,position:camera.position.toArray(),target:chase.target.toArray(),fov:camera.fov,vehicleOrigin:hero.root.position.toArray(),rivalOrigin:rivals[id].root.position.toArray()};return inspect();
 }
 function inspect(){return{config,showcase:showcase?.inspect(),render:{...renderer.info.render},memory:{...renderer.info.memory},programs:renderer.info.programs?.length,lighting:lights.inspect(),lightBudget:lights.budget,product:product.inspect(),drawingBuffer:renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),method:'Staged calibration fixture using exact runtime hero/driver/product/harbor and normal DrivingCamera math; stationary pose placement disclosed, never driving/physics/performance proof.'}}
 pose(0,'jett',8,'near','stock');const preparation=await product.prepare(()=>prepareRenderer(renderer,scene,camera));
 (window as any).__VISUAL={ready:true,pose,inspect,preparation};
})();
