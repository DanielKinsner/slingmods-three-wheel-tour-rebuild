import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {NativeCluster,dialAngle} from '../src/presentation/native-cluster';
import {displayValues} from '../src/presentation/instrument-values';
import {VehicleOptics,recolorRivalMaterial,decalTexture} from '../src/presentation/vehicle-materials';
import {SignatureFinishPresenter,SignatureProducts} from '../src/presentation/signature-art';
import {retailFitment} from '../src/signature/fitment';import {PRODUCTS,fits} from '../src/signature/catalog';
import {freshRecipe,validateRecipe,buildSummary} from '../src/signature/config';import {vehicleContext} from '../src/presentation/vehicle-context';
const raw=fs.readFileSync('public/assets/model02/slingshot-2026.glb'),g=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());
function asset(){const car=new THREE.Group(),nodes:THREE.Object3D[]=g.nodes.map((n:any)=>{const o=new THREE.Object3D();o.name=n.name;o.userData=n.extras??{};if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale)}return o});g.nodes.forEach((n:any,i:number)=>n.children?.forEach((j:number)=>nodes[i].add(nodes[j])));g.scenes[g.scene??0].nodes.forEach((i:number)=>car.add(nodes[i]));car.getObjectByName('native_cluster_lcd')!.removeFromParent();car.updateMatrixWorld(true);return car}
function semanticCar(){const car=new THREE.Group(),root=new THREE.Group();root.name='vehicle_root';root.userData.materialBindingsVersion=1;car.add(root);return car}
test('native cluster exports original separate needles, calibrated face marks, LCD mount and semantic clear lens',()=>{
 for(const kind of ['speed','rpm']){const n=g.nodes.find((n:any)=>n.name==='native_'+kind+'_needle');assert.equal(n.extras.instrumentKind,kind);assert.equal(n.children.length,1);const mesh=g.meshes[g.nodes[n.children[0]].mesh];assert.equal(g.accessors[mesh.primitives[0].indices].count,24);assert.equal(n.extras.scale[0][0],0)}
 assert.ok(!g.nodes.some((n:any)=>n.name==='Dash_5'));assert.ok(g.nodes.some((n:any)=>n.name==='Dash_6'));assert.ok(g.nodes.find((n:any)=>n.name==='native_cluster_lcd').extras.width>.09);
 const lens=g.materials.find((m:any)=>m.name==='Model02_instrument_clear_lens');assert.equal(lens.extras.vehicleRole,'clear-cover');assert.ok(lens.pbrMetallicRoughness.baseColorFactor[3]<.1);
 assert.ok(g.materials.every((m:any)=>m.extras?.vehicleRole));
 const speed=g.nodes.find((n:any)=>n.name==='native_speed_needle').extras.scale;assert.equal(dialAngle(0,speed),0);assert.ok(Math.abs(dialAngle(50,speed)-69*Math.PI/180)<1e-9);assert.ok(Math.abs(dialAngle(220,speed)-Math.PI)<1e-9);assert.equal(dialAngle(999,speed),Math.PI);
});
test('actual telemetry turns original needles on their own cap pivots, freezes on pause, resets and follows ignition',()=>{
 const car=asset(),cluster=new NativeCluster(car);car.position.set(8,3,-9);car.rotation.set(.1,1.2,.05);const telemetry={speed:50/2.23694,rpm:5000,gear:3,time:1};cluster.update(telemetry);
 let state=cluster.inspect();assert.equal(state.bound,true);assert.ok(Math.abs(state.needles[0].angle+69*Math.PI/180)<1e-8);assert.ok(Math.abs(state.needles[1].angle-Math.PI/2)<1e-8);assert.deepEqual(state.values,displayValues(telemetry));
 for(const kind of ['speed','rpm']){const n=car.getObjectByName('native_'+kind+'_needle')!;assert.ok(car.worldToLocal(n.getWorldPosition(new THREE.Vector3())).distanceTo(new THREE.Vector3().fromArray(n.userData.center))<1e-6)}
 cluster.update({...telemetry,speed:0,rpm:900});assert.deepEqual(cluster.inspect().needles,state.needles);cluster.update({...telemetry,speed:0,rpm:900,time:1.1});assert.ok(cluster.inspect().needles[0].value>0&&cluster.inspect().needles[0].value<50);
 cluster.setPower(false);cluster.update({...telemetry,time:1.2});assert.ok(cluster.inspect().needles.every(n=>n.angle===0));cluster.setPower(true);cluster.update({...telemetry,speed:-3,gear:-1,time:.1});state=cluster.inspect();assert.equal(state.values.gear,'R');assert.equal(state.values.speed,7);assert.ok(state.needles[0].angle<0);cluster.dispose();
 for(const kind of ['speed','rpm']){const n=car.getObjectByName('native_'+kind+'_needle')!;assert.ok(car.worldToLocal(n.getWorldPosition(new THREE.Vector3())).distanceTo(new THREE.Vector3().fromArray(n.userData.center))<1e-6)}
});
test('semantic player and rival materials protect clear optics, reflectors, interior, metal and rubber despite misleading names',async()=>{
 const car=semanticCar(),roles=['paint','accent','clear-cover','passive-reflector','interior','rubber','metal'];const originals=roles.map(role=>{const m=new THREE.MeshStandardMaterial({color:'#777777',emissive:'#000000',opacity:role==='clear-cover'?.08:1});m.name='paint_helmet_lens_light';m.userData.vehicleRole=role;const mesh=new THREE.Mesh(new THREE.BufferGeometry(),m);car.add(mesh);return{role,m,mesh}});const presenter=new SignatureFinishPresenter(car);
 for(const finish of ['black-red','white-graphite','graphite-red','blue-orange']as const){await presenter.set(finish);for(const {role,m,mesh}of originals.slice(2)){assert.equal(mesh.material,m,role);assert.equal(m.color.getHexString(),'777777')}}
 for(const {role,m}of originals){const copy=m.clone();recolorRivalMaterial(copy,'#123456','#987654',true);assert.equal(copy.color.getHexString(),role==='paint'?'123456':role==='accent'?'987654':'777777');assert.equal(copy.emissive.getHexString(),'000000');assert.equal(copy.opacity,m.opacity)}presenter.dispose();
});
test('native running and brake lights have distinct states; clear covers and passive reflectors never emit',()=>{
 const car=semanticCar(),meshes=['running-brake','brake','headlamp','clear-cover','passive-reflector'].map(role=>{const m=new THREE.MeshStandardMaterial();m.userData.vehicleRole=role;const o=new THREE.Mesh(new THREE.BufferGeometry(),m);car.add(o);return o}),originals=meshes.map(m=>m.material);const lights=new VehicleOptics(car,true);assert.deepEqual(lights.inspect().brakeEmission,[.55,0]);lights.update(1);assert.deepEqual(lights.inspect().brakeEmission,[3.5,3.5]);lights.update(0,false);assert.deepEqual(lights.inspect().brakeEmission,[0,0]);assert.equal(meshes[3].material,originals[3]);assert.equal(meshes[4].material,originals[4]);lights.dispose();meshes.forEach((m,i)=>assert.equal(m.material,originals[i]));
});
test('2026 retail support is separate from unchanged legacy preview, recipe and ownership keys',()=>{
 const recipe=freshRecipe(),context=vehicleContext('2026');for(const p of PRODUCTS){assert.equal(p.saveVehicleId,'slingshot-r-2024');assert.ok(fits(p,recipe).ok);recipe.products[p.id]=p.option;assert.equal(retailFitment(p.id,context,'wrong-option').state,'unknown')}
 assert.equal(retailFitment('SM-133').state,'supported');assert.equal(retailFitment('SM-3223').state,'supported');assert.equal(retailFitment('SM-28919').state,'supported');assert.equal(retailFitment('SM-26801').state,'conditional');assert.match(retailFitment('SM-26801').condition,/square/i);assert.equal(retailFitment('SM-7720').state,'unsupported');assert.equal(retailFitment('SM-7720',vehicleContext('legacy')).state,'supported');assert.equal(retailFitment('unknown').state,'unknown');
 assert.deepEqual(validateRecipe(JSON.parse(JSON.stringify(recipe))),recipe);assert.equal(recipe.vehicleId,'slingshot-r-2024');const summary=buildSummary(recipe),[compatible,experimental]=summary.split('EXPERIMENTAL / REFERENCE ONLY');assert.match(summary,/2026 Slingshot R/);assert.ok(!compatible.includes('Thermal'));assert.match(experimental,/Thermal/);assert.match(experimental,/Experimental game fit — reference product is for 2020–2024/);assert.match(experimental,/View reference product \(2020–2024\)/);
});
test('an empty stock exhaust anchor is not treated as visible exhaust geometry',()=>{
 const car=new THREE.Group(),stock=new THREE.Group(),source=new THREE.Group();stock.name='stock_exhaust';car.add(stock);for(const id of ['SM-7720','SM-26801','SM-28919']){const n=new THREE.Group();n.name='product_'+id;source.add(n)}const products=new SignatureProducts(car,source);products.set(['SM-7720']);assert.equal(stock.visible,true);assert.equal(products.inspect().stockExhaust.meshes,0);products.set([]);assert.equal(stock.visible,true);products.dispose();
});
import {DriverPresenter} from '../src/presentation/driver';
test('2026 driver leg bindings reach the native pedals without stretching or moving the shared driver source',()=>{
 const bytes=fs.readFileSync('public/assets/drivers/test-driver.glb'),driver=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),config=JSON.parse(fs.readFileSync('public/assets/model02/driver-attachment.json','utf8')),joints=new Set(driver.skins.flatMap((s:any)=>s.joints));
 const body=new THREE.Group(),nodes:THREE.Object3D[]=driver.nodes.map((n:any,i:number)=>{const o=joints.has(i)?new THREE.Bone():new THREE.Object3D();o.name=n.name;if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);return o});driver.nodes.forEach((n:any,i:number)=>n.children?.forEach((j:number)=>nodes[i].add(nodes[j])));driver.scenes[driver.scene??0].nodes.forEach((i:number)=>body.add(nodes[i]));body.position.fromArray(config.rootOffset);
 const car=asset(),root=new THREE.Group();root.add(car,body);const wheel=car.getObjectByName('steering_control')!,presenter=new DriverPresenter(body,root,wheel,config);
 for(const angle of [-.3,0,.3]){root.rotation.y=.8;wheel.rotateZ(angle);const report=presenter.update({speed:5,throttle:.5,brake:0}as any,1/60,false,true);for(const [side,foot]of Object.entries(report.feet)as [string,any][]){assert.ok(foot.gap<1e-5);assert.ok(new THREE.Vector3().fromArray(foot.ankle).distanceTo(new THREE.Vector3().fromArray(config.legs[side].ankle))<1e-5)}}
});

test('rival decals preserve repeated native UV sampling without changing the shared source pixels',()=>{
 const original={width:2,height:2},pixels={width:2,height:2},source=new THREE.Texture(original as any);source.wrapS=source.wrapT=THREE.RepeatWrapping;source.flipY=false;source.colorSpace=THREE.SRGBColorSpace;source.offset.set(.1,.2);source.repeat.set(1.1,.9);source.updateMatrix();const map=decalTexture(source,pixels as any);
 for(const p of [[.3,.6],[1.8,.4],[-.2,1.3]])assert.ok(map.transformUv(new THREE.Vector2(...p)).distanceTo(source.transformUv(new THREE.Vector2(...p)))<1e-10);
 assert.notEqual(map.source,source.source);assert.equal(source.image,original);assert.equal(map.image,pixels);map.dispose();source.dispose();
});
