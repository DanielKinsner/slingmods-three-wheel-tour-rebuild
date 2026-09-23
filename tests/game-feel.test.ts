import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';
import {freshCareer} from '../src/career/store';
import {tourProgress,repForLevel,levelForRep,repGain,receiptRep,PARTICIPATION_REP} from '../src/game/progress';
import {medalFor,MEDAL_TARGETS,MEDALS,Track,trialTime} from '../src/game/time-attack';

test('Tour Rep: level curve is monotonic and levels come only from award receipts',()=>{
 for(let l=1;l<30;l++)assert.ok(repForLevel(l+1)>repForLevel(l));
 assert.equal(levelForRep(0),1);assert.equal(levelForRep(repForLevel(5)),5);assert.equal(levelForRep(repForLevel(5)-1),4);
 const s=freshCareer();assert.equal(tourProgress(s).level,1);assert.equal(tourProgress(null).rep,0);
 s.receipts.a={id:'a',kind:'award',amount:800,balance:800,first:true,at:''};s.receipts.b={id:'b',kind:'purchase',amount:-1000,balance:0,first:true,at:''};
 assert.equal(tourProgress(s).rep,800+PARTICIPATION_REP,'purchases never cost rep');assert.equal(receiptRep({kind:'purchase',amount:-1000}),0);
});
test('Tour Rep: a new award reports gain and level-up against the prior state',()=>{
 const s=freshCareer();const g=repGain(s,{kind:'award',amount:900});assert.equal(g.gain,900+PARTICIPATION_REP);assert.equal(g.from.level,1);assert.equal(g.levelUp,g.level>1);
});
test('Tour progress counts events across all three chapters',()=>{
 const s=freshCareer();const p=tourProgress(s);assert.equal(p.completed,0);assert.equal(p.total,9);assert.equal(p.chapter,1);
 s.chapters.firstCompletion=true;s.buildMatters.duelCompleted=true;s.crew.completed=true;assert.equal(tourProgress(s).chapter,2);assert.equal(tourProgress(s).completed,3);
});
test('Time Attack medals: ordered targets per course, inclusive thresholds',()=>{
 for(const route of Object.keys(MEDAL_TARGETS) as (keyof typeof MEDAL_TARGETS)[]){const t=MEDAL_TARGETS[route];for(let i=1;i<MEDALS.length;i++)assert.ok(t[MEDALS[i-1]]<t[MEDALS[i]]);
  assert.equal(medalFor(route,t.gold),'gold');assert.equal(medalFor(route,t.gold+1),'silver');assert.equal(medalFor(route,t.bronze+1),null);assert.equal(medalFor(route,t.slingmods-1),'slingmods')}
 assert.equal(trialTime(67780),'1:07.780');assert.equal(trialTime(5450),'0:05.450');
});
test('Ghost track interpolates position and clamps outside the recorded lap',()=>{
 const track=new Track(),q=new THREE.Quaternion();track.push(0,new THREE.Vector3(0,0,0),q);track.push(1000,new THREE.Vector3(10,0,-20),q);
 const p=new THREE.Vector3(),r=new THREE.Quaternion();assert.equal(Track.sample(track.data,500,p,r),true);assert.deepEqual(p.toArray(),[5,0,-10]);
 Track.sample(track.data,5000,p,r);assert.deepEqual(p.toArray(),[10,0,-20]);Track.sample(track.data,-5,p,r);assert.deepEqual(p.toArray(),[0,0,0]);
 assert.equal(Track.sample([],10,p,r),false);
});
test('Achievements derive from the career save and never require storage',async()=>{
 const {achievementState,ACHIEVEMENTS}=await import('../src/game/achievements');
 const ids=new Set(ACHIEVEMENTS.map(a=>a.id));assert.equal(ids.size,ACHIEVEMENTS.length,'unique ids');
 const s=freshCareer();let st=achievementState(s);assert.equal(st.find(x=>x.a.id==='off-the-line')!.done,false);
 s.chapters.firstCompletion=true;s.crew.bestPlace=1;st=achievementState(s);assert.equal(st.find(x=>x.a.id==='off-the-line')!.done,true);assert.equal(st.find(x=>x.a.id==='harbor-hero')!.done,true);
 assert.deepEqual(st.find(x=>x.a.id==='tour-regular')!.progress,[1,5]);assert.equal(achievementState(null).filter(x=>x.done).length,0);
});
test('Daily Run is deterministic per day and streaks count consecutive days only',async()=>{
 const {dailyRun,liveStreak}=await import('../src/game/daily');
 const a=dailyRun(new Date(2026,8,23)),b=dailyRun(new Date(2026,8,23,23,59));assert.deepEqual(a,b);
 const week=new Set(Array.from({length:6},(_,i)=>dailyRun(new Date(2026,8,20+i)).route));assert.equal(week.size,3,'all courses rotate within a week');
 assert.equal(liveStreak({lastDone:'2026-09-22',streak:4,best:4},'2026-09-23'),4);assert.equal(liveStreak({lastDone:'2026-09-20',streak:4,best:4},'2026-09-23'),0);
});
