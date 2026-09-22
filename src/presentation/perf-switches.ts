/**
 * Evidence-only A/B switches for the render CPU fixes. `?perf=legacy` restores all of them, `?perf=legacy-transparency`
 * (comma-separated) one at a time; the hosted build honours `perf` only together with `test=1&profile=1`. The race's
 * evidence hook can also flip them inside one running race, so both paths are measured under the same machine load.
 */
export type PerfFix='transparency'|'matrix'|'rear';
export const PERF_FIXES:readonly PerfFix[]=['transparency','matrix','rear'];
export function parsePerfLegacy(search:string){const v=new URLSearchParams(search).get('perf')??'';return new Set(PERF_FIXES.filter(f=>v==='legacy'||v.split(',').includes('legacy-'+f)))}
let current:Set<PerfFix>|undefined;
export function perfLegacy(fix:PerfFix,search?:string){if(search!==undefined)return parsePerfLegacy(search).has(fix);current??=parsePerfLegacy(globalThis.location?.search??'');return current.has(fix)}
/** Evidence hook only: '' = every fix on, 'legacy' = all off, 'legacy-matrix,legacy-rear' = those off. */
export function setPerfLegacy(value:string){current=parsePerfLegacy('?'+new URLSearchParams({perf:value}));return [...current]}
