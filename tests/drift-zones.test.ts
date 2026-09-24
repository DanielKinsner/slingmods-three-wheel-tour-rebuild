import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {DRIFT_ZONES,ZonePass,recordZone,zoneBoard} from '../src/game/drift-zones';
import {sampleRoad,type CourseRoute} from '../src/course/environment';
import {EXPRESS_ROUTE} from '../src/express/route';import {RIDGE_ROUTE} from '../src/ridge/route';
// Drift zones: two per route on twisty road, slide-only scoring, and a local top five.
const store=new Map<string,string>();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>void store.set(k,v),removeItem:(k:string)=>void store.delete(k)};
const HARBOR:CourseRoute=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8')),routes:Record<string,CourseRoute>={harbor:HARBOR,express:EXPRESS_ROUTE,ridge:RIDGE_ROUTE};
test('two zones per route, inside the lap, each on bending road',()=>{
 for(const id of Object.keys(routes)){const zs=DRIFT_ZONES.filter(z=>z.route===id),r=routes[id];assert.equal(zs.length,2,id);
  for(const z of zs){assert.ok(z.start>=0&&z.end<r.length&&z.end-z.start>=200,z.id);let turn=0;for(let d=z.start;d<z.end;d+=10){const a=sampleRoad(r,d),b=sampleRoad(r,d+10);turn+=Math.abs(Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz))}assert.ok(turn>.8,`${z.id} bends (${turn.toFixed(2)} rad)`)}}
});
test('only sliding on tarmac at speed scores; the board keeps the best five in order',()=>{
 const p=new ZonePass();p.add(10,.05,1,true);p.add(3,.5,1,true);p.add(10,.5,1,false);assert.equal(p.score,0);p.add(10,.5,1,true);assert.ok(p.score>0);
 store.clear();const places=[500,900,300,1200,700,100,800].map(s=>recordZone('express-esses',s,'slingshot-r-2024'));
 assert.deepEqual(places,[1,1,3,1,3,0,3]);assert.deepEqual(zoneBoard('express-esses').map(e=>e.score),[1200,900,800,700,500]);
 assert.equal(recordZone('express-esses',0,'x'),0,'no drift, no entry');
});
