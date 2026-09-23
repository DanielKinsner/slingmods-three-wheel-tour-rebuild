import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import * as THREE from 'three';
import {DriverPresenter, type DriverAttachment} from '../src/presentation/driver';
import {riderAssetURL, riderAttachmentURL, BIKER_RIDER_URL, TOUR_RIDER_URL, LEGACY_RIDER_URL} from '../src/presentation/rider-asset';
import type {VehicleTelemetry} from '../src/simulation';
import {setPerfLegacy} from '../src/presentation/perf-switches';

const BIKER = 'public' + BIKER_RIDER_URL;
const json = (file: string) => {const b = readFileSync(file); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());};
// Shipped joints and control hierarchy only; textures are irrelevant to fit.
function hierarchy(file: string) {
 const g = json(file), joints = new Set<number>(g.skins?.flatMap((s: any) => s.joints) ?? []);
 const nodes = g.nodes.map((n: any, i: number) => {
  const o = joints.has(i) ? new THREE.Bone() : new THREE.Object3D(); o.name = n.name ?? ''; o.userData = n.extras ?? {};
  if (n.translation) o.position.fromArray(n.translation); if (n.rotation) o.quaternion.fromArray(n.rotation); if (n.scale) o.scale.fromArray(n.scale);
  if (n.matrix) new THREE.Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale);
  return o;
 });
 g.nodes.forEach((n: any, i: number) => n.children?.forEach((c: number) => nodes[i].add(nodes[c])));
 const root = new THREE.Group(); g.scenes[g.scene ?? 0].nodes.forEach((i: number) => root.add(nodes[i])); return root;
}
// Each vehicle's real control motion: the Slingshot wheel turns 10x steer about its column (hero.ts),
// Ryker and Spyder bars turn by the steer angle itself about their own steering axes.
const VEHICLES = {
 slingshot: {visual: '2026', glb: 'public/assets/model02/slingshot-2026.glb', axis: new THREE.Vector3(0, 0, 1), scale: 10, steer: .06},
 ryker: {visual: 'ryker', glb: 'public/assets/ryker/complete/ryker-900-complete.glb', axis: new THREE.Vector3(0, .968, -.251).normalize(), scale: 1, steer: .6},
 spyder: {visual: 'spyder', glb: 'public/assets/spyder/spyder-f3.glb', axis: new THREE.Vector3(0, 1, 0), scale: 1, steer: .6},
} as const;

for(const [name,v]of Object.entries(VEHICLES))test(`targeted rider matrices match the full ${name} hierarchy across steering and cockpit poses`,()=>{
 const config:DriverAttachment=JSON.parse(readFileSync(`public/assets/drivers/biker/fit-${name}.json`,'utf8'));
 const rider=hierarchy(BIKER),model=hierarchy(v.glb),vehicle=new THREE.Group();vehicle.add(model,rider);rider.position.fromArray(config.rootOffset!);
 const wheel=model.getObjectByName('steering_control')!,base=wheel.quaternion.clone(),driver=new DriverPresenter(rider,vehicle,wheel,config);
 let carVisits=0;model.traverse(o=>{const original=o.updateWorldMatrix;o.updateWorldMatrix=function(...args){carVisits++;return original.apply(this,args)}});
 const matrices=()=>{const result:number[][]=[];rider.traverse(o=>result.push(o.matrixWorld.toArray()));return result};
 try{for(const f of [-1,-.5,0,.5,1]){
  vehicle.position.set(f*40,1+f*.2,-f*15);vehicle.rotation.set(.07*f,.6*f,-.1*f);
  wheel.quaternion.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(v.axis,f*v.steer*v.scale));
  const t={speed:8,steer:f*v.steer,throttle:.3,brake:0} as VehicleTelemetry,cockpit=f===0;
  setPerfLegacy('legacy-rider');carVisits=0;const old=structuredClone(driver.update(t,0,cockpit,true)),oldMatrices=matrices(),oldVisits=carVisits;
  setPerfLegacy('');carVisits=0;const next=structuredClone(driver.update(t,0,cockpit,true));
  assert.deepEqual(next,old);assert.deepEqual(matrices(),oldMatrices,'same rendered bone matrices');
  assert.ok(carVisits<oldVisits*.8,`${name}: ${carVisits} targeted visits versus ${oldVisits} full-hierarchy visits`);
 }}finally{setPerfLegacy('')}
});

for(const [name,v]of Object.entries(VEHICLES))test(`moving ${name} rider preserves IK and regrip history through matrix reuse`,()=>{
 const make=()=>{const config=JSON.parse(readFileSync(`public/assets/drivers/biker/fit-${name}.json`,'utf8')),rider=hierarchy(BIKER),model=hierarchy(v.glb),vehicle=new THREE.Group();
  // Independent presenters normally get different idle phases. Isolate the IK comparison from that deliberate variation.
  rider.getObjectByName('driver_root')!.userData.riderMotionVersion=0;vehicle.add(model,rider);rider.position.fromArray(config.rootOffset);
  const wheel=model.getObjectByName('steering_control')!,base=wheel.quaternion.clone(),driver=new DriverPresenter(rider,vehicle,wheel,config);return{rider,vehicle,wheel,base,driver};};
 const old=make(),next=make();
 try{for(let f=0;f<180;f++){
  const steer=Math.sin(f*.1)*(v.scale===10?.5:.6),t={speed:12+Math.sin(f*.05)*7,steer,throttle:.4,brake:0} as VehicleTelemetry;
  const results=[];for(const [i,s]of [old,next].entries()){
   setPerfLegacy(i?'':'legacy-rider');s.vehicle.position.set(f*.04,1+Math.sin(f*.01)*.05,-f*.1);s.vehicle.rotation.set(.06*Math.sin(f*.03),f*.01,-.07*Math.cos(f*.02));s.wheel.quaternion.copy(s.base).multiply(new THREE.Quaternion().setFromAxisAngle(v.axis,steer*v.scale));
   const report=structuredClone(s.driver.update(t,1/60,f%50<10,f===0||f===110)),matrices:number[][]=[];s.rider.traverse(o=>matrices.push(o.matrixWorld.toArray()));results.push({report,matrices});
  }
  assert.deepEqual(results[1],results[0],`frame ${f}`);
 }}finally{setPerfLegacy('')}
});

