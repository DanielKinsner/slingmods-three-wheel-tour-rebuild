import {test} from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import {SAVE_KEY,freshSave,loadSave,writeSave,decodeSave} from '../src/save.ts';
test('new save round-trip touches only the new namespace',()=>{
 const data=new Map([['legacy-game','do not alter'],['unrelated-setting','42']]);
 const reads:string[]=[];const storage={getItem:(k:string)=>{reads.push(k);return data.get(k)??null},setItem:(k:string,v:string)=>{data.set(k,v)}};
 const s=freshSave();s.settings.camera='far';writeSave(storage,s);assert.deepEqual(loadSave(storage),s);
 assert.deepEqual(reads,[SAVE_KEY]);assert.equal(data.get('legacy-game'),'do not alter');assert.equal(data.get('unrelated-setting'),'42');assert.equal(data.size,3);
});
test('malformed or future schemas fall back without reading legacy data',()=>{for(const raw of ['{','null','{"version":99}','{"version":1,"vehicleId":"wrong"}'])assert.deepEqual(decodeSave(raw),freshSave())});
test('actual Rapier world falls onto a collider and settles',async()=>{
 await RAPIER.init();const w=new RAPIER.World({x:0,y:-9.81,z:0});w.timestep=1/60;
 w.createCollider(RAPIER.ColliderDesc.cuboid(10,.1,10).setTranslation(0,-.1,0));
 const b=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,2,0));w.createCollider(RAPIER.ColliderDesc.ball(.25),b);
 for(let i=0;i<180;i++)w.step();assert.ok(Math.abs(b.translation().y-.25)<.02);assert.ok(Math.abs(b.linvel().y)<.05);w.free();
});
