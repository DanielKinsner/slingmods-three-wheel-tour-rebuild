import {CrewPlayerAgent}from './crew-player-agent';
import fs from 'node:fs';import {randomUUID}from 'node:crypto';
import routeData from '../public/assets/harbor/route.json';
import {createCourseEnvironment,type CourseRoute}from '../src/course/environment';
import {RaceWorld,FIXED_DT,type VehicleControl}from '../src/simulation';
import {CrewRace,RivalController,createCrewGrid}from '../src/competition';
const route=routeData as CourseRoute;
for(const seed of process.env.PODIUM?[11,97]:[11,97]){
 const order=seed===11?['maya','jett','nico','player']:['jett','nico','maya','player'],grid=createCrewGrid(route,order),world=await RaceWorld.create(createCourseEnvironment(route));for(const id of order)world.addVehicle(id,grid[id]);
 const playerAgent=new CrewPlayerAgent(route);const controllers=Object.fromEntries(order.map(id=>[id,new RivalController(route,id,seed)])),race=new CrewRace(route,order);race.restart(randomUUID());let previous=world.telemetry();const trace:unknown[]=[],changes:unknown[]=[];let lastOrder='';
 for(let tick=0;tick<60*300;tick++){const before=world.telemetry(),controls:Record<string,VehicleControl>={};for(const id of order){controls[id]=race.control(id,id==='player'&&process.env.PODIUM?playerAgent.control(before[id],before,FIXED_DT):controllers[id].control(before[id],before,FIXED_DT));const reason=controllers[id].inspect().retiredReason;if(reason)race.retire(id,reason)}world.step(controls,FIXED_DT);const now=world.telemetry();race.tick(before,now,FIXED_DT);if(tick%60===0){const snapshot=race.snapshot();trace.push({tick,snapshot,telemetry:now,controllers:Object.fromEntries(order.map(id=>[id,controllers[id].inspect()]))});const ids=snapshot.standings.map(s=>s.id).join();if(ids!==lastOrder){changes.push({tick,order:ids});lastOrder=ids}if(snapshot.allFinished)break}previous=now}
 const result={seed,grid,steps:world.steps,result:race.snapshot(),controllers:Object.fromEntries(order.map(id=>[id,controllers[id].inspect()])),changes,trace};fs.mkdirSync('director-kit/production/evidence/P05/competition',{recursive:true});fs.writeFileSync(`director-kit/production/evidence/P05/competition/${process.env.PODIUM?'podium':'seed'}-${seed}.json`,JSON.stringify(result));console.log(JSON.stringify({...result,trace:trace.length},null,2));world.dispose();
}
