import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {RiderMotion} from '../src/presentation/rider-motion';
import {riderAssetURL, BIKER_RIDER_URL, TOUR_RIDER_URL, LEGACY_RIDER_URL} from '../src/presentation/rider-asset';

function fixture(enabled=true,phase=0){
 const root=new THREE.Group(),semantic=new THREE.Group(),spine=new THREE.Bone(),head=new THREE.Bone();
 semantic.name='driver_root';semantic.userData.riderMotionVersion=enabled?1:undefined;
 spine.name='driver_spine';head.name='driver_head';root.add(semantic);semantic.add(spine);spine.add(head);
 const motion=new RiderMotion(root,phase);
 return {root,spine,head,motion,step(input={speed:0,steer:0,throttle:0,brake:0},dt=1/60,reset=false){spine.quaternion.identity();head.quaternion.identity();return {...motion.update(input,dt,reset)}}};
}
const idle={speed:0,steer:0,throttle:0,brake:0};

test('legacy rigs are byte-for-byte pose compatible and asset selection is read only',()=>{
 const f=fixture(false);for(let i=0;i<900;i++)f.step();
 assert.deepEqual(f.spine.quaternion.toArray(),[0,0,0,1]);assert.deepEqual(f.head.quaternion.toArray(),[0,0,0,1]);
 assert.equal(f.motion.trigger('look-left'),false);assert.equal(riderAssetURL('?rider=legacy'),LEGACY_RIDER_URL);assert.equal(riderAssetURL(''),BIKER_RIDER_URL);assert.equal(riderAssetURL('?rider=tour'),TOUR_RIDER_URL);
});
test('subtle breathing loops, stationary look triggers once and hands/root are never animated',()=>{
 const f=fixture();let min=Infinity,max=-Infinity,looks=0,last='none';
 for(let i=0;i<60*22;i++){
  const r=f.step();min=Math.min(min,r.breathing);max=Math.max(max,r.breathing);
  if(r.gesture!=='none'&&last==='none')looks++;last=r.gesture;
  assert.ok(Math.abs(r.headYaw)<=.201);assert.ok(Math.abs(r.headPitch)<.06);
 }
 assert.ok(min<-.0037&&max>.0037);assert.equal(looks,1);assert.deepEqual(f.root.position.toArray(),[0,0,0]);
});
test('look and acknowledgement settle smoothly when pulling away and cannot trigger at speed',()=>{
 const f=fixture();for(let i=0;i<120;i++)f.step();assert.equal(f.motion.trigger('look-left'),true);
 for(let i=0;i<70;i++)f.step();assert.ok(f.motion.report.headYaw>.17);
 const drive={speed:12,steer:0,throttle:.4,brake:0};let previous=f.motion.report.headYaw;
 for(let i=0;i<120;i++){const r=f.step(drive);assert.ok(Math.abs(r.headYaw-previous)<.025);previous=r.headYaw}
 assert.ok(Math.abs(previous)<.001);assert.equal(f.motion.trigger('acknowledge'),false);
 f.step(idle,0,true);for(let i=0;i<120;i++)f.step();assert.equal(f.motion.trigger('acknowledge'),true);
 let nod=0;for(let i=0;i<120;i++)nod=Math.max(nod,f.step().headPitch);assert.ok(nod>.03);assert.equal(f.motion.report.gesture,'none');
});
test('equal wall time at 30/60/144 Hz gives equivalent motion and reset/pause do not jump',()=>{
 const results=[];
 for(const hz of [30,60,144]){const f=fixture();for(let i=0;i<hz*5;i++)f.step({speed:20,steer:.4,throttle:.4,brake:0},1/hz);results.push({...f.motion.report});
 const before={...f.motion.report};assert.deepEqual(f.step({speed:20,steer:.4,throttle:.4,brake:0},0),before);
 const reset=f.step(idle,0,true);assert.equal(reset.headYaw,0);assert.equal(reset.breathing,0);assert.equal(reset.gesture,'none');assert.deepEqual(f.spine.quaternion.toArray(),[0,0,0,1]);}
 for(const r of results)for(const key of ['breathing','bodyRoll','bodyPitch','headYaw']as const)assert.ok(Math.abs(r[key]-results[0][key])<1e-8,key);
});
test('bad elapsed time and background gaps cannot explode motion or fire accumulated idle cues',()=>{
 const f=fixture();for(const dt of [NaN,Infinity,-1,1000]){const r=f.step(idle,dt);assert.ok(Object.values(r).filter(x=>typeof x==='number').every(Number.isFinite));assert.equal(r.gesture,'none');assert.ok(r.stoppedFor<=.101)}
});
test('phase offsets keep nearby riders from breathing and looking in unison',()=>{
 const a=fixture(true,0),b=fixture(true,1.2);for(let i=0;i<30;i++){a.step();b.step()}assert.ok(Math.abs(a.motion.report.breathing-b.motion.report.breathing)>.001);
});
function glb(file:string){const raw=readFileSync(file);return JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString())}
test('export preserves semantic bind transforms and budgets; head details hide together in cockpit',()=>{
 const old=glb('public/assets/drivers/test-driver.glb'),next=glb('public/assets/drivers/tour-rider/tour-rider.glb');
 for(const n of old.nodes.filter((n:any)=>old.skins.some((s:any)=>s.joints.includes(old.nodes.indexOf(n))))){
  const match=next.nodes.find((x:any)=>x.name===n.name);assert.ok(match,n.name);
  for(const field of ['translation','rotation','scale'])assert.deepEqual(match[field],n[field],n.name+' '+field);
 }
 assert.equal(next.materials.length,3);assert.equal(next.meshes.reduce((n:number,m:any)=>n+m.primitives.length,0),4);
 assert.equal(next.images.length,3);assert.ok(next.nodes.some((n:any)=>n.extras?.riderMotionVersion===1));
 assert.ok(next.nodes.some((n:any)=>n.name==='driver_head_visual'));assert.ok(next.nodes.some((n:any)=>n.name==='driver_body_visual'));
 const manifest=JSON.parse(readFileSync('public/assets/drivers/tour-rider/manifest.json','utf8'));
 assert.ok(manifest.bytes<5_000_000);assert.ok(manifest.triangles<45_000);assert.equal(manifest.textures.rgba8WithMipsMiB,16);
});
