/**
 * Headless AI benchmark for Time Attack medal targets: the production rivals drive each route alone, in the real Rapier
 * world with the production crew-race rules, for one standing-start lap. Prints per-lap times so medal targets are grounded in how
 * the game's own drivers actually lap each course rather than invented numbers.
 *   npx tsx scripts/game-feel/ai-lap-times.ts
 */
import fs from 'node:fs';
import {RaceWorld,FIXED_DT,type VehicleTelemetry} from '../../src/simulation';
import {CrewRace,createCrewGrid,RivalController} from '../../src/competition';
import {createCourseEnvironment,type CourseRoute} from '../../src/course/environment';
import {EXPRESS_ROUTE} from '../../src/express/route';
import {RIDGE_ROUTE} from '../../src/ridge/route';
import {SLINGSHOT_DEFINITION} from '../../src/simulation/vehicle-definition';
import {CURRENT_HANDLING_PROFILE} from '../../src/simulation/profile';
const HARBOR:CourseRoute=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
const routes:[string,CourseRoute][]=[['harbor',HARBOR],['express',EXPRESS_ROUTE],['ridge',RIDGE_ROUTE]];
const out:Record<string,unknown>={};
for(const [name,route] of routes){
 out[name]={};
 for(const id of ['maya','jett','nico']){
  const ids=[id],grid=createCrewGrid(route,ids),world=await RaceWorld.create(createCourseEnvironment(route),CURRENT_HANDLING_PROFILE);
  world.addVehicle(id,grid[id],SLINGSHOT_DEFINITION,CURRENT_HANDLING_PROFILE);world.initialize();
  const race=new CrewRace(route,ids,id,false,{eventId:'benchmark',handlingProfileId:CURRENT_HANDLING_PROFILE,timeTrial:true});
  const rival=new RivalController(route,id,11,CURRENT_HANDLING_PROFILE);
  race.restart(crypto.randomUUID());
  let field:Record<string,VehicleTelemetry>=world.telemetry(),laps:number[]=[],lastLap=1,lapStart=0;
  for(let tick=0;tick<60*60*8;tick++){
   const prev=field;world.step({[id]:race.control(id,rival.control(field[id],field,FIXED_DT))},FIXED_DT);field=world.telemetry();race.tick(prev,field,FIXED_DT);
   const s=race.snapshot(),me=s.standings[0];
   if(me.lap>lastLap){laps.push(s.elapsedMs-lapStart);lapStart=s.elapsedMs;lastLap=me.lap}
   if(s.playerResult){if(s.playerResult.valid)laps.push((s.playerResult.timeMs??0)-lapStart);(out[name] as Record<string,unknown>)[id]={status:s.playerResult.status,total:s.playerResult.timeMs,laps,retired:rival.inspect().retiredReason};break}
  }
  world.dispose?.();
  console.log(name,id,JSON.stringify((out[name] as Record<string,unknown>)[id]));
 }
}
fs.writeFileSync(process.env.OUT??'ai-lap-times.json',JSON.stringify(out,null,2));
