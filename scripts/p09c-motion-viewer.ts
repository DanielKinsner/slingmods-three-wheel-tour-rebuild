import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadDrivingHero} from '../src/presentation/hero';
import {DrivingCamera} from '../src/presentation/driving-camera';
import {GameAudio} from '../src/audio/game-audio';
import {createSweeper} from './p09c-motion-protocol';
import type {HandlingProfileId} from '../src/simulation';
const query=new URLSearchParams(location.search),profile=(query.get('handling')||'slingmods-sport-v3') as HandlingProfileId,mph=Number(query.get('mph')||65),radius=mph===50?90:150,direction=query.get('direction')==='-1'?-1:1;
const {sim,protocol}=await createSweeper(profile,{mph,radius,direction,duration:12});
const scene=new THREE.Scene();scene.background=new THREE.Color('#a7b4be');scene.fog=new THREE.Fog('#a7b4be',170,580);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;document.body.prepend(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.08,850),follow=new DrivingCamera(camera,'slingmods-sport-v2');
scene.add(new THREE.HemisphereLight('#f5fbff','#4d5157',2.3));const sun=new THREE.DirectionalLight('#fff7ed',3);sun.position.set(-20,50,15);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:'#646e76',roughness:.97}));ground.rotation.x=-Math.PI/2;ground.position.y=.005;scene.add(ground);
const grid=new THREE.GridHelper(1200,120,'#919ba3','#74808b');grid.position.y=.01;scene.add(grid);
const hero=await loadDrivingHero(new GLTFLoader());scene.add(hero.root);
const audio=new GameAudio(document.body),hud=document.querySelector('#hud')!,button=document.querySelector('#start') as HTMLButtonElement;
let running=false,finished=false,last=performance.now(),accumulator=0,pathMade=false;const samples:any[]=[];
const pathPoints:THREE.Vector3[]=[];const pathGeometry=new THREE.BufferGeometry(),pathLine=new THREE.Line(pathGeometry,new THREE.LineBasicMaterial({color:'#ffb65a'}));scene.add(pathLine);
function reference(){if(!protocol.entry||pathMade)return;pathMade=true;const e=protocol.entry,cx=e.position.x-direction*radius;for(const delta of [-3,0,3]){const points=[];for(let i=0;i<=400;i++){const a=i/400*Math.PI*2;points.push(new THREE.Vector3(cx+Math.cos(a)*(radius+delta),.026,e.position.z+Math.sin(a)*(radius+delta)))}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:delta===0?'#ffffff':'#87939d'})))}}
button.onclick=async()=>{await audio.unlock();running=true;button.hidden=true;last=performance.now()};
function frame(now:number){const dt=Math.min(.1,(now-last)/1000);last=now;accumulator+=running&&!finished?dt:0;while(accumulator>=1/60){const c=protocol.control(sim.telemetry());sim.step(c);const t=sim.telemetry();samples.push(protocol.sample(t,c));accumulator-=1/60;reference();if(samples.length%6===0){pathPoints.push(new THREE.Vector3(t.position.x,.05,t.position.z));pathGeometry.setFromPoints(pathPoints)}if(protocol.finished){finished=true;break}}
const t=sim.telemetry(),s=samples.at(-1);hero.pose(t,dt,false);follow.update(hero.root.position,hero.root.quaternion,t.speed,dt,'far',false);audio.update(t,!running||finished,false);renderer.render(scene,camera);
hud.innerHTML=`<small>MATCHED MOTION · REAL PHYSICS · NATIVE CLOCK</small><h1>${profile==='slingmods-sport-v2'?'Retained v2 baseline':'Sport v3 candidate'}</h1><p>${mph} mph / ${radius} m sweeper · ${direction===1?'left':'right'}</p><p>Speed ${(t.speed/.44704).toFixed(1)} mph · brake ${((s?.input.brake??0)*100).toFixed(0)}%</p><p>Steering demand ${((s?.input.steer??0)*100).toFixed(0)}% · wheels ${(t.steer*180/Math.PI).toFixed(2)}°</p><p>Handwheel ${(t.steer*10*180/Math.PI).toFixed(1)}° · path error ${Math.abs(s?.error??0).toFixed(2)} m</p><p>${finished?'Scored take complete':protocol.entry?(protocol.elapsed<4?'Settling':'Scored motion'):'Accelerating physically'} · ${(protocol.elapsed).toFixed(1)} s</p><small>Same control-only test driver. White target / orange actual path.<br>Flat diagnostic fixture; no vehicle position correction.</small>`;
requestAnimationFrame(frame)}requestAnimationFrame(frame);
(window as any).__P09C_MOTION={ready:true,inspect:()=>({profile,mph,radius,direction,running,finished,telemetry:sim.telemetry(),audio:audio.inspect(),samples}),startAudioCapture:()=>audio.startEvidenceCapture(),audioSync:(id:string)=>audio.evidenceMarker(id),stopAudioCapture:()=>audio.stopEvidenceCapture()};
