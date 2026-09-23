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
test('Tour Series awards 10/7/5/3, replaces a retried race, and ranks by total then best result',async()=>{
 const store=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v)},removeItem:(k:string)=>{store.delete(k)}};
 try{const m=await import('../src/game/series');m.startSeries('normal');
  const st=(order:string[],dnf:string[]=[])=>order.map((id,i)=>({id,place:i+1,status:dnf.includes(id)?'dnf':'finished'}));
  m.recordSeriesRace(st(['maya','player','jett','nico']),'a1');assert.equal(m.seriesTotals(m.seriesState()!)[0].id,'maya');
  m.recordSeriesRace(st(['player','maya','jett','nico']),'a2');assert.deepEqual(m.seriesState()!.results[0],{player:10,maya:7,jett:5,nico:3},'retry replaces');
  m.recordSeriesRace(st(['nico','maya','jett','player'],['player']),'a2');assert.equal(m.seriesState()!.results[0]!.player,10,'same attempt is idempotent');
  m.advanceSeries();m.recordSeriesRace(st(['maya','player','jett','nico']),'b1');m.advanceSeries();m.recordSeriesRace(st(['player','jett','maya','nico']),'c1');
  const t=m.seriesTotals(m.seriesState()!);assert.equal(t[0].id,'player');assert.equal(t[0].points,27);assert.equal(m.seriesComplete(m.seriesState()!),true);assert.equal(m.seriesWins(),1);
 }finally{delete (globalThis as any).localStorage}
});
test('Corner profile slows for tight corners and stays fast on straights',async()=>{
 const {cornerProfile}=await import('../src/game/corner-profile');
 const square={centerline:[[0,0],[0,-200],[200,-200],[200,0]] as [number,number][]};const p=cornerProfile(square as never);
 assert.equal(p.length,800);const atCorner=p.limit[Math.round(200/5)],midStraight=p.limit[Math.round(100/5)];assert.ok(atCorner<25,`corner ${atCorner}`);assert.ok(midStraight>100,`straight ${midStraight}`);
});
test('Crew ghost files are valid one-lap recordings matching the published times',async()=>{
 const fs=await import('node:fs');const {CREW_GHOST_TIMES}=await import('../src/game/time-attack');
 for(const r of ['harbor','express','ridge'] as const){const g=JSON.parse(fs.readFileSync(`public/assets/game-feel/ghosts/${r}.json`,'utf8'));assert.equal(g.timeMs,CREW_GHOST_TIMES[r]);assert.equal(g.data.length%8,0);assert.equal(g.data.at(-8),Math.round(g.timeMs));for(let i=8;i<g.data.length;i+=8)assert.ok(g.data[i]>=g.data[i-8],'monotonic clock')}
});
test('Loading key art: every course, light and ride maps to a shipped, allowlisted image',async()=>{
 const fs=await import('node:fs');const {artForSearch,courseArt,artUrl}=await import('../src/game/loading-art');
 const hosted=new Set(JSON.parse(fs.readFileSync('demo-assets.json','utf8')).assets);
 const cases:[string,string][]=[['?scene=express&route=harbor&look=night','harbor-night'],['?scene=express&route=harbor','harbor-day'],['?scene=express&route=express&look=dusk-rain','express-dusk'],['?scene=express&look=night-rain','express-night'],['?scene=ridge&lighting=night','ridge-night'],['?scene=express&route=ridge','ridge-day'],['?scene=crew','harbor-day'],['?visual=ryker','garage-ryker'],['','garage']];
 for(const[q,id]of cases)assert.equal(artForSearch(q),id,q);
 for(const id of [courseArt('express','golden-hour'),'harbor-night','express-day','express-dusk','express-night','ridge-day','ridge-night','garage','garage-ryker'] as const){const url=artUrl(id);assert.ok(fs.existsSync('public'+url),url);assert.ok(hosted.has(url.slice(1)),url+' allowlisted')}
});
test('Attract mode: flag, reel URLs survive the hosted visitor filter, and demo runs never write records',async()=>{
 const {isAttract}=await import('../src/game/attract-flag');const {visitorSearch}=await import('../src/demo/profile');
 assert.equal(isAttract('?scene=express&attract=1'),true);assert.equal(isAttract('?scene=express'),false);assert.equal(isAttract(''),false);
 for(let reel=0;reel<6;reel++){const q=new URLSearchParams(visitorSearch(`?scene=express&route=ridge&mode=race&attract=1&reel=${reel}&lighting=night`));assert.equal(q.get('attract'),'1');assert.equal(q.get('reel'),String(reel));assert.equal(q.get('mode'),'race')}
 assert.equal(new URLSearchParams(visitorSearch('?attract=2&reel=9')).toString(),'','unknown values are dropped');
});
test('Challenges: judge starts on movement, handles lap wrap, finishes, overshoots and leaves the road',async()=>{
 const {CHALLENGES,ChallengeJudge,challengeMedal,stationPose,BOX_HALF}=await import('../src/game/challenges');const {sampleRoad}=await import('../src/course/environment');const {EXPRESS_ROUTE}=await import('../src/express/route');const {visitorSearch}=await import('../src/demo/profile');
 const fs=await import('node:fs');const HARBOR=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
 const at=(route:any,station:number,time:number,speed:number,offset=0)=>{const p=sampleRoad(route,station);return {time,speed,position:{x:p.x-p.dz*offset,y:0,z:p.z+p.dx*offset}} as any};
 // Drive a challenge along the centreline at a constant speed from its start station.
 const drive=(c:any,route:any,speed:number,until:number,offset=()=>0)=>{const j=new ChallengeJudge(route,c);let s=j.update(at(route,c.start,0,0));for(let t=.05;t<until&&(s.phase==='ready'||s.phase==='running');t+=.05)s=j.update(at(route,c.start+speed*t,t,speed,offset()));return s};
 const sprint=CHALLENGES.find(c=>c.id==='express-sprint')!,trap=CHALLENGES.find(c=>c.id==='harbor-trap')!,brake=CHALLENGES.find(c=>c.id==='harbor-brake')!;
 const run=drive(sprint,EXPRESS_ROUTE,30,60);assert.equal(run.phase,'done');assert.ok(Math.abs(run.value!-20000)<200,'600 m at 30 m/s is about 20 s: '+run.value);assert.equal(run.medal,'slingmods');
 const wrap=drive({...trap,start:1180,end:1231+60},HARBOR,25,60);assert.equal(wrap.phase,'done','crosses the lap line');assert.ok(Math.abs(wrap.value!-25)<.01);
 assert.equal(drive(brake,HARBOR,20,60).reason,'Overshot the box');
 assert.equal(drive(sprint,EXPRESS_ROUTE,30,60,()=>EXPRESS_ROUTE.width/2+EXPRESS_ROUTE.runoff+5).reason,'Off course');
 const idle=new ChallengeJudge(HARBOR,brake);assert.equal(idle.update(at(HARBOR,0,5,0)).phase,'ready','the clock waits for the first movement');
 // Brake: stop 0.5 m past the line (decelerate into it).
 const j=new ChallengeJudge(HARBOR,brake);j.update(at(HARBOR,0,0,0));let s=j.update(at(HARBOR,1,.1,10));for(let x=1,t=.1;x<150.5;){x=Math.min(150.5,x+2);t+=.1;s=j.update(at(HARBOR,x,t,x>=150.5?0:10))}
 assert.equal(s.phase,'done');assert.ok(Math.abs(s.value!-.5)<.05);assert.equal(s.medal,'gold');assert.ok(BOX_HALF>=s.value!);
 assert.equal(challengeMedal(trap,trap.targets.bronze-.01),null);assert.equal(challengeMedal(sprint,sprint.targets.gold),'gold');
 for(const c of CHALLENGES){const pose=stationPose(c.route==='express'?EXPRESS_ROUTE:c.route==='harbor'?HARBOR:(await import('../src/ridge/route')).RIDGE_ROUTE,c.start);assert.ok(Number.isFinite(pose.x+pose.y+pose.z+pose.yaw),c.id);
  assert.ok(c.kind==='trap'?c.targets.slingmods>c.targets.gold&&c.targets.gold>c.targets.silver&&c.targets.silver>c.targets.bronze:c.targets.slingmods<c.targets.gold&&c.targets.gold<c.targets.silver&&c.targets.silver<=c.targets.bronze,c.id+' ladder order');
  assert.equal(new URLSearchParams(visitorSearch(`?scene=express&mode=test&challenge=${c.id}`)).get('challenge'),c.id)}
 assert.equal(new URLSearchParams(visitorSearch('?challenge=../x')).get('challenge'),null);
});
