/**
 * Challenge medal targets from the production AI: each crew driver runs every challenge alone from its standing start in
 * the real Rapier world, judged by the same ChallengeJudge the game uses. Sprint/trap targets scale the best AI result;
 * brake tests use the AI's time to the box plus a stopping allowance for the time limit.
 *   npx tsx scripts/game-feel/challenge-targets.ts
 */
import fs from 'node:fs';
import {RaceWorld,FIXED_DT,type VehicleTelemetry} from '../../src/simulation';
import {RivalController} from '../../src/competition';
import {createCourseEnvironment,type CourseRoute} from '../../src/course/environment';
import {EXPRESS_ROUTE} from '../../src/express/route';
import {RIDGE_ROUTE} from '../../src/ridge/route';
import {SLINGSHOT_DEFINITION} from '../../src/simulation/vehicle-definition';
import {CURRENT_HANDLING_PROFILE} from '../../src/simulation/profile';
import {CHALLENGES,ChallengeJudge,stationPose} from '../../src/game/challenges';
const ROUTES:Record<string,CourseRoute>={harbor:JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8')),express:EXPRESS_ROUTE,ridge:RIDGE_ROUTE};
for(const c of CHALLENGES){
 const route=ROUTES[c.route],results:string[]=[];
 // Variants: each crew driver at normal pace, Jett at raised pace scales, and Jett's steering at full throttle.
 for(const [id,pace,flat] of [['maya',1,false],['jett',1,false],['nico',1,false],['jett',1.1,false],['jett',1.2,false],['jett',1.3,false],['jett',1,true]] as [string,number,boolean][]){
  const world=await RaceWorld.create(createCourseEnvironment(route),CURRENT_HANDLING_PROFILE);world.addVehicle(id,stationPose(route,c.start),SLINGSHOT_DEFINITION,CURRENT_HANDLING_PROFILE);world.initialize();
  const rival=new RivalController(route,id,11,CURRENT_HANDLING_PROFILE,pace),judge=new ChallengeJudge(route,{...c,kind:c.kind==='brake'?'sprint':c.kind});
  let field:Record<string,VehicleTelemetry>=world.telemetry(),s=judge.update(field[id]);
  for(let tick=0;tick<60*120&&(s.phase==='ready'||s.phase==='running');tick++){const ai=rival.control(field[id],field,FIXED_DT);world.step({[id]:flat?{...ai,throttle:1,brake:0}:ai},FIXED_DT);field=world.telemetry();s=judge.update(field[id])}
  results.push(`${flat?'flat':id+(pace!==1?'@'+pace:'')}:${s.phase==='done'?(c.kind==='trap'?s.value!.toFixed(2)+'m/s':Math.round(s.value!)+'ms'):s.phase+' '+s.reason}`);world.dispose?.();
 }
 console.log(c.id.padEnd(15),results.join('  '));
}
