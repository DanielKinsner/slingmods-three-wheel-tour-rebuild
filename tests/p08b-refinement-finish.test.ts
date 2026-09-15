import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {SignatureFinishPresenter,type SignatureFinish} from '../src/presentation/signature-art';import {SIGNATURE_ACCENTS} from '../src/presentation/signature-palette';import {FINISHES} from '../src/signature/config';
/** Real exported node/material roles, without GPU/image loading or replacing the shared palette. */
function exportedFixture(){const bytes=fs.readFileSync('public/assets/p08b/slingshot-signature.glb'),gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());const mats:THREE.MeshStandardMaterial[]=gltf.materials.map((m:any)=>{const mat=new THREE.MeshStandardMaterial();mat.name=m.name;const p=m.pbrMetallicRoughness??{};if(p.baseColorFactor)mat.color.fromArray(p.baseColorFactor);mat.roughness=p.roughnessFactor??1;if(p.baseColorTexture){mat.map=new THREE.Texture();mat.map.name='original-image-'+p.baseColorTexture.index}return mat});const nodes:THREE.Object3D[]=gltf.nodes.map((n:any)=>{let object:THREE.Object3D;if(n.mesh===undefined)object=new THREE.Group();else{const material=gltf.meshes[n.mesh].primitives.map((p:any)=>mats[p.material]);object=new THREE.Mesh(new THREE.BufferGeometry(),material.length===1?material[0]:material)}object.name=n.name??'';return object});gltf.nodes.forEach((n:any,i:number)=>(n.children??[]).forEach((id:number)=>nodes[i].add(nodes[id])));const car=new THREE.Group();for(const id of gltf.scenes[gltf.scene??0].nodes)car.add(nodes[id]);const meshes=nodes.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh);return{car,meshes,mats}}
const materials=(mesh:THREE.Mesh):THREE.MeshStandardMaterial[]=>Array.isArray(mesh.material)?mesh.material as THREE.MeshStandardMaterial[]:[mesh.material as THREE.MeshStandardMaterial];
function roles(mesh:THREE.Mesh,material:THREE.MeshStandardMaterial){let arm=/^rear_arm_visual(?:__|$)/.test(mesh.name);for(let p=mesh.parent;p;p=p.parent)arm ||= p.name==='rear_arm_visual';return /Radar_Blue/.test(material.name)?'paint':/Orange_Accent/.test(material.name)&&(/^body_static(?:__|$)/.test(mesh.name)||arm)?'accent':'protected'}
test('All finish choices recolor actual exported swingarm accents and protect calipers, springs and metals',async()=>{
 const {car,meshes}=exportedFixture(),rival=car.clone(true);
 const originals=meshes.map(mesh=>({mesh,material:mesh.material,slots:materials(mesh).map(m=>({ref:m,color:m.color.clone(),map:m.map,roughness:m.roughness,role:roles(mesh,m)}))}));
 const presenter=new SignatureFinishPresenter(car),old=THREE.TextureLoader.prototype.loadAsync;
 THREE.TextureLoader.prototype.loadAsync=async()=>new THREE.Texture();
 try {
  assert.ok(originals.some(o=>o.mesh.name==='rear_arm_visual__Orange_Accent'));
  assert.ok(originals.some(o=>o.mesh.name==='shock_spring_visual__Orange_Accent'));
  for(const finish of Object.keys(SIGNATURE_ACCENTS)as SignatureFinish[]){
   await presenter.set(finish);
   for(const o of originals)for(const[i,s]of o.slots.entries()){
    const actual=materials(o.mesh)[i];
    if(s.role==='protected'){
     assert.equal(actual,s.ref,o.mesh.name);assert.ok(actual.color.equals(s.color),o.mesh.name);assert.equal(actual.map,s.map,o.mesh.name);
    }else{
     assert.notEqual(actual,s.ref,o.mesh.name);
     if(finish==='blue-orange'){
      assert.ok(actual.color.equals(s.color),o.mesh.name);assert.equal(actual.map,s.map,o.mesh.name);assert.equal(actual.roughness,s.roughness);
     }else if(s.role==='accent'){
      assert.equal(actual.color.getHexString(),SIGNATURE_ACCENTS[finish].slice(1),o.mesh.name);assert.equal(actual.map,null,o.mesh.name);
     }else assert.notEqual(actual.map,s.map,o.mesh.name);
    }
   }
   for(const o of originals){
    const peer=rival.getObjectByName(o.mesh.name)as THREE.Mesh;
    for(const[i,s]of o.slots.entries())assert.equal(materials(peer)[i],s.ref,'shared rival slot changed: '+o.mesh.name);
    for(const s of o.slots){assert.ok(s.ref.color.equals(s.color),o.mesh.name);assert.equal(s.ref.map,s.map,o.mesh.name)}
   }
  }
  presenter.dispose();for(const o of originals)assert.equal(o.mesh.material,o.material,'dispose identity: '+o.mesh.name);
 }finally{THREE.TextureLoader.prototype.loadAsync=old;presenter.dispose()}
});
test('Nested swingarm accent role is supported without claiming every orange part is body paint',async()=>{const shared=new THREE.MeshStandardMaterial({color:'#ed7023'});shared.name='P03A_Orange_Accent';const car=new THREE.Group(),arm=new THREE.Group();arm.name='rear_arm_visual';const child=new THREE.Mesh(new THREE.BufferGeometry(),shared);child.name='swingarm-painted-piece';arm.add(child);car.add(arm);const shock=new THREE.Mesh(new THREE.BufferGeometry(),shared);shock.name='shock_spring_visual__Orange_Accent';car.add(shock);const p=new SignatureFinishPresenter(car),old=THREE.TextureLoader.prototype.loadAsync;THREE.TextureLoader.prototype.loadAsync=async()=>new THREE.Texture();try{await p.set('white-graphite');assert.equal((child.material as THREE.MeshStandardMaterial).color.getHexString(),'56595e');assert.equal(shock.material,shared);assert.equal(shared.color.getHexString(),'ed7023')}finally{p.dispose();THREE.TextureLoader.prototype.loadAsync=old}});
test('Latest asynchronous finish wins; late completion after disposal cannot mutate restored source material',async()=>{const{car}=exportedFixture(),arm=car.getObjectByName('rear_arm_visual__Orange_Accent')as THREE.Mesh,source=arm.material,p=new SignatureFinishPresenter(car),old=THREE.TextureLoader.prototype.loadAsync,waiters:{url:string;resolve:(t:THREE.Texture)=>void}[]=[];THREE.TextureLoader.prototype.loadAsync=((url:string)=>new Promise<THREE.Texture>(resolve=>waiters.push({url,resolve})))as typeof old;try{const first=p.set('black-red'),second=p.set('white-graphite');assert.equal(waiters.length,2);const white=new THREE.Texture();waiters[1].resolve(white);await second;assert.equal(p.inspect().finish,'white-graphite');assert.equal((arm.material as THREE.MeshStandardMaterial).color.getHexString(),'56595e');waiters[0].resolve(new THREE.Texture());await first;assert.equal(p.inspect().finish,'white-graphite');assert.equal((arm.material as THREE.MeshStandardMaterial).color.getHexString(),'56595e');const late=p.set('graphite-red'),texture=new THREE.Texture();let disposed=false;texture.addEventListener('dispose',()=>{disposed=true});p.dispose();waiters[2].resolve(texture);await late;assert.equal(arm.material,source);assert.equal(disposed,true)}finally{p.dispose();THREE.TextureLoader.prototype.loadAsync=old}});
test('Showroom swatches and rendered finish accents use the same reviewed palette',()=>{assert.deepEqual(SIGNATURE_ACCENTS,{'blue-orange':'#f07521','black-red':'#c91820','white-graphite':'#56595e','graphite-red':'#c91820'});for(const finish of FINISHES)assert.equal(finish.accent,SIGNATURE_ACCENTS[finish.id])});
