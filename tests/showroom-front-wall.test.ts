import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {closeShowroomFront,SHOWROOM_FRONT_WALL_Z} from '../src/presentation/showroom-front-wall';
import {SHOWROOM_SAFE_VOLUME} from '../src/presentation/showroom-camera';
const room=(names:string[])=>{const r=new THREE.Group();for(const n of names){const m=new THREE.MeshStandardMaterial();m.name=n;r.add(new THREE.Mesh(new THREE.BoxGeometry(),m))}return r};
test('showroom front closure sits behind every camera position and reuses the room materials',()=>{
 const r=room(['studio_warm_white','studio_charcoal_tile','studio_slingmods_red','SlingMods_authorized_logo','studio_graphite_cabinet']);
 const g=closeShowroomFront(r)!;assert.ok(g);g.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(g.getObjectByName('front_end_wall')!);
 assert.ok(box.max.z<SHOWROOM_SAFE_VOLUME.min.z-.5,'end wall clears the camera volume by >0.5 m');
 assert.ok(SHOWROOM_FRONT_WALL_Z<SHOWROOM_SAFE_VOLUME.min.z);
 const used=new Set<string>();g.traverse(o=>{if(o instanceof THREE.Mesh)used.add((o.material as THREE.Material).name)});
 assert.deepEqual([...used].sort(),['SlingMods_authorized_logo','studio_charcoal_tile','studio_graphite_cabinet','studio_slingmods_red','studio_warm_white']);
});
test('showroom front closure is skipped, not faked, when the room materials are missing',()=>{
 const r=room(['something_else']);assert.equal(closeShowroomFront(r),undefined);assert.equal(r.getObjectByName('showroom_front_closure'),undefined);
});
