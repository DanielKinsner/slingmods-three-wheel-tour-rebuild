import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {ProductPresenter} from '../src/presentation/product';import {defaultAppearance} from '../src/career/catalog';
test('Ryker Panther omits removed-grille strips and light emitters follow independent arm transforms',async()=>{
 const scene=new THREE.Scene(),chassis=new THREE.Group(),car=new THREE.Group(),vehicle=new THREE.Group(),foundation=new THREE.Group();foundation.name='ryker_foundation';vehicle.add(foundation);car.add(vehicle);chassis.add(car);scene.add(chassis);car.userData.rykerBody=true;
 const root=new THREE.Group(),arms=[0,3].map(i=>{const g=new THREE.Group();g.name='TricLED_mount_'+i;root.add(g);return g}),grille=[0,1].map(()=>{const g=new THREE.Group();g.userData.stockGrilleLight=true;root.add(g);return g});
 const p=await ProductPresenter.load({loadAsync:async()=>({scene:root})} as any,chassis,scene);
 try{p.set(true,defaultAppearance());assert.deepEqual(grille.map(g=>g.visible),[false,false]);const before=p.inspect().emitterWorld;arms[0].position.y=.06;p.update();const after=p.inspect().emitterWorld;assert.ok(Math.abs(after[0][1]-before[0][1]-.06)<1e-8);assert.deepEqual(after[1],before[1]);car.userData.rykerBody=false;p.set(true,defaultAppearance());assert.deepEqual(grille.map(g=>g.visible),[true,true]);p.set(false,defaultAppearance());assert.equal(p.inspect().lights,0)}finally{p.dispose()}
});