test('the purchased biker is the default rider on every current vehicle; earlier riders stay reachable', () => {
 for (const [name, v] of Object.entries(VEHICLES)) {
  assert.equal(riderAssetURL(`?visual=${v.visual}`), BIKER_RIDER_URL);
  assert.equal(riderAttachmentURL(v.visual, ''), `/assets/drivers/biker/fit-${name}.json`);
 }
 assert.equal(riderAssetURL('?visual=spyder&rider=tour'), '/assets/spyder/spyder-rider.glb');
 assert.equal(riderAttachmentURL('spyder', '?rider=tour'), '/assets/spyder/driver-attachment.json');
 assert.equal(riderAssetURL('?visual=josh'), TOUR_RIDER_URL, 'comparison visuals keep the rider their seat was fitted for');
 assert.equal(riderAttachmentURL('josh', ''), '/assets/drivers/test-driver-attachment.json');
 assert.equal(riderAssetURL('?rider=legacy'), LEGACY_RIDER_URL);
});

test('biker GLB honours the rider contract, stays web-sized and carries no source tool metadata', () => {
 const g = json(BIKER), names = new Set(g.nodes.map((n: any) => n.name));
 for (const n of ['driver_root', 'driver_rig', 'driver_body_visual', 'driver_head_visual', 'driver_pelvis', 'driver_spine', 'driver_head',
  ...['left', 'right'].flatMap(s => ['upper_arm', 'forearm', 'hand', 'thigh', 'shin', 'foot', 'index3', 'thumb3'].map(b => `driver_${b}_${s}`))]) assert.ok(names.has(n), n);
 assert.equal(g.nodes.find((n: any) => n.name === 'driver_root').extras.riderMotionVersion, 1);
 for (const mesh of ['driver_body_visual', 'driver_head_visual']) assert.notEqual(g.nodes.find((n: any) => n.name === mesh).skin, undefined, mesh + ' is skinned');
 assert.doesNotMatch(JSON.stringify(g.nodes), /flip_fluid|arp_|address=/);
 const tris = g.meshes.flatMap((m: any) => m.primitives).reduce((t: number, p: any) => t + g.accessors[p.indices].count / 3, 0);
 assert.ok(tris < 40000, `${tris} triangles`);
 assert.ok(statSync(BIKER).size < 3e6, 'rider GLB under 3 MB');
});

for (const [name, v] of Object.entries(VEHICLES)) test(`biker fit keeps hands on the ${name} control and feet planted across the steering range`, () => {
 const config: DriverAttachment = JSON.parse(readFileSync(`public/assets/drivers/biker/fit-${name}.json`, 'utf8'));
 const g = json(BIKER), joints = g.skins[0].joints.map((i: number) => g.nodes[i].name);
 for (const j of joints) assert.ok(config.restPose?.[j], `restPose covers ${j}`);
 const rider = hierarchy(BIKER), model = hierarchy(v.glb), vehicle = new THREE.Group();
 vehicle.rotation.set(.1, .6, -.07); vehicle.add(model, rider); rider.position.fromArray(config.rootOffset!); vehicle.updateMatrixWorld(true);
 const wheel = model.getObjectByName('steering_control')!, base = wheel.quaternion.clone();
 const driver = new DriverPresenter(rider, vehicle, wheel, config);
 // At rest the fitted pose already puts each wrist exactly on its IK target.
 for (const a of Object.values(config.arms)) {
  const target = wheel.localToWorld(new THREE.Vector3().fromArray(a.wheelGripLocal));
  assert.ok(rider.getObjectByName(a.handBone)!.getWorldPosition(new THREE.Vector3()).distanceTo(target) < .001, `${a.handBone} rests on its grip`);
 }
 const worst: Record<string, number> = {};
 for (const f of [0, .25, .5, .75, 1, -.25, -.5, -.75, -1]) {
  const steer = f * v.steer;
  wheel.quaternion.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(v.axis, steer * v.scale));
  const report = driver.update({speed: 8, steer, throttle: .3, brake: 0} as VehicleTelemetry, 1 / 60, false, f === 0);
  for (const [side, arm] of Object.entries(report.arms as Record<string, {gap: number}>)) worst[side] = Math.max(worst[side] ?? 0, arm.gap);
  for (const [side, foot] of Object.entries(report.feet as Record<string, {gap: number}>)) assert.ok(foot.gap < .002, `${side} foot stays planted (${(foot.gap * 1000).toFixed(1)} mm)`);
 }
 if (process.env.BIKER_DIAG) console.log(name, worst);
 for (const [side, gap] of Object.entries(worst)) assert.ok(gap < .004, `${side} hand leaves the ${name} control by ${(gap * 1000).toFixed(1)} mm at full lock`);
});
