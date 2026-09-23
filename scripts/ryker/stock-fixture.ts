import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RykerProducts} from '../../src/presentation/ryker-products';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,900);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.style.margin='0';document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#363e46');const camera=new THREE.PerspectiveCamera(38,4/3,.01,30);scene.add(new THREE.HemisphereLight(0xffffff,0x555b68,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,4,-2);scene.add(light);
const loader=new GLTFLoader();const original=(await loader.loadAsync('/assets/ryker/ryker-900.glb')).scene,complete=(await loader.loadAsync('/assets/ryker/complete/ryker-900-complete.glb')).scene;
const products=new RykerProducts(complete,complete.getObjectByName('ryker_accessories') as THREE.Group);scene.add(original,complete);
const originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();for(const car of [original,complete])car.traverse(o=>{if(o instanceof THREE.Mesh)originals.set(o,o.material)});
function render(which:string,position:number[],target:number[],mask=false){original.visible=which==='original';complete.visible=which==='complete';products.set({});for(const [o,m]of originals){o.material=m;if(mask){let parent:THREE.Object3D|null=o,part='retained';while(parent){if(parent.name.startsWith('stock_ryker_')){part=parent.name;break}parent=parent.parent}o.material=new THREE.MeshBasicMaterial({color:part.includes('shocks')?'#ff4444':part.includes('exhaust')?'#33bbff':part.includes('body')?'#ffcc33':'#bcc2cb',side:THREE.DoubleSide})}}camera.position.fromArray(position);camera.lookAt(new THREE.Vector3().fromArray(target));renderer.render(scene,camera);return renderer.domElement.toDataURL()}
(window as any).__RYKER_STOCK={render,ready:true};
