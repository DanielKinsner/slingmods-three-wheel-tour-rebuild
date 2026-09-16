import {RaceWorld,type HandlingProfileId,type VehicleControl} from '../simulation';
import {CrewRace,createCrewGrid,RivalController} from '../competition';
import {EXPRESS_ROUTE,createExpressEnvironment} from './route';
export const EXPRESS_EVENT='harbor-express-quick-race-v1';
/** No award proof is created: preview build races are never career transactions. */
export async function createExpressRace(profileId:HandlingProfileId='slingmods-sport-v1',seed=11){
 const world=await RaceWorld.create(createExpressEnvironment(),profileId),ids=['maya','jett','nico','player'],grid=createCrewGrid(EXPRESS_ROUTE,ids);
 for(const id of ids)world.addVehicle(id,grid[id]);
 const race=new CrewRace(EXPRESS_ROUTE,ids,'player',false,{eventId:EXPRESS_EVENT,laps:1,handlingProfileId:profileId});
 let rivals=Object.fromEntries(ids.filter(id=>id!=='player').map(id=>[id,new RivalController(EXPRESS_ROUTE,id,seed,profileId)]));world.initialize();
 return {world,race,grid,route:EXPRESS_ROUTE,profileId,get rivals(){return rivals},restart(attemptId:string){for(const id of ids)world.get(id).reset(grid[id]);rivals=Object.fromEntries(ids.filter(id=>id!=='player').map(id=>[id,new RivalController(EXPRESS_ROUTE,id,seed,profileId)]));race.restart(attemptId)},step(player:VehicleControl,dt=1/60){const previous=world.telemetry(),controls:Record<string,VehicleControl>={player:race.control('player',player)};for(const [id,rival]of Object.entries(rivals)){controls[id]=race.control(id,rival.control(previous[id],previous,dt));if(rival.inspect().retiredReason)race.retire(id,rival.inspect().retiredReason!)}world.step(controls,dt);const current=world.telemetry();race.tick(previous,current,dt);return current},dispose(){world.dispose()}};
}
