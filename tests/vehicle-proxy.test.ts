import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {VehicleProxy,PROXY_FAR_METRES,PROXY_NEAR_METRES,STAND_IN_LAYER} from '../src/presentation/vehicle-proxy';
function car(){
 const root=new THREE.Group(),wheel=new THREE.Group();wheel.name='front_left_spin';root.add(wheel);
 const opaque=(name:string,colour:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({name,color:colour}));m.castShadow=true;return m};
 const body=[opaque('body_a',0xff0000),opaque('body_b',0x00ff00)];body.forEach(m=>root.add(m));const tyre=opaque('tyre',0x111111);wheel.add(tyre);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({name:'glass',transparent:true,opacity:.3}));root.add(glass);
 const lamp=opaque('tail',0xff0000);lamp.userData.lamp=true;root.add(lamp);
 const hiddenStock=new THREE.Group();hiddenStock.visible=false;hiddenStock.add(opaque('stock_nose',0x333333));root.add(hiddenStock);
 return {root,wheel,body,tyre,glass,lamp};
}
test('a rival swaps to one baked mesh per moving body beyond the far distance, with hysteresis, keeping lamps',()=>{
 const c=car(),proxy=new VehicleProxy(c.root,o=>o.name.endsWith('_spin'),m=>!!m.userData.lamp);
 assert.deepEqual(proxy.report,{proxied:3,dropped:1,kept:1,proxies:2},'body + wheel proxies; glass dropped; lamp kept; hidden stock part ignored');
 assert.equal(proxy.update(PROXY_FAR_METRES-1),false);assert.ok(c.body.every(m=>m.visible));
 assert.equal(proxy.update(PROXY_FAR_METRES+1),true);assert.ok([...c.body,c.tyre,c.glass].every(m=>!m.visible));assert.ok(c.lamp.visible,'brake/tail lamp stays');
 assert.equal(c.wheel.children.filter(o=>o.userData.distanceProxy&&o.visible).length,1,'the wheel proxy rides on the spinning node');
 assert.equal(proxy.update((PROXY_NEAR_METRES+PROXY_FAR_METRES)/2),true,'no flicker between the two thresholds');
 assert.equal(proxy.update(PROXY_NEAR_METRES-1),false);assert.ok([...c.body,c.tyre,c.glass].every(m=>m.visible));
 proxy.dispose();assert.equal(c.root.getObjectsByProperty('name','rival_distance_proxy').length,0);
});
test('the player-car stand-in casts the shadow and fills puddles while the full car stays in view',()=>{
 const c=car(),mask=(1<<STAND_IN_LAYER)|(1<<1),proxy=new VehicleProxy(c.root,o=>o.name.endsWith('_spin'),m=>!!m.userData.lamp).standIn(mask);
 const stand=c.root.getObjectsByProperty('name','rival_distance_proxy');assert.equal(stand.length,2);
 assert.ok(stand.every(p=>p.visible&&p.layers.mask===mask&&!p.layers.test(new THREE.Layers())),'never on the main-view layer');
 assert.ok([...c.body,c.tyre].every(m=>m.visible&&!m.castShadow&&m.userData.reflectionExclude),'full parts stay visible, stop casting, leave puddles');
 assert.ok(c.lamp.castShadow&&!c.lamp.userData.reflectionExclude,'lamps untouched');
 assert.equal(proxy.update(1000),false,'a stand-in never swaps with distance');
 proxy.dispose();assert.ok([...c.body,c.tyre].every(m=>m.castShadow&&!m.userData.reflectionExclude),'dispose restores shadows and reflections');
});
