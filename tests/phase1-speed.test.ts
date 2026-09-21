import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {pathToFileURL} from 'node:url';import * as THREE from 'three';
import {placeAlongRoute,offsetRoute} from '../src/presentation/place-route';
import {planTrackside,brakingPoints} from '../src/presentation/trackside';
import {planRoadDecals,racingLineOffset} from '../src/presentation/road-decals';
import {metresPerUV} from '../src/presentation/race-asphalt';
import {SpeedFeel,SPEED_FEEL} from '../src/presentation/speed-feel';
import {EXPRESS_ROUTE} from '../src/express/route';import {EXPRESS_TRACKSIDE,buildExpressRibbon} from '../src/express/presentation';
import {projectRoad} from '../src/course/environment';
import {speedDressingURLs} from '../src/presentation/p11-assets';import {driveAssetURLs,optionalDriveAssetURLs,warmOptionalAssets} from '../src/signature/drive-preparation';import {freshRecipe} from '../src/signature/config';
import type {VehicleTelemetry} from '../src/simulation';

const MPH=2.23694,wheels=(surface:string)=>[0,1,2].map(i=>({id:'w'+i,contact:true,surface}))as unknown as VehicleTelemetry['wheels'];
function telemetry(mph:number,extra:Partial<VehicleTelemetry>={}):VehicleTelemetry{const speed=mph/MPH;return{time:0,position:{x:0,y:0,z:0},quaternion:{x:0,y:0,z:0,w:1},velocity:{x:0,y:0,z:-speed},angularVelocity:{x:0,y:0,z:0},speed,rpm:3000,engineWheelAngularSpeed:0,gear:3,shifting:false,shiftRemaining:0,steer:0,throttle:1,brake:0,reversePending:false,wheels:wheels('asphalt'),...extra}}
function settle(feel:SpeedFeel,t:VehicleTelemetry,view:'near'|'far'|'cockpit'='near'){const camera=new THREE.PerspectiveCamera(42,16/9,.1,2000),target=new THREE.Vector3();for(let i=0;i<360;i++){camera.position.set(0,2.4,6);target.set(0,.85,-2);camera.fov=42;camera.up.set(0,1,0);camera.lookAt(target);feel.apply(camera,target,t,view,1/60,1440,i===0)}return{camera,target}}

