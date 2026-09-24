import test from 'node:test';import assert from 'node:assert/strict';
import {dailyRun,dailyFits,recordDaily,dailyState} from '../src/game/daily';
// Daily Run upgrade: every day also sets a condition and a build rule; a finish only counts when both fit.
const store=new Map<string,string>();(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>void store.set(k,v),removeItem:(k:string)=>void store.delete(k)};
test('conditions and build rules rotate and stay deterministic for the day',()=>{
 const days=Array.from({length:21},(_,i)=>dailyRun(new Date(2026,8,1+i)));
 assert.deepEqual(new Set(days.map(d=>d.build)),new Set(['any','stock','tuned']));
 for(const route of ['harbor','express','ridge'])assert.equal(new Set(days.filter(d=>d.route===route).map(d=>d.build)).size,3,`${route} meets every build rule`);assert.ok(new Set(days.map(d=>d.condition)).size>=5);
 for(const d of days){assert.ok(d.route==='ridge'?!!d.lighting&&!d.look:!!d.look&&!d.lighting,d.key);assert.deepEqual(d,dailyRun(new Date(+d.key.slice(0,4),+d.key.slice(5,7)-1,+d.key.slice(8,10),22)))}
});
test('a finish counts only in the day\'s condition with a build that fits the rule',()=>{
 const day=Array.from({length:30},(_,i)=>new Date(2026,8,1+i)).find(d=>{const r=dailyRun(d);return r.route!=='ridge'&&r.build==='stock'})!,run=dailyRun(day);
 const right={look:run.look,performance:false};
 assert.equal(dailyFits(run,right),true);assert.equal(dailyFits(run,{...right,performance:true}),false,'stock day, tuned car');assert.equal(dailyFits(run,{...right,look:'other'}),false,'wrong condition');assert.equal(dailyFits(run,undefined),false);
 store.clear();assert.equal(recordDaily(run.route,run.targetMs-1,day,{...right,performance:true}),false);assert.equal(dailyState().lastDone,null);
 assert.equal(recordDaily(run.route,run.targetMs-1,day,right),true);assert.equal(dailyState().lastDone,run.key);
});
