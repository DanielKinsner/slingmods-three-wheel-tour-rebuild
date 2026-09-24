import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {finishRiderKit} from '../src/presentation/rider-kit';
test('biker gets gloves, a balaclava and calmer leather once; other riders are untouched',()=>{
 const mk=(name:string)=>{const m=new THREE.MeshStandardMaterial({name,map:new THREE.Texture(),normalMap:new THREE.Texture()});return m};
 const hands=mk('Biker_Skin_Hands'),head=mk('Biker_Skin_Head'),leather=mk('Biker_Leather'),other=mk('Tour_Suit');leather.normalScale.set(1,1);
 const root=new THREE.Group();for(const m of[hands,head,leather,other])root.add(new THREE.Mesh(new THREE.BoxGeometry(),m));
 finishRiderKit(root);finishRiderKit(root);
 assert.equal(hands.map,null);assert.ok(hands.color.r<.05,'black gloves');assert.equal(head.map,null);assert.equal(head.normalMap,null);assert.ok(head.roughness>.8,'knit balaclava');
 assert.ok(Math.abs(leather.normalScale.x-.45)<1e-9,'calmed once, not twice');assert.ok(other.map&&other.normalMap,'non-biker materials untouched');
});
