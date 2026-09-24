import test from 'node:test';import assert from 'node:assert/strict';
import {GymkhanaScore,GYM,type GymEvent} from '../src/game/gymkhana-score';
// Gymkhana scoring: drift points, donuts around a pole, figure-8s, cone penalties, 90 s clock.
const poles=[{x:-15,z:0},{x:15,z:0}];
function circle(s:GymkhanaScore,pole:{x:number;z:number},dir:1|-1,turns:number,start=0){const events:GymEvent[]=[];const steps=Math.round(turns*120);for(let i=1;i<=steps;i++){const a=start+dir*i/120*2*Math.PI;events.push(...s.update({x:pole.x+7*Math.cos(a),z:pole.z+7*Math.sin(a),speed:9,rearSlip:.5,inLot:true},1/60))}return events}
test('nothing scores before the start; sliding scores and builds a chain; gripping does not',()=>{
 const s=new GymkhanaScore(poles);s.update({x:0,z:30,speed:10,rearSlip:.5,inLot:true},1);assert.equal(s.score,0);
 s.start();s.update({x:0,z:30,speed:10,rearSlip:.05,inLot:true},1);assert.equal(s.score,0,'grip driving scores nothing');
 let chained=false;for(let i=0;i<300;i++)for(const e of s.update({x:0,z:30,speed:10,rearSlip:.5,inLot:true},1/60))if(e.kind==='chain')chained=true;
 assert.ok(s.score>0&&chained&&s.chain>=2,`score ${s.score} chain ${s.chain}`);
 const before=s.score;s.update({x:0,z:30,speed:10,rearSlip:.5,inLot:false},1/60);assert.equal(s.score,before,'no points off the lot');
});
test('a full slide-circle around a pole is a donut; the other pole the other way is a figure 8',()=>{
 const s=new GymkhanaScore(poles);s.start();
 const first=circle(s,poles[0],1,1.05);assert.equal(first.filter(e=>e.kind==='donut').length,1);
 const second=circle(s,poles[1],-1,1.05,Math.PI);assert.ok(second.some(e=>e.kind==='figure8'),'figure 8');assert.equal(s.figure8s,1);
 const same=circle(s,poles[1],-1,1.05,Math.PI);assert.ok(!same.some(e=>e.kind==='figure8'),'the same pole again is only a donut');
});
test('cones cost points and break the chain; the run ends at 90 s with a medal check',()=>{
 const s=new GymkhanaScore(poles);s.start();for(let i=0;i<400;i++)s.update({x:0,z:30,speed:12,rearSlip:.6,inLot:true},1/60);
 const before=s.score;s.cone();assert.equal(s.score,Math.max(0,before+GYM.cone));assert.equal(s.chain,1);
 let ended=false;for(let t=0;t<GYM.seconds*60&&!ended;t++)for(const e of s.update({x:0,z:30,speed:1,rearSlip:0,inLot:true},1/60))if(e.kind==='end')ended=true;
 assert.ok(ended&&s.phase==='done');assert.deepEqual(s.update({x:0,z:30,speed:12,rearSlip:.6,inLot:true},1),[],'nothing after the end');
});
test('the lot is added to a built world: asphalt inside, the course untouched outside, extra colliders appended',async()=>{
 const {RaceWorld}=await import('../src/simulation');const {createCourseEnvironment}=await import('../src/course/environment');const {EXPRESS_ROUTE}=await import('../src/express/route');const {addGymkhanaLot,LOT}=await import('../src/game/gymkhana');
 const env=createCourseEnvironment(EXPRESS_ROUTE),before=env.obstacles.length,outside=env.surfaceAt(LOT.cx+LOT.w,LOT.cz);
 const world=await RaceWorld.create(env,'slingmods-sport-v5');addGymkhanaLot(world);
 assert.equal(world.environment.surfaceAt(LOT.cx,LOT.cz).id,'asphalt');assert.deepEqual(world.environment.surfaceAt(LOT.cx+LOT.w,LOT.cz),outside);
 assert.equal(world.environment.obstacles.length,before+6,'4 barrier walls + 2 poles');assert.equal(EXPRESS_ROUTE.colliders.length,before,'the shared route data is not mutated');world.dispose();
});