test('typed route placement stays in step with the P11 helper it was ported from',async()=>{
 const original=await import(pathToFileURL('public/assets/p11/trackside-props/place-route.mjs').href),points=[{x:0,y:0,z:0},{x:0,y:1,z:40},{x:30,y:1,z:70},{x:60,y:0,z:70}];
 for(const options of[{spacing:7,offset:4},{spacing:12,offset:-6.5,closed:true,start:3}])assert.deepEqual(placeAlongRoute(points,options),original.placeAlongRoute(points,options));
 assert.throws(()=>placeAlongRoute(points,{spacing:0}));const pushed=offsetRoute(points,5);assert.ok(Math.abs(pushed[0].x+5)<1e-9&&Math.abs(pushed[0].z)<1e-9,'offset is to the same side the helper uses');
});
test('express trackside sits on the collision rail line and never inside the drivable road',()=>{
 const placements=planTrackside(EXPRESS_ROUTE,EXPRESS_TRACKSIDE),rail=EXPRESS_ROUTE.width/2+EXPRESS_ROUTE.runoff+.7,distance=(p:{x:number;z:number})=>projectRoad(EXPRESS_ROUTE,p.x,p.z).distance;
 const barriers=placements.filter(p=>/armco|jersey/.test(p.prop)),lights=placements.filter(p=>p.prop==='streetlight'),boards=placements.filter(p=>p.prop.startsWith('distance-')),fence=placements.filter(p=>p.prop==='catch-fence');
 assert.ok(barriers.length>900&&lights.length>90&&fence.length>100,'constant rhythm all the way round');assert.ok(barriers.some(p=>p.prop==='jersey-red-white')&&barriers.some(p=>p.prop==='armco-straight'));
 for(const p of barriers)assert.ok(Math.abs(distance(p)-rail)<.45,`barrier follows the rail (${distance(p).toFixed(2)} m)`);
 for(const p of[...lights,...fence])assert.ok(distance(p)>rail,'lights and fence stand behind the rail');
 for(const p of boards)assert.ok(distance(p)>EXPRESS_ROUTE.width/2+1,'countdown boards are off the asphalt');
 for(const p of barriers)assert.ok((p.stretch??1)>.75&&(p.stretch??1)<1.5,'segments are only gently stretched to close gaps');
 // Within 2-6 m of a racing line that uses the full width: rail minus the painted edge.
 assert.ok(rail-7.36>=2&&rail-7.36<=6);
 // Facing, from the kit's own axes: board text and barrier beam face local +Z, a streetlight's arm reaches out along local -Z.
 const inward=(p:{x:number;z:number})=>{const c=projectRoad(EXPRESS_ROUTE,p.x,p.z),n=Math.hypot(c.x-p.x,c.z-p.z);return[(c.x-p.x)/n,(c.z-p.z)/n]},front=(p:{yaw:number})=>[Math.sin(p.yaw),Math.cos(p.yaw)],dot=(a:number[],b:number[])=>a[0]*b[0]+a[1]*b[1];
 for(const p of lights)assert.ok(dot(front(p),inward(p))<-.9,'lamp arms reach over the road');
 for(const p of barriers.filter((_,i)=>i%25===0))assert.ok(dot(front(p),inward(p))>.9,'beam faces the road, posts behind');
 for(const p of boards){const c=projectRoad(EXPRESS_ROUTE,p.x,p.z),ahead=projectRoad(EXPRESS_ROUTE,p.x+Math.sin(p.yaw)*5,p.z+Math.cos(p.yaw)*5);assert.ok(((c.progress-ahead.progress+EXPRESS_ROUTE.length)%EXPRESS_ROUTE.length)<20,'board faces oncoming traffic')}
 const corners=brakingPoints(EXPRESS_ROUTE);assert.ok(corners.length>=2&&corners.some(s=>Math.abs(s-800)<120),'the terminal sweeper after the 800 m straight is a braking zone');assert.equal(boards.length,corners.length*6);
});
test('road decals are deterministic, stay on the asphalt and are dominated by things that streak',()=>{
 const plan={halfWidth:7.5,y:.016,lanePaint:{edge:7.36,centreDash:[6,18] as [number,number]},gridStation:0},a=planRoadDecals(EXPRESS_ROUTE,plan),b=planRoadDecals(EXPRESS_ROUTE,plan);assert.deepEqual(a,b);
 for(const q of a)assert.ok(projectRoad(EXPRESS_ROUTE,q.x,q.z).distance<=7.5+.2,q.tile+' is on the road');
 const count=(re:RegExp)=>a.filter(q=>re.test(q.tile)).length;assert.ok(count(/^racing-line/)>250&&count(/^expansion/)>400&&count(/^tar-snake/)>100&&count(/^white-solid/)>1500);assert.ok(a.every((q,i)=>i===0||q.layer>=a[i-1].layer),'drawn back to front');
 const line=racingLineOffset(EXPRESS_ROUTE,7.5);for(let s=0;s<EXPRESS_ROUTE.length;s+=25)assert.ok(Math.abs(line.at(s))<=5.6+1e-9);
});
test('asphalt tiles at true scale on the express ribbon',()=>{
 const ribbon=buildExpressRibbon(-7.5,7.5,.014);assert.ok(Math.abs(metresPerUV(ribbon)-6)<.05,'ribbon UVs are 6 m per unit');ribbon.dispose();
 const material=JSON.parse(readFileSync('public/assets/p11/race-asphalt/material.json','utf8')),calibration=JSON.parse(readFileSync('public/assets/p11/race-asphalt/track-calibration.json','utf8'));
 assert.deepEqual(material.dry.tileMetres,[4,4]);assert.deepEqual(material.detail.tileMetres,[.5,.5]);assert.ok(calibration.meanLinearAfter>.05&&calibration.meanLinearAfter<.12,'albedo is in the range of real asphalt, not the 1.5% scan');
});
test('galvanized steel band is a bright metal and graphite powder-coat is not metal at all',()=>{
 const source=readFileSync('scripts/p11/build-atlases.py','utf8');assert.ok(source.includes("('steel','metal',[.74,.76,.77])"));assert.ok(source.includes("row[:,:,2]=255 if name=='steel' else 0"));
});
test('owner tuning is pinned: camera motion at 90% and shake at 84% of the first pass',()=>{
 assert.equal(SPEED_FEEL.motionScale,.9);assert.equal(SPEED_FEEL.shakeScale,.84);const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,a+' vs '+b);
 near(SPEED_FEEL.topFov,55+23*.9);near(SPEED_FEEL.maxRoll,1.8);near(SPEED_FEEL.trail,.405);near(SPEED_FEEL.brakeTuck,.45);near(SPEED_FEEL.drop,.315);near(SPEED_FEEL.lookToVelocity,.54);near(SPEED_FEEL.shakePixels[0],.42);near(SPEED_FEEL.shakePixels[1],1.26);near(SPEED_FEEL.roughShakePixels,2.688);
 assert.equal(SPEED_FEEL.restFov,55,'the resting view is not motion');assert.deepEqual(SPEED_FEEL.carSize,[.92,.8],'nor is how big the car stays');assert.equal(SPEED_FEEL.blurFromMph,70);
});
test('speed camera: FOV widens from rest to top, bounded roll, blur from 70 mph, shake from 90 mph',()=>{
 const rest=settle(new SpeedFeel(false),telemetry(0,{throttle:0})),top=settle(new SpeedFeel(false),telemetry(120,{throttle:0}));
 assert.ok(Math.abs(rest.camera.fov-SPEED_FEEL.restFov)<.01);assert.ok(Math.abs(top.camera.fov-SPEED_FEEL.topFov)<.01);
 let last=0;for(const mph of[0,20,40,60,80,100,120]){const fov=settle(new SpeedFeel(false),telemetry(mph,{throttle:0})).camera.fov;assert.ok(fov>=last-1e-6,'FOV never narrows as speed rises');last=fov}
 const throttle=settle(new SpeedFeel(false),telemetry(100)),brake=settle(new SpeedFeel(false),telemetry(100,{throttle:0,brake:1})),reach=(r:ReturnType<typeof settle>)=>r.camera.position.distanceTo(r.target);
 assert.ok(reach(throttle)>reach(brake)+.5,'trails a little under throttle, tucks in under braking');assert.ok(throttle.camera.position.y<rest.camera.position.y-.2,'sits lower at speed');
 // Owner report: at high speed the car shrank to a small fraction of the frame (wider FOV AND a pull-back). On-screen size
 // goes with 1/(distance*tan(fov/2)); measured against the validated camera the test rig starts from (6.2 m, 42 degrees).
 const size=(r:ReturnType<typeof settle>)=>1/(reach(r)*Math.tan(THREE.MathUtils.degToRad(r.camera.fov)/2)),validated=1/(Math.hypot(6+2,2.4-.85)*Math.tan(THREE.MathUtils.degToRad(42)/2));
 assert.ok(size(rest)/validated>.9,'as large at rest as it always was, despite the wider lens');assert.ok(size(top)/validated>.78,'still about 80% at top speed (was under 50%)');assert.ok(size(throttle)/size(rest)>.8,'never shrinks by more than a fifth from rest, even trailing under full throttle');assert.ok(reach(top)<reach(rest)+.01,'the camera closes in as the view widens, it does not back off');
 for(const mph of[60,70]){const f=new SpeedFeel(false);settle(f,telemetry(mph));assert.equal(f.edgeBlur,0)}
 const f80=new SpeedFeel(false);settle(f80,telemetry(80));assert.ok(f80.edgeBlur>0&&f80.edgeBlur<.3);const f120=new SpeedFeel(false);settle(f120,telemetry(120));assert.equal(f120.edgeBlur,1);
 const corner=new SpeedFeel(false);settle(corner,telemetry(90,{angularVelocity:{x:0,y:.9,z:0}}));assert.ok(Math.abs(corner.inspect().rollDegrees)<=SPEED_FEEL.maxRoll+1e-9&&Math.abs(corner.inspect().rollDegrees)>1);
 // Shake: compare against a pure look-at. Under 90 mph the camera aims exactly at its target; above, it deviates by about a pixel.
 const aimError=(mph:number,extra:Partial<VehicleTelemetry>={})=>{const r=settle(new SpeedFeel(false),telemetry(mph,extra)),aim=r.target.clone().sub(r.camera.position).normalize(),view=new THREE.Vector3(0,0,-1).applyQuaternion(r.camera.quaternion);return aim.angleTo(view)*1440/THREE.MathUtils.degToRad(r.camera.fov)};
 assert.ok(aimError(85)<1e-3);assert.ok(aimError(118)<=SPEED_FEEL.shakePixels[1]*1.5+1e-6,'never more than about 1.5 px on asphalt');
 assert.ok(aimError(60,{wheels:wheels('gravel')})<=SPEED_FEEL.roughShakePixels*1.5+1e-6);
 for(const r of[rest,top,throttle,brake])for(const v of[...r.camera.position.toArray(),...r.camera.quaternion.toArray(),r.camera.fov])assert.ok(Number.isFinite(v));
});
test('reduced motion leaves the validated camera exactly as it was and asks for no blur',()=>{
 const feel=new SpeedFeel(true),camera=new THREE.PerspectiveCamera(47,16/9,.1,2000),target=new THREE.Vector3(0,.85,-2);camera.position.set(0,2.4,6);camera.lookAt(target);const before=[...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov,...target.toArray()];
 for(let i=0;i<120;i++)feel.apply(camera,target,telemetry(120,{angularVelocity:{x:0,y:1,z:0}}),'near',1/60,1440,i===0);
 assert.deepEqual([...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov,...target.toArray()],before);assert.equal(feel.edgeBlur,0);
 // Since Phase 2 the LOOK (pipeline, bloom) stays on under reduced motion; only motion is removed, which is the zero blur above.
 assert.ok(readFileSync('src/express.ts','utf8').includes('pipeline.render(scene,camera,{edgeBlur:speedFeel.edgeBlur,'),'edge blur strength comes only from SpeedFeel');
});
test('every Phase 1 runtime asset exists and is OPTIONAL: warmed by the showroom for flat routes, required by none',()=>{
 for(const route of['express','harbor']as const){const urls=speedDressingURLs(route);assert.equal(new Set(urls).size,urls.length);for(const url of urls)assert.ok(existsSync('public'+url),url);assert.ok(urls.every(u=>!u.endsWith('.png')),'GPU-compressed KTX2 only; never the 15-25 MB PNG masters');assert.deepEqual(optionalDriveAssetURLs(route).filter(u=>!u.includes('/skies/')),urls);assert.ok(driveAssetURLs(route,freshRecipe()).every(u=>!u.includes('/p11/')&&!u.includes('/basis/')),'set dressing can never block a drive')}
 assert.deepEqual(optionalDriveAssetURLs('ridge'),[]);assert.ok(driveAssetURLs('ridge',freshRecipe()).every(u=>!u.includes('/p11/')));
});
// Regression: the hosted build ships ONLY demo-assets.json. Phase 1 added downloads that were not on it, so the hosted
// showroom answered 404 and blocked Original Harbor and Harbor Express with "Download interrupted".
test('everything the showroom downloads for any route is on the hosted allowlist',()=>{
 const allow=new Set((JSON.parse(readFileSync('demo-assets.json','utf8')).assets as string[]).map(a=>'/'+a));
 for(const route of['harbor','express','ridge']as const)for(const url of[...driveAssetURLs(route,freshRecipe()),...optionalDriveAssetURLs(route)])assert.ok(allow.has(url),`${route}: ${url} is requested but not shipped by the hosted build`);
});
test('a missing or failing optional download is skipped and never rejects',async()=>{
 const calls:string[]=[],fake=(async(url:string)=>{calls.push(url);if(url.includes('missing'))return new Response('',{status:404});if(url.includes('offline'))throw new TypeError('network');return new Response('ok')})as unknown as typeof fetch;
 const result=await warmOptionalAssets(['/a','/missing','/offline','/b'],fake);assert.deepEqual(result.warmed.sort(),['/a','/b']);assert.deepEqual(result.skipped.sort(),['/missing','/offline']);assert.equal(calls.length,4);
 const stopped=new AbortController();stopped.abort();assert.deepEqual(await warmOptionalAssets(['/a'],fake,stopped.signal),{warmed:[],skipped:[]});
 const express=readFileSync('src/express/presentation.ts','utf8');assert.ok(express.includes("P11 trackside unavailable; keeping the plain rails."),'a missing prop file leaves the express scene loadable');
});
