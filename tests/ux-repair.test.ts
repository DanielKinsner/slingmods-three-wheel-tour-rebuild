import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';
import {nextCareerStep,careerStepHref,freshOwnBuild} from '../src/career-experience/model';
import {freshCareer,type Career} from '../src/career/store';
import {SHOWROOM_ROOM,SHOWROOM_SAFE_VOLUME,SHOWROOM_CLEARANCE,SHOWROOM_PRESETS,containCamera,exitDistance,limitOrbit,snapshotCamera} from '../src/presentation/showroom-camera';
import {TRANSFER_SCENES,sceneOf} from '../src/career/transfer';
import {visitorSearch} from '../src/demo/profile';
import {gameHeader} from '../src/signature/header';

const career=(patch:(s:Career)=>void)=>{const s=freshCareer();s.revision=3;patch(s);return s};
const chapterOneDone=()=>career(s=>{s.credits=1500;s.chapters={entry:true,firstCompletion:true,firstBuild:true};s.buildMatters.duelCompleted=true;s.crew={invitationSeen:true,completed:true,bestPlace:2,cleared:true,clearAcknowledged:true}});

test('UX-05: one resolver answers Continue for every career stage, never an optional purchase',()=>{
 assert.equal(nextCareerStep(null).kind,'start');assert.equal(nextCareerStep(freshCareer()).kind,'start');
 assert.equal(nextCareerStep(career(()=>{})).kind,'shakedown');
 assert.equal(nextCareerStep(career(s=>{s.chapters.firstCompletion=true})).kind,'duel');
 const crew=nextCareerStep(career(s=>{s.chapters.firstCompletion=true;s.buildMatters.duelCompleted=true;s.credits=2000}));
 assert.equal(crew.kind,'crew','funds for the suspension never turn Continue into a shop visit');assert.equal(crew.scene,'bay');
 // The audit case: Chapter 01 complete, 1500 credits, no suspension -> Chapter 02, not the shop, not the crew race.
 const next=nextCareerStep(chapterOneDone());assert.deepEqual([next.chapter,next.scene,next.kind,next.event],[2,'career','event','open-it-up']);assert.equal(careerStepHref(next),'?scene=career&play=career');
 // Earlier-version crew access advances too.
 assert.equal(nextCareerStep(career(s=>{s.chapters.firstCompletion=true;s.buildMatters.legacyCrewAccess=true})).event,'open-it-up');
 const done=chapterOneDone();done.ownBuild.completed['open-it-up']=true;assert.equal(nextCareerStep(done).event,'hold-your-nerve');
 done.ownBuild.completed['hold-your-nerve']=true;assert.equal(nextCareerStep(done).event,'coastline-cup');
 const resume=chapterOneDone();resume.ownBuild.active={version:1,id:'44444444-4444-4444-8444-444444444444',event:'open-it-up',competitionId:'p09a-open-it-up-express-v1',route:'express',routeVersion:'express-layout-v1',handlingProfile:'slingmods-sport-v5',laps:1,participants:['player'],recipe:{} as never,cupId:null,stage:0,status:'prepared'};
 assert.equal(nextCareerStep(resume).kind,'resume','a saved race entry comes first');
 assert.equal(careerStepHref(nextCareerStep(career(()=>{})),'demo'),'?scene=bay&play=demo');
 assert.equal(freshOwnBuild().active,null);
});

test('UX-03/04: the measured safe volume keeps clearance from every closed face of the shipped room',()=>{
 const v=SHOWROOM_SAFE_VOLUME,c=SHOWROOM_CLEARANCE-1e-9;
 assert.ok(SHOWROOM_ROOM.sideWall-v.max.x>=c&&v.min.x+SHOWROOM_ROOM.sideWall>=c,'side walls');
 assert.ok(SHOWROOM_ROOM.backFixtures-v.max.z>=c,'back cabinets');assert.ok(SHOWROOM_ROOM.softbox-v.max.y>=c,'softbox / open top');assert.ok(v.min.y-SHOWROOM_ROOM.floor>=.2-1e-9,'floor');
 assert.ok(v.max.y<SHOWROOM_ROOM.wallTop,'never above the 4.2 m walls of the open-top set');
});

test('UX-04: the audit counterexample (storage target, radius 10, polar 0.35) is pulled back inside along its own ray',()=>{
 const camera=new THREE.PerspectiveCamera(38,16/9,.06,80),target=new THREE.Vector3(-.22,.43,1);
 camera.position.setFromSphericalCoords(10,.35,Math.PI).add(target);assert.ok(camera.position.y>9.8,'reproduces the 9.82 m position');
 const direction=camera.position.clone().sub(target).normalize();assert.equal(containCamera(camera,target),true);
 assert.ok(SHOWROOM_SAFE_VOLUME.containsPoint(camera.position));assert.ok(camera.position.y<=3.5+1e-9);
 assert.ok(camera.position.clone().sub(target).normalize().distanceTo(direction)<1e-9,'view direction unchanged');
 // A camera already inside is untouched; a target outside is clamped inside first.
 const inside=camera.position.clone();assert.equal(containCamera(camera,target),false);assert.ok(camera.position.equals(inside));
 const stray=new THREE.Vector3(0,9,0);containCamera(camera,stray);assert.ok(SHOWROOM_SAFE_VOLUME.containsPoint(stray));
});

