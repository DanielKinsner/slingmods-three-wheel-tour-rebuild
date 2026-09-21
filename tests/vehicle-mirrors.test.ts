import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {mirrorFaces,VehicleMirrors} from '../src/presentation/vehicle-mirrors';
function nativeGlass(){
 const bytes=readFileSync('public/assets/model02/slingshot-2026.glb'),size=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+size).toString()),binary=28+size;
 const mesh=g.meshes.find((m:{name:string})=>m.name==='Mirrors_1'),p=mesh.primitives[0];
 const attribute=(id:number)=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],count=a.type==='VEC3'?3:1,offset=binary+(v.byteOffset??0)+(a.byteOffset??0);const array=a.componentType===5126?new Float32Array(bytes.buffer,bytes.byteOffset+offset,a.count*count):a.componentType===5123?new Uint16Array(bytes.buffer,bytes.byteOffset+offset,a.count):new Uint32Array(bytes.buffer,bytes.byteOffset+offset,a.count);return new THREE.BufferAttribute(array.slice(),count)};
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',attribute(p.attributes.POSITION));geometry.setAttribute('normal',attribute(p.attributes.NORMAL));geometry.setIndex(attribute(p.indices));return geometry;
}
test('live mirror faces retain all native glass vertices and triangles without modifying the source',()=>{
 const original=nativeGlass(),before=Array.from(original.getAttribute('position').array),faces=mirrorFaces(original);assert.equal(faces.length,2);
 assert.equal(faces.reduce((n,f)=>n+f.geometry.index!.count,0),original.index!.count);
 for(const face of faces){const points=face.geometry.getAttribute('position'),source=original.getAttribute('position'),ids=Array.from({length:source.count},(_,i)=>i).filter(i=>source.getX(i)*face.side>0);assert.equal(points.count,25);for(let i=0;i<points.count;i++){const restored=new THREE.Vector3().fromBufferAttribute(points,i).applyQuaternion(face.rotation).add(face.center);assert.ok(restored.distanceTo(new THREE.Vector3().fromBufferAttribute(source,ids[i]))<1e-6)}face.geometry.dispose()}
 assert.deepEqual(Array.from(original.getAttribute('position').array),before);original.dispose();
});
test('live mirror targets stay outside cloned vehicle assets and dispose with the scene',()=>{
 const root=new THREE.Group(),car=new THREE.Group(),glass=new THREE.Mesh(nativeGlass(),new THREE.MeshStandardMaterial());glass.name='Mirrors_1';car.add(glass);root.add(car);const mirrors=new VehicleMirrors(root,car);
 assert.equal(mirrors.inspect().count,2);assert.equal(car.clone(true).getObjectByName('live_vehicle_mirrors'),undefined);assert.equal(glass.visible,true);
 let disposed=0;for(const mirror of mirrors.group.children){const target=(mirror as any).getRenderTarget() as THREE.WebGLRenderTarget;target.addEventListener('dispose',()=>disposed++)}
 mirrors.dispose();assert.equal(disposed,2);assert.equal(root.getObjectByName('live_vehicle_mirrors'),undefined);assert.equal(glass.visible,true);glass.geometry.dispose();(glass.material as THREE.Material).dispose();
});
function mirrorRig(){
 const scene=new THREE.Scene(),root=new THREE.Group(),car=new THREE.Group(),glass=new THREE.Mesh(nativeGlass(),new THREE.MeshStandardMaterial());glass.name='Mirrors_1';car.add(glass);root.add(car);scene.add(root);
 const mirrors=new VehicleMirrors(root,car),faces=mirrors.group.children as THREE.Mesh[],camera=new THREE.PerspectiveCamera(55,16/9,.05,500);scene.updateMatrixWorld(true);
 // Stand behind the first face, along its own normal, looking at it.
 const place=(distance:number)=>{const at=faces[0].getWorldPosition(new THREE.Vector3()),normal=new THREE.Vector3(0,0,1).transformDirection(faces[0].matrixWorld);camera.position.copy(at).addScaledVector(normal,distance);camera.lookAt(at);camera.updateMatrixWorld(true)};
 return{scene,glass,mirrors,faces,camera,place,dispose(){mirrors.dispose();glass.geometry.dispose();(glass.material as THREE.Material).dispose()}};
}
test('a live mirror face only stays on where it is allowed and large enough to read',()=>{
 const rig=mirrorRig();rig.place(1);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,true,'close seated view is live');
 rig.mirrors.update(rig.camera,1440,false);assert.deepEqual(rig.mirrors.inspect().live,[false,false],'far view or showroom exterior never pays for a reflection');
 rig.place(60);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,false,'a face of a few pixels is skipped');
 rig.place(1);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,true);assert.equal(rig.glass.visible,true,'supplied glass is never hidden by the gate');rig.dispose();
});
test('mirror passes reuse one cached material list instead of walking the scene every frame',()=>{
 const rig=mirrorRig(),extra=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());rig.scene.add(extra);rig.place(1);
 let walks=0,passes=0;const traverse=rig.scene.traverse.bind(rig.scene);rig.scene.traverse=callback=>{walks++;traverse(callback)};
 const clippedDuringPass:number[]=[],renderer={localClippingEnabled:false,shadowMap:{autoUpdate:true},xr:{enabled:false},getRenderTarget:()=>null,setRenderTarget(){},render(){passes++;clippedDuringPass.push(extra.material.clippingPlanes?.length??0)}} as unknown as THREE.WebGLRenderer;
 const frame=()=>{for(const face of rig.faces)face.onBeforeRender(renderer,rig.scene,rig.camera,face.geometry,face.material as THREE.Material,null as never)};
 for(let i=0;i<30;i++)frame();
 assert.ok(passes>=30,'at least the facing mirror rendered each frame');assert.equal(walks,1,'scene walked once for '+passes+' passes');assert.ok(clippedDuringPass.every(n=>n===1),'every pass is clipped by exactly its own mirror plane');
 assert.equal(extra.material.clippingPlanes,null,'materials are restored after each pass');assert.equal(renderer.localClippingEnabled,false);
 const late=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());rig.scene.add(late);rig.mirrors.invalidate();frame();assert.equal(walks,2,'a build change re-lists materials once');assert.equal(late.material.clippingPlanes,null);
 // With a post-processing pipeline the main view is an offscreen target: mirrors must follow it, and still ignore every other target.
 const main={}as THREE.WebGLRenderTarget,other={}as THREE.WebGLRenderTarget;let current:THREE.WebGLRenderTarget|null=main;const targets:(THREE.WebGLRenderTarget|null)[]=[];Object.assign(renderer,{getRenderTarget:()=>current,setRenderTarget:(t:THREE.WebGLRenderTarget|null)=>{targets.push(t)}});
 rig.mirrors.viewTarget=main;let before=passes;frame();assert.ok(passes>before,'renders when the main view target is current');assert.equal(targets.at(-1),main,'hands the main target back');current=other;before=passes;frame();assert.equal(passes,before,'never renders inside thumbnails or other offscreen passes');
 assert.ok(rig.mirrors.inspect().cachedMaterials>=3);for(const mesh of[extra,late]){mesh.geometry.dispose();mesh.material.dispose()}rig.dispose();
});
