import test from 'node:test';import assert from 'node:assert/strict';
import {frameStatistics,frameVerdict} from '../scripts/perf/frame-statistics.mjs';
test('sustained statistics retain every spike and distinguish p99 from the worst one percent mean',()=>{
 const frames=[...Array(198).fill(5),20,120],s=frameStatistics(frames);
 assert.equal(s.p99Ms,5);assert.equal(s.worstOnePercentMs,70);assert.equal(s.averageMs,5.65);
 assert.equal(s.over100,1);assert.equal(s.maxMs,120);assert.equal(s.onePercentLowFps,1000/70);
 assert.deepEqual(frameVerdict(s,{quality:'high',cadence:'uncapped'}),{frameTail:false,highBudget:false});
 assert.deepEqual(frames,[...Array(198).fill(5),20,120],'raw order survives');
});
test('native pacing and High render budget remain separate and boundaries never drop outliers',()=>{
 const s=frameStatistics(Array(100).fill(1000/60));
 assert.deepEqual(frameVerdict(s,{quality:'high',cadence:'native'}),{frameTail:true,highBudget:null});
 assert.equal(frameVerdict(s,{quality:'high',cadence:'uncapped'}).highBudget,false);
 assert.equal(frameStatistics([5,5,5,100.000002]).over100,1);
 for(const values of [[],[0],[NaN],[Infinity],[-1]])assert.throws(()=>frameStatistics(values));
});
