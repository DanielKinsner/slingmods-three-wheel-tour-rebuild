/** No trimming: nearest-rank percentiles and arithmetic mean of the slowest ceil(N/100) frames. */
export const FRAME_LIMITS = Object.freeze({p95Ms:20,p99Ms:33.4,maxMs:100,highAverageMs:10,highWorstOnePercentMs:16.6,toleranceMs:1e-6});
export function frameStatistics(values) {
  if (!values.length || values.some(v=>!Number.isFinite(v)||v<=0)) throw Error('Positive finite frame intervals required');
  const sorted=[...values].sort((a,b)=>a-b),mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  const averageMs=mean(sorted),worstOnePercentMs=mean(sorted.slice(-Math.ceil(sorted.length/100)));
  return {samples:sorted.length,activeSeconds:sorted.reduce((s,v)=>s+v,0)/1000,averageMs,averageFps:1000/averageMs,
    worstOnePercentMs,onePercentLowFps:1000/worstOnePercentMs,
    p50Ms:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],p99Ms:sorted[Math.ceil(sorted.length*.99)-1],maxMs:sorted.at(-1),
    over33_4:sorted.filter(v=>v>33.4+FRAME_LIMITS.toleranceMs).length,over50:sorted.filter(v=>v>50+FRAME_LIMITS.toleranceMs).length,over100:sorted.filter(v=>v>100+FRAME_LIMITS.toleranceMs).length};
}
export function frameVerdict(stats,{quality,cadence}) {
  const l=FRAME_LIMITS,t=l.toleranceMs;
  return {frameTail:stats.p95Ms<=l.p95Ms+t&&stats.p99Ms<=l.p99Ms+t&&stats.maxMs<=l.maxMs+t,
    highBudget:cadence==='uncapped'&&quality==='high'?stats.averageMs<=l.highAverageMs+t&&stats.worstOnePercentMs<=l.highWorstOnePercentMs+t:null};
}
