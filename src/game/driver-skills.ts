/**
 * Driver skills (owner decision 2026-09-24): Tour Rep levels unlock skills for the arcade layer (Quick Race, series
 * races, free test drives). They sharpen the new arcade moves only; career events never use them, so career results and
 * time-trial records stay comparable.
 */
export interface DriverSkill {id:string;level:number;name:string;detail:string}
export const DRIVER_SKILLS:readonly DriverSkill[]=[
 {id:'launch',level:2,name:'Launch Control',detail:'Perfect-start boost lasts 50% longer.'},
 {id:'drift-feel',level:4,name:'Drift Feel',detail:'Drifts charge 15% faster.'},
 {id:'nitrous-nerves',level:6,name:'Nitrous Nerves',detail:'Drift boosts last 20% longer.'},
 {id:'draft-hunter',level:8,name:'Draft Hunter',detail:'Slipstream builds twice as fast.'},
 {id:'clean-exit',level:10,name:'Clean Exit',detail:'A wider window to straighten up for a boost.'},
];
export interface SkillEffects {launch:number;charge:number;boost:number;draft:number;cleanSlip:number}
export const NO_SKILLS:SkillEffects={launch:1,charge:1,boost:1,draft:1,cleanSlip:.1};
export const unlockedSkills=(level:number)=>DRIVER_SKILLS.filter(s=>level>=s.level);
/** Effects of every skill unlocked at `level`. */
export function skillEffects(level:number):SkillEffects{
 const has=(id:string)=>unlockedSkills(level).some(s=>s.id===id);
 return {launch:has('launch')?1.5:1,charge:has('drift-feel')?1.15:1,boost:has('nitrous-nerves')?1.2:1,draft:has('draft-hunter')?2:1,cleanSlip:has('clean-exit')?.14:.1};
}
/** Skills that a level-up from `before` to `after` unlocks (for the level-up announcement). */
export const newlyUnlocked=(before:number,after:number)=>DRIVER_SKILLS.filter(s=>s.level>before&&s.level<=after);
