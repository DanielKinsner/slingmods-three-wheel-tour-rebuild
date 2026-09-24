import test from 'node:test';import assert from 'node:assert/strict';
import {tuningFor,buildStats,tuningLine,fittedParts} from '../src/game/tuning';
import {skillEffects,unlockedSkills,newlyUnlocked,NO_SKILLS} from '../src/game/driver-skills';
import {comparisonIdentity,comparisonLabel} from '../src/game/build-identity';
import {freshRecipe} from '../src/signature/config';
import {RaceWorld,FIXED_DT} from '../src/simulation';
// Parts game tuning + driver skills (owner decision 2026-09-24).
const slingshot=(products:Record<string,string>={},profile='slingmods-sport-v5')=>({...freshRecipe(),products,handlingProfile:profile} as ReturnType<typeof freshRecipe>);
test('parts tune the build modestly; cosmetic parts and historical tunes stay neutral',()=>{
 assert.deepEqual(tuningFor(slingshot()),{power:1,grip:1,aeroGrip:0,drag:1});
 assert.deepEqual(tuningFor(slingshot({'SM-133':'base-rgb','SM-28919':'lower-pair'})),{power:1,grip:1,aeroGrip:0,drag:1},'underglow and bags are looks only');
 const full=tuningFor(slingshot({'SM-7720':'brushed-silver','SM-3223':'silver','SM-26801':'black-aluminum'}));
 assert.ok(Math.abs(full.power-1.04)<1e-9&&Math.abs(full.grip-1.03)<1e-9&&Math.abs(full.aeroGrip-.03)<1e-9&&Math.abs(full.drag-1.03)<1e-9);
 assert.deepEqual(tuningFor(slingshot({'SM-7720':'brushed-silver'},'slingmods-sport-v4')),{power:1,grip:1,aeroGrip:0,drag:1},'older tunes replay exactly');
 assert.equal(tuningLine('SM-7720'),'+4% power');assert.equal(tuningLine('SM-133'),'');
 const stock=buildStats(slingshot()),exhaust=buildStats(slingshot({'SM-7720':'brushed-silver'})),wing=buildStats(slingshot({'SM-26801':'black-aluminum'}));
 assert.ok(exhaust.acceleration>stock.acceleration&&wing.stability>stock.stability&&wing.topSpeed<stock.topSpeed,'the wing trades a little top speed for stability');
});
test('Ryker and Spyder parts map to their own tuning keys',()=>{
 const ryker={...slingshot(),vehicleId:'can-am-ryker-900',handlingProfile:'ryker-road-v1',ryker:{exhaust:true,body:true,underglow:true}} as ReturnType<typeof freshRecipe>;
 assert.deepEqual(fittedParts(ryker).sort(),['ryker:body','ryker:exhaust','ryker:underglow']);const t=tuningFor(ryker);assert.ok(Math.abs(t.power-1.04)<1e-9&&Math.abs(t.drag-.98)<1e-9);
});
test('the car really changes: neutral tuning is byte-identical, +4% power pulls harder from a rolling start (standing starts are traction-limited)',async()=>{
 const run=async(tuning?:Parameters<ReturnType<RaceWorld['get']>['configureTuning']>[0])=>{const w=await RaceWorld.create(undefined,'slingmods-sport-v5');w.addVehicle('p',{x:0,z:0,yaw:0});w.initialize();if(tuning)w.get('p').configureTuning(tuning);w.get('p').setMotion({x:0,y:0,z:-20},{x:0,y:0,z:0});for(let i=0;i<240;i++)w.step({p:{throttle:1,brake:0,steer:0,reverse:false}},FIXED_DT);const t=w.get('p').telemetry();w.dispose();return t};
 const base=await run(),neutral=await run({power:1,grip:1,aeroGrip:0,drag:1}),tuned=await run({power:1.04,grip:1,aeroGrip:0,drag:1});
 assert.deepEqual(neutral,base);assert.ok(tuned.speed>base.speed,`${base.speed} -> ${tuned.speed}`);
});
test('tuned Slingshot and Ryker builds keep their own records; stock keys are unchanged',()=>{
 assert.equal(comparisonIdentity(slingshot()),'slingshot-r-2024');assert.equal(comparisonIdentity(slingshot({'SM-133':'base-rgb'})),'slingshot-r-2024');
 const id=comparisonIdentity(slingshot({'SM-3223':'silver','SM-7720':'brushed-silver'}));assert.equal(id,'slingshot-r-2024|tuned:SM-3223,SM-7720');assert.equal(comparisonLabel(id),'Slingshot R · Shocks + Exhaust');
 assert.equal(comparisonIdentity(slingshot({'SM-7720':'brushed-silver'},'slingmods-sport-v4')),'slingshot-r-2024','older tunes are not tuned');
});
test('driver skills unlock by Tour Rep level and only ever help',()=>{
 assert.deepEqual(skillEffects(1),NO_SKILLS);assert.equal(unlockedSkills(5).length,2);
 const all=skillEffects(12);assert.ok(all.launch>1&&all.charge>1&&all.boost>1&&all.draft>1&&all.cleanSlip>NO_SKILLS.cleanSlip);
 assert.deepEqual(newlyUnlocked(3,6).map(s=>s.id),['drift-feel','nitrous-nerves']);
});
