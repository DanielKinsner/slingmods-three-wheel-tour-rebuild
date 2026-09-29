import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {orbitMove,sampleOrbit} from '../src/presentation/camera-orbit';
import {RECOVERY_LABELS} from '../src/driving/recovery';
import {InputResolver} from '../src/driving/input';
import {readFileSync} from 'node:fs';

const car=new THREE.Vector3(0,.6,0);
const pathOf=(m:ReturnType<typeof orbitMove>)=>Array.from({length:41},(_,i)=>{const p=new THREE.Vector3(),t=new THREE.Vector3();const s=sampleOrbit(m,m.start+m.duration*i/40,p,t);return{p,t,fov:s.fov,done:s.done}});

test('camera orbit: front to rear swings around the car instead of through it',()=>{
 const front=new THREE.Vector3(0,1.4,-5.5).add(car),rear=new THREE.Vector3(3.4,1.7,5).add(car);
 const m=orbitMove(front,rear,car,car,38,38,0),path=pathOf(m);
 const straight=Math.min(...Array.from({length:41},(_,i)=>front.clone().lerp(rear,i/40).distanceTo(car)));
 const closest=Math.min(...path.map(s=>s.p.distanceTo(car)));
 assert.ok(straight<3,'the old straight line passed close to the car');assert.ok(closest>5.4,'the orbit keeps its distance');
 assert.ok(path.at(-1)!.p.distanceTo(rear)<1e-6&&path.at(-1)!.done,'lands exactly on the preset');
 assert.ok(m.lift>0,'a long swing lifts a little over the car');
});

test('camera orbit: time scales with travel, the lens eases, and it turns the short way round',()=>{
 const t=car.clone(),a=new THREE.Vector3(5,1,0).add(t),near=new THREE.Vector3(4.9,1,1).add(t),far=new THREE.Vector3(-5,1,.2).add(t);
 const small=orbitMove(a,near,t,t,38,38,0),big=orbitMove(a,far,t,t,38,38,0);
 assert.ok(small.duration<big.duration&&small.duration>=450&&big.duration<=1150);
 const lens=orbitMove(a,near,t,t,38,52,0),mid=sampleOrbit(lens,lens.duration/2,new THREE.Vector3(),new THREE.Vector3());
 assert.ok(mid.fov>40&&mid.fov<50,'the lens changes during the move, not in one jump');
 const wrap=orbitMove(new THREE.Vector3(Math.sin(3),0,Math.cos(3)).multiplyScalar(5),new THREE.Vector3(Math.sin(-3),0,Math.cos(-3)).multiplyScalar(5),new THREE.Vector3(),new THREE.Vector3(),38,38,0);
 assert.ok(Math.abs(wrap.azimuth[1]-wrap.azimuth[0])<.3,'about 16 degrees across the back, not 344 the long way');
});

test('camera orbit: diving into the cockpit arcs over the car',()=>{
 const hero=new THREE.Vector3(-4,1.9,-4.8).add(car),seat=new THREE.Vector3(-.72,1.42,.22),look=new THREE.Vector3(-.1,.71,-.33);
 const m=orbitMove(hero,seat,car,look,38,38,0),path=pathOf(m);
 assert.ok(m.lift>.15,'closing in adds lift');
 const midHeight=path[20].p.y,straightMid=hero.clone().lerp(seat,.5).y;assert.ok(midHeight>straightMid,'comes in from above, not through the bodywork');
});

test('crew recovery: every stuck reason has a card headline; the hold starts empty',()=>{
 for(const reason of['Car overturned','Below the road','Stranded off the course','Car stuck without tire support'])assert.ok(RECOVERY_LABELS[reason],reason);
 const input=new InputResolver('sport-v5' as never);assert.equal(input.resetHold,0);input.reset();assert.equal(input.resetHold,0,'a reset leaves the ring empty');
});

test('crew recovery: the hidden card is really hidden (its display rule would otherwise override [hidden])',()=>{
 const css=readFileSync('src/game/race.css','utf8');assert.match(css,/\.gx-recovery\{[^}]*display:grid/);assert.ok(css.includes('.gx-recovery[hidden]{display:none}'));
});
