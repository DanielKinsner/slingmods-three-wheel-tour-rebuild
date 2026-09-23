/**
 * Records a crew ghost for every Time Attack course: the production rival AI (Jett, full crew pace) drives one
 * standing-start lap alone from the same grid slot a solo Time Attack player uses, in the real Rapier world with the production time-trial
 * rules. Samples use the Time Attack ghost format ([ms,x,y,z,qx,qy,qz,qw] at 20 Hz on the race clock), so the game plays
 * them back exactly like a player's own best lap.
 *   npx tsx scripts/game-feel/record-crew-ghosts.ts
 */
import fs from 'node:fs';
import {RaceWorld,FIXED_DT,type VehicleTelemetry} from '../../src/simulation';
import {CrewRace,RivalController,createCrewGrid} from '../../src/competition';
import {createCourseEnvironment,type CourseRoute} from '../../src/course/environment';
import {EXPRESS_ROUTE} from '../../src/express/route';
import {RIDGE_ROUTE} from '../../src/ridge/route';
import {SLINGSHOT_DEFINITION} from '../../src/simulation/vehicle-definition';
import {CURRENT_HANDLING_PROFILE} from '../../src/simulation/profile';
const HARBOR:CourseRoute=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
const out='public/assets/game-feel/ghosts';fs.mkdirSync(out,{recursive:true});
const r3=(v:number)=>+v.toFixed(3),r4=(v:number)=>+v.toFixed(4);
for(const [name,route] of [['harbor',HARBOR],['express',EXPRESS_ROUTE],['ridge',RIDGE_ROUTE]] as const){
 const id='jett',world=await RaceWorld.create(createCourseEnvironment(route),CURRENT_HANDLING_PROFILE);
 world.addVehicle(id,createCrewGrid(route,[id])[id],SLINGSHOT_DEFINITION,CURRENT_HANDLING_PROFILE);world.initialize();
 const race=new CrewRace(route,[id],id,false,{eventId:'crew-ghost',laps:1,handlingProfileId:CURRENT_HANDLING_PROFILE,timeTrial:true}),rival=new RivalController(route,id,11,CURRENT_HANDLING_PROFILE);
 race.restart(crypto.randomUUID());let field:Record<string,VehicleTelemetry>=world.telemetry(),last=-Infinity;const data:number[]=[];
 const push=(ms:number,t:VehicleTelemetry)=>data.push(Math.round(ms),r3(t.position.x),r3(t.position.y),r3(t.position.z),r4(t.quaternion.x),r4(t.quaternion.y),r4(t.quaternion.z),r4(t.quaternion.w));
 for(let tick=0;tick<60*60*6;tick++){
  const prev=field;world.step({[id]:race.control(id,rival.control(field[id],field,FIXED_DT))},FIXED_DT);field=world.telemetry();race.tick(prev,field,FIXED_DT);
  const s=race.snapshot();if(s.phase==='running'&&!s.playerResult&&s.elapsedMs-last>=50){last=s.elapsedMs;push(s.elapsedMs,field[id])}
  if(s.playerResult){if(!s.playerResult.valid)throw Error(`${name}: ghost lap invalid (${s.playerResult.status} ${s.standings[0]&&(race.snapshot() as any).standings[0].invalidReason})`);push(s.playerResult.timeMs!,field[id]);
   const file={driver:'jett',course:name,timeMs:Math.round(s.playerResult.timeMs!),handlingProfile:CURRENT_HANDLING_PROFILE,method:'Production RivalController, solo standing-start time trial from the Time Attack grid slot, real Rapier world (scripts/game-feel/record-crew-ghosts.ts)',data};
   fs.writeFileSync(`${out}/${name}.json`,JSON.stringify(file));console.log(name,file.timeMs,'ms',data.length/8,'samples',Math.round(JSON.stringify(file).length/1024),'KB');break}
 }
 world.dispose?.();
}
