import test from 'node:test';import assert from 'node:assert/strict';
import {ChallengeJudge,challengeById,challengeKey,CARGO} from '../src/game/challenges';
import {sampleRoad,type CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry} from '../src/simulation';
// Cargo Run: loose crates spill under sustained hard driving (+2 s each); fitted storage bags secure the load.
// A long straight test course, so the only acceleration is the one each test applies.
const route:CourseRoute={id:'straight',version:'1',name:'Straight',width:12,runoff:3,length:4020,centerline:[[0,0],[0,-2000],[10,-2000],[10,0]],start:{x:0,z:0,y:.025,yaw:0},ground:{center:[0,-.15,0],size:[500,.3,4500]},colliders:[],lamps:[],checkpoints:[]},c={...challengeById('harbor-cargo')!,start:10,end:700};
function drive(judge:ChallengeJudge,profile:(t:number)=>number,seconds:number){
 // Travel along the course at 20 m/s; profile(t) is an extra sideways acceleration (m/s^2) the car feels.
 let lat=0,state=judge.update(tel(0,c.start,0));for(let i=1;i<=seconds*60;i++){const t=i/60;lat+=profile(t)/60;state=judge.update(tel(t,c.start+20*t,lat))}return state;
 function tel(time:number,station:number,sideways:number):VehicleTelemetry{const p=sampleRoad(route,station);return {time,position:{x:p.x,y:.5,z:p.z},velocity:{x:p.dx*20-p.dz*sideways,y:0,z:p.dz*20+p.dx*sideways},speed:20,quaternion:{x:0,y:0,z:0,w:1}} as unknown as VehicleTelemetry}
}
test('sustained hard driving spills crates, capped at the load; bags keep it secured; gentle driving delivers all',()=>{
 const hard=(t:number)=>(Math.floor(t)%2?1:-1)*9;
 const loose=drive(new ChallengeJudge(route,c),hard,8);assert.equal(loose.spills,c.crates,'every crate lost');
 const secured=drive(new ChallengeJudge(route,c,true),hard,8);assert.equal(secured.spills,0);assert.equal(secured.secured,true);
 const gentle=drive(new ChallengeJudge(route,c),t=>Math.sin(t*3)*4,8);assert.equal(gentle.spills,0,'normal cornering keeps the load');
 const kerb=drive(new ChallengeJudge(route,c),t=>t%2<1/30?40:0,8);assert.equal(kerb.spills,0,'short kerb spikes do not spill');
});
test('each spill adds its penalty to the delivery time',()=>{
 const j=new ChallengeJudge(route,c),s=drive(j,t=>t<1.5?9:0,36);assert.equal(s.phase,'done');assert.equal(s.spills,1);
 // 690 m at 20 m/s is 34.5 s of driving, plus one spill.
 assert.ok(Math.abs(s.value!-(34500+CARGO.penaltyMs))<=20,`${s.value}`);
});
test('challenge results: Spyder and performance-tuned builds keep their own records; stock keeps the plain key',()=>{
 assert.equal(challengeKey('harbor-cargo','slingshot-r-2024'),'harbor-cargo');assert.equal(challengeKey('harbor-cargo','slingshot-r-2024|tuned:SM-7720'),'harbor-cargo:slingshot-r-2024|tuned:SM-7720');
});
