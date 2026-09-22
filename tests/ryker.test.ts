import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mirrorFaces,VehicleMirrors} from '../src/presentation/vehicle-mirrors';
import {RykerMotion,isRyker} from '../src/presentation/ryker';import {vehicleContext} from '../src/presentation/vehicle-context';import {retailFitment} from '../src/signature/fitment';
const data=await readFile('public/assets/ryker/ryker-900.glb');const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
const car=gltf.scene,manifest=JSON.parse(await readFile('public/assets/ryker/manifest.json','utf8'));
test('purchased Ryker export has finite geometry and exact hierarchy/centers',()=>{assert.ok(isRyker(car));car.updateMatrixWorld(true);let triangles=0;for(const [name,w]of Object.entries(manifest.wheels) as any){const spin=car.getObjectByName(w.spin)!;assert.ok(spin);assert.ok(spin.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...w.center as [number,number,number]))<1e-5);assert.equal(car.getObjectByName(name+'_caliper')!.parent!.name,w.carrier);assert.equal(car.getObjectByName(name+'_rotor_hub')!.parent!.name,w.spin)}car.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o instanceof THREE.Mesh){const p=o.geometry.attributes.position;assert.ok(Array.from(p.array).every(Number.isFinite));triangles+=(o.geometry.index?.count??p.count)/3}});assert.equal(triangles,manifest.triangles)});
test('steering moves fenders and bars while spin moves only tires/rims/rotors, including reverse',()=>{const motion=new RykerMotion(car),t:any={steer:0,wheels:[{localCenter:{y:.32985},steer:0,spin:0},{localCenter:{y:.32985},steer:0,spin:0},{localCenter:{y:.3455},steer:0,spin:0}]};motion.pose(t);car.updateMatrixWorld(true);const caliper=car.getObjectByName('front_left_caliper')!,fender=car.getObjectByName('front_left_fender')!,fixed=car.getObjectByName('instrument_fixed')!;const c=caliper.matrixWorld.clone(),f=fender.matrixWorld.clone(),pod=fixed.matrixWorld.clone();t.wheels.forEach((w:any)=>w.spin=1);motion.pose(t);car.updateMatrixWorld(true);assert.deepEqual(caliper.matrixWorld.elements,c.elements);assert.deepEqual(fender.matrixWorld.elements,f.elements);assert.ok(car.getObjectByName('front_left_spin')!.rotation.x<0);t.wheels.forEach((w:any)=>{w.spin=-1;w.steer=.3});t.steer=.3;motion.pose(t);car.updateMatrixWorld(true);assert.ok(car.getObjectByName('front_left_spin')!.rotation.x>0);assert.notDeepEqual(fender.matrixWorld.elements,f.elements);assert.deepEqual(fixed.matrixWorld.elements,pod.elements);assert.ok(Math.abs(car.getObjectByName('steering_control')!.quaternion.y)>.1);t.steer=-.3;t.wheels.forEach((w:any)=>w.steer=-.3);motion.pose(t);assert.ok(car.getObjectByName('steering_control')!.quaternion.y<0)});
test('Ryker identity cannot claim Slingshot product compatibility',()=>{const context=vehicleContext('ryker');assert.equal(context.model,'Ryker 900');for(const id of ['SM-133','SM-3223','SM-7720','SM-26801','SM-28919'])assert.equal(retailFitment(id,context).compatible,false);assert.equal(vehicleContext('2026').label,'2026 Slingshot R')});

test('live Ryker reflections stay attached to the actual mirror faces through both steering directions',()=>{
 const root=new THREE.Group();root.add(car);const glass=car.getObjectByName('Mirrors_1') as THREE.Mesh;
 const faces=mirrorFaces(glass.geometry),mirrors=new VehicleMirrors(root,car),motion=new RykerMotion(car);
 const camera=new THREE.PerspectiveCamera(66,1.44,.05,100);camera.position.set(0,1.36,.3);camera.lookAt(0,1,-.3);camera.updateMatrixWorld();
 assert.equal(mirrors.inspect().count,2);assert.equal(faces.reduce((n,f)=>n+f.geometry.index!.count,0),glass.geometry.index!.count);
 for(const steer of [-.4,0,.4]){
  motion.pose({steer,wheels:[{localCenter:{y:.32985},steer,spin:0},{localCenter:{y:.32985},steer,spin:0},{localCenter:{y:.3455},steer:0,spin:0}]} as any);
  root.updateMatrixWorld(true);mirrors.update(camera,1000,true);
  faces.forEach((face,i)=>{const actual=mirrors.group.children[i].getWorldPosition(new THREE.Vector3()),expected=face.center.clone().addScaledVector(face.normal,.0003).applyMatrix4(glass.matrixWorld);assert.ok(actual.distanceTo(expected)<1e-6,'reflection must move with its housing')});
 }
 mirrors.dispose();faces.forEach(f=>f.geometry.dispose());car.removeFromParent();
});

test('the fixed Ryker instrument uses a valid fresh planar map with glTF top-down image coordinates',()=>{
 const mesh=car.getObjectByName('instrument_screen') as THREE.Mesh,uv=mesh.geometry.getAttribute('uv'),position=mesh.geometry.getAttribute('position'),indices=mesh.geometry.index!;
 assert.equal(mesh.parent!.name,'body_static');assert.ok(uv);let area=0;
 for(let j=0;j<indices.count;j+=3){const a=indices.getX(j),b=indices.getX(j+1),c=indices.getX(j+2);area+=Math.abs((uv.getX(b)-uv.getX(a))*(uv.getY(c)-uv.getY(a))-(uv.getY(b)-uv.getY(a))*(uv.getX(c)-uv.getX(a)))/2}
 assert.ok(area>.8&&area<1.1,`screen UV coverage ${area}`);
 let top=0,bottom=0;for(let j=1;j<position.count;j++){if(position.getY(j)>position.getY(top))top=j;if(position.getY(j)<position.getY(bottom))bottom=j}
 assert.ok(uv.getY(top)<.01&&uv.getY(bottom)>.99,'glTF UVs require flipY=false for canvas replacement');
});
