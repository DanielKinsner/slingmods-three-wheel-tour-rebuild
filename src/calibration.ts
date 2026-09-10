import './style.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {loadSave} from './save';

const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd0d1');
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,500);camera.position.set(5,5.5,7);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
document.querySelector('#viewport')!.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.3,0);controls.enableDamping=true;controls.update();
const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xe8f4ff,0x77756a,2));const sun=new THREE.DirectionalLight(0xfff7e9,3);sun.position.set(3,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});sun.shadow.normalBias=.025;scene.add(sun);
const saved=loadSave(localStorage);
const gltf=await new GLTFLoader().loadAsync('/assets/calibration.glb');scene.add(gltf.scene);
gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});
const mixer=new THREE.AnimationMixer(gltf.scene);for(const clip of gltf.animations)mixer.clipAction(clip).play();
const debug={ready:true,asset:'calibration.glb',save:saved,animationCount:gltf.animations.length,time:0,inspect:()=>{
 const point=(name:string)=>gltf.scene.getObjectByName(name)!.getWorldPosition(new THREE.Vector3()).toArray();
 const patch=gltf.scene.getObjectByName('metre_cube') as THREE.Mesh;
 return {axes:{origin:point('axis_origin'),x:point('axis_x'),y:point('axis_y'),z:point('axis_z')},cubeBounds:new THREE.Box3().setFromObject(patch).getSize(new THREE.Vector3()).toArray(),clearcoat:(patch.material as THREE.MeshPhysicalMaterial).clearcoat,rubberRoughness:((gltf.scene.getObjectByName('rubber_patch') as THREE.Mesh).material as THREE.MeshStandardMaterial).roughness,wheelQuaternion:gltf.scene.getObjectByName('wheel_spin')!.quaternion.toArray(),animationCount:gltf.animations.length,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)};
},setTime:(t:number)=>{mixer.setTime(t);renderer.render(scene,camera)}};
(window as any).__TWT=debug;
document.querySelector('#status')!.textContent='P00 calibration · metre scale · exported wheel animation · fresh save namespace';
let previous=performance.now();function frame(now:number){const dt=Math.min((now-previous)/1000,.05);previous=now;if(!document.hidden){mixer.update(dt);debug.time+=dt;controls.update();renderer.render(scene,camera)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
