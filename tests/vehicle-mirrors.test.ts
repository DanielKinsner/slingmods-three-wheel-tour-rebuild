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
