/** Brake-test time limits: AI steering, full throttle, then full brake at the point a given deceleration (m/s^2) would
 * stop on the line; creeps forward if it stops short. Prints time and miss per deceleration.  npx tsx scripts/game-feel/challenge-brake-limits.ts */
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
for(const c of CHALLENGES.filter(c=>c.kind==='brake')){
 const route=ROUTES[c.route];const rows:string[]=[];
 for(const a of [4,5,6,7,8,9,10]){
  const world=await RaceWorld.create(createCourseEnvironment(route),CURRENT_HANDLING_PROFILE);world.addVehicle('p',stationPose(route,c.start),SLINGSHOT_DEFINITION,CURRENT_HANDLING_PROFILE);world.initialize();
  const rival=new RivalController(route,'jett',11,CURRENT_HANDLING_PROFILE),judge=new ChallengeJudge(route,{...c,limitMs:60000});
  let field:Record<string,VehicleTelemetry>=world.telemetry(),s=judge.update(field.p),braking=false;
  for(let tick=0;tick<60*60&&(s.phase==='ready'||s.phase==='running');tick++){const ai=rival.control(field.p,field,FIXED_DT),v=Math.abs(field.p.speed);if(!braking&&s.toGo<=v*v/(2*a)+1)braking=true;const ctl=braking?{...ai,throttle:0,brake:v>.2?1:0}:{...ai,throttle:1,brake:0};world.step({p:ctl},FIXED_DT);field=world.telemetry();s=judge.update(field.p);if(braking&&v<.05&&s.phase==='running'){ /* stopped short: creep */ braking=s.toGo<=1}}
  rows.push(`a${a}:${s.phase==='done'?`${(s.elapsedMs/1000).toFixed(2)}s miss ${s.value!.toFixed(2)}m`:s.phase+' '+s.reason+' '+(s.elapsedMs/1000).toFixed(1)+'s'}`);world.dispose?.();
 }
 console.log(c.id,rows.join(' | '));
}
