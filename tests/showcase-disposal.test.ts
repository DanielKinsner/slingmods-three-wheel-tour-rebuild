import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {disposeShowcaseBay} from '../src/presentation/showcase';

test('owned room teardown releases shared geometry, materials and channel textures once, and is idempotent',()=>{
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 const geometry=new THREE.BoxGeometry(),map=new THREE.Texture();
 const a=new THREE.MeshStandardMaterial({map,roughnessMap:map}),b=new THREE.MeshStandardMaterial({map});
 root.add(new THREE.Mesh(geometry,a),new THREE.Mesh(geometry,[a,b]));
 const counts={geometry:0,a:0,b:0,map:0};
 for(const[key,item]of Object.entries({geometry,a,b,map}))item.addEventListener('dispose',()=>counts[key as keyof typeof counts]++);
 disposeShowcaseBay(root);disposeShowcaseBay(root);
 assert.equal(root.parent,null);assert.deepEqual(counts,{geometry:1,a:1,b:1,map:1});
});
