import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {placeTokens,PointsScore,POINTS} from '../src/game/points';
import {projectRoad,type CourseRoute} from '../src/course/environment';
import {EXPRESS_ROUTE} from '../src/express/route';import {RIDGE_ROUTE} from '../src/ridge/route';
// SlingMods Points: deterministic layout on the road, all four values per route, chains, respawn and drops.
const HARBOR:CourseRoute=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
test('every route gets a deterministic layout on the tarmac with 10 / 25 / 50 / 100 tokens',()=>{
 for(const route of [HARBOR,EXPRESS_ROUTE,RIDGE_ROUTE]){
  const a=placeTokens(route),b=placeTokens(route);assert.deepEqual(a,b,'deterministic');
  const values=new Set(a.map(t=>t.value));for(const v of [10,25,50,100])assert.ok(values.has(v as 10),`${route.id} has ${v}`);
  assert.equal(a.filter(t=>t.value===100).length,3);
  for(const t of a)assert.ok(projectRoad(route,t.x,t.z).distance<=route.width/2-.9,`${route.id} token ${t.id} is on the road`);
 }
});
test('chains build within the window, reset after it; contact or leaving the tarmac drops the chain; laps respawn tokens',()=>{
 const tokens=placeTokens(EXPRESS_ROUTE).slice(0,4),s=new PointsScore(tokens),at=(i:number)=>[tokens[i].x,tokens[i].y-POINTS.height,tokens[i].z] as const;
 let e=s.update(...at(0),.1,true,false);assert.equal(e[0]?.kind,'collect');assert.equal(s.chain,1);
 e=s.update(...at(1),1,true,false);assert.equal(s.chain,2);const second=tokens[1].value*2;assert.equal(s.total,tokens[0].value+second);
 s.update(...at(1),3,true,false);assert.equal(s.chain,1,'window passed');
 s.update(...at(2),.1,true,false);s.update(...at(3),.5,true,false);assert.equal(s.chain,2);
 e=s.update(0,0,0,.1,true,true);assert.deepEqual(e,[{kind:'drop',chain:2}]);assert.equal(s.chain,1);
 assert.equal(s.update(...at(0),.1,true,false).length,0,'collected tokens stay gone');s.respawn();assert.equal(s.update(...at(0),.1,true,false)[0]?.kind,'collect','back after a lap');
});
