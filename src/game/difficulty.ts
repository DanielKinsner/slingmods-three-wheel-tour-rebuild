/**
 * Quick Race rival difficulty. Scales the crew's pace/cornering/braking traits (RivalController paceScale).
 * Benchmarked headless with the production AI on all three courses (scripts/game-feel/ai-lap-times.ts, PACE env):
 * Easy 0.90 laps ~8% slower, Hard 1.08 ~6% faster, every rival finished with no retirements. Career events always use
 * the certified crew pace (scale 1), whatever this setting says.
 */
export type Difficulty='easy'|'normal'|'hard';
export const DIFFICULTIES:readonly Difficulty[]=['easy','normal','hard'];
export const DIFFICULTY_LABEL:Record<Difficulty,string>={easy:'Easy',normal:'Normal',hard:'Hard'};
export const DIFFICULTY_SCALE:Record<Difficulty,number>={easy:.9,normal:1,hard:1.08};
const KEY='slingmods-gx-difficulty';
export function difficulty():Difficulty{try{const v=localStorage.getItem(KEY);return DIFFICULTIES.includes(v as Difficulty)?v as Difficulty:'normal'}catch{return 'normal'}}
export function setDifficulty(d:Difficulty){try{localStorage.setItem(KEY,d)}catch{/* session default */}}
