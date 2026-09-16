import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {visibleBounds,fitSafeCamera,ResultCamera} from '../src/presentation/safe-camera';
import {boundsCorners} from '../src/presentation/inspection';
import {tachRatio,displayedGear} from '../src/signature/race-instruments';
import {DRIVETRAIN} from '../src/simulation/drivetrain';

test('Hero fit contains every real corner inside measured UI safe space at all desktop sizes',()=>{
 const bounds=new THREE.Box3(new THREE.Vector3(-1,0,-2.2),new THREE.Vector3(1,1.4,1.8));
 for(const [w,h] of [[1280,720],[1366,768],[1920,1080],[2560,1440]]){
  const c=new THREE.PerspectiveCamera(38,w/h,.06,80),r={left:w*.18,top:104,right:w*.75,bottom:h-150};
  fitSafeCamera(c,bounds,new THREE.Vector3(5,1.65,-6),r,w,h);
  for(const corner of boundsCorners(bounds)){const p=corner.project(c),x=(p.x+1)*w/2,y=(1-p.y)*h/2;assert.ok(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom,JSON.stringify({w,h,p,r}));}
  assert.equal(c.fov,38);
 }
});
test('Hidden attachments and light volumes cannot pull the result camera away from the visible car',()=>{
 const root=new THREE.Group(),car=new THREE.Mesh(new THREE.BoxGeometry(2,1.4,4)),hidden=new THREE.Group();
 hidden.visible=false;hidden.add(new THREE.Mesh(new THREE.BoxGeometry(100,100,100)));root.add(car,hidden,new THREE.PointLight());root.position.set(80,30,-40);root.rotation.y=.8;
 const box=visibleBounds(root);assert.deepEqual(box,new THREE.Box3().setFromObject(car));
 const c=new THREE.PerspectiveCamera(48,16/9,.1,1000),view=new ResultCamera(c),position=root.position.clone(),rotation=root.quaternion.clone();
 view.update(root,true,1920,1080);assert.ok(c.view?.enabled);assert.deepEqual(root.position,position);assert.deepEqual(root.quaternion.toArray(),rotation.toArray());
 view.update(root,false,1920,1080);assert.equal(c.view?.enabled,false);
});
test('Instruments use the retained drivetrain redline and explicit reverse/neutral gears',()=>{
 assert.equal(tachRatio(DRIVETRAIN.redline),1);assert.equal(tachRatio(DRIVETRAIN.redline/2),.5);assert.equal(tachRatio(-100),0);assert.equal(tachRatio(99999),1);
 assert.equal(displayedGear(-1),'R');assert.equal(displayedGear(0),'N');assert.equal(displayedGear(5),'5');
});