test('UX-03/09: orbit limits agree with the room for every direction, so fitting and clamping never oscillate',()=>{
 const camera=new THREE.PerspectiveCamera(38,16/9,.06,80),target=new THREE.Vector3(0,.68,-.2),controls={object:camera,target,minDistance:3,maxDistance:10};
 for(let i=0;i<400;i++){const polar=.35+Math.random()*(Math.PI*.48-.35),azimuth=Math.random()*Math.PI*2;camera.position.setFromSphericalCoords(1,polar,azimuth).add(target);limitOrbit(controls,SHOWROOM_PRESETS.hero);
  assert.ok(controls.minDistance<=controls.maxDistance);const end=target.clone().add(camera.position.clone().sub(target).normalize().multiplyScalar(controls.maxDistance));assert.ok(SHOWROOM_SAFE_VOLUME.distanceToPoint(end)<1e-6,'max radius ends inside')}
 const d=new THREE.Vector3(1,0,0);assert.ok(Math.abs(exitDistance(new THREE.Vector3(0,1,0),d)-5.6)<1e-9);
});

test('UX-09: every named view starts inside the room, and close-ups are not pushed out by the orbit minimum',()=>{
 for(const [name,p]of Object.entries(SHOWROOM_PRESETS)){if(p.position)assert.ok(SHOWROOM_SAFE_VOLUME.containsPoint(new THREE.Vector3(...p.position)),name);assert.ok(p.minDistance<=p.maxDistance,name);if(p.position&&p.target)assert.ok(new THREE.Vector3(...p.position).distanceTo(new THREE.Vector3(...p.target))>=p.minDistance,name+' authored distance respects its own minimum')}
 const storage=SHOWROOM_PRESETS['SM-28919'];assert.ok(Math.abs(new THREE.Vector3(...storage.position!).distanceTo(new THREE.Vector3(...storage.target!))-2.2565)<1e-3);assert.ok(storage.minDistance<2.2565);
 assert.ok(SHOWROOM_PRESETS['SM-133'].target![1]<.3,'underglow inspection looks at the sill strip');
 const camera=new THREE.PerspectiveCamera(40,1,.06,80);camera.position.set(1,2,3);camera.setViewOffset(1600,900,-100,0,1600,900);const s=snapshotCamera(camera,new THREE.Vector3(0,.5,0),'front',true);assert.deepEqual([s.fov,s.view,s.manual,s.offset?.offsetX],[40,'front',true,-100]);
});

test('UX-01: temporary careers may travel to the free showroom; URLs for every page resolve to the scene main.ts opens',()=>{
 assert.ok((TRANSFER_SCENES as readonly string[]).includes('signature'));
 const at=(q:string)=>sceneOf(new URL('http://t.test/'+q));
 assert.equal(at(''),'signature');assert.equal(at('?screen=build'),'signature');assert.equal(at('?play=career'),'bay');assert.equal(at('?test=1'),'bay');assert.equal(at('?scene=career&play=career'),'career');
});

test('UX-07/12: return context and screen deep links survive the hosted build URL allowlist',()=>{
 assert.equal(visitorSearch('?scene=signature&screen=shop&from=career&junk=1'),'scene=signature&screen=shop&from=career');
 assert.equal(visitorSearch('?scene=express&route=harbor&mode=test&play=preview&look=night&back=garage'),'scene=express&play=preview&route=harbor&mode=test&look=night&back=garage');
 assert.equal(visitorSearch('?from=elsewhere&back=anywhere'),'');
});

test('UX-07/11: one header everywhere - Home is Home, Career is persistent and becomes the return path',()=>{
 const plain=gameHeader({current:'build'}),back=gameHeader({current:'shop',career:{label:'Continue Career',detail:'Chapter 02 · Open It Up',returning:true,returnLabel:'Return to career'}});
 assert.match(plain,/class="sig-brand" data-action="home"/);assert.doesNotMatch(plain,/data-action="back"/);
 assert.match(plain,/data-action="build" aria-current="page"/);assert.match(plain,/data-action="career"[^>]*>CAREER</);
 assert.match(back,/is-return/);assert.match(back,/RETURN TO CAREER/);assert.match(back,/data-action="shop" aria-current="page"/);
});
