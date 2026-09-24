/**
 * Headless passing benchmark (Phase 4A). A full crew race in the real Rapier world with production rules: the three
 * production rivals plus a faster "player" bot that has to pass them. Two player styles:
 *   racer  - the production AI logic at a higher pace (tries to pass cleanly)
 *   blind  - drives the racing line ignoring traffic (a player who pushes and expects rivals to cope)
 * Counts what makes passing annoying: car-to-car contacts, spins, rivals moving across onto a car alongside,
 * time stuck behind a rival, and completed passes. Numbers are for before/after comparison, not absolute truth.
 *   npx tsx scripts/game-feel/passing-bench.ts        ROUTES=express,harbor STYLES=racer,blind SEEDS=3 PACE=1.1 RACECRAFT=0 OUT=file.json
 */
import fs from 'node:fs';
import {RaceWorld,FIXED_DT,type VehicleTelemetry} from '../../src/simulation';
import {CrewRace,createCrewGrid,RivalController,CREW_IDS} from '../../src/competition';
import {RaceRoad} from '../../src/competition/road';
import {createCourseEnvironment,type CourseRoute} from '../../src/course/environment';
import {EXPRESS_ROUTE} from '../../src/express/route';
import {RIDGE_ROUTE} from '../../src/ridge/route';
import {SLINGSHOT_DEFINITION} from '../../src/simulation/vehicle-definition';
import {CURRENT_HANDLING_PROFILE} from '../../src/simulation/profile';
const HARBOR:CourseRoute=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
const ALL:Record<string,CourseRoute>={harbor:HARBOR,express:EXPRESS_ROUTE,ridge:RIDGE_ROUTE};
const routes=(process.env.ROUTES??'express,harbor,ridge').split(','),styles=(process.env.STYLES??'racer,blind').split(','),seeds=Number(process.env.SEEDS??3),pace=Number(process.env.PACE??1.1);
const yawOf=(q:VehicleTelemetry['quaternion'],elevated:boolean)=>Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+(elevated?q.x*q.x:q.z*q.z)));
type Totals={races:number;contacts:number;playerContacts:number;spins:number;playerSpins:number;turnIns:number;stuckSeconds:number;passes:number;retired:number;playerPlace:number;playerTime:number;scrapes:number;onPlayer:number};
const results:Record<string,Totals>={};
for(const name of routes)for(const style of styles){
 const route=ALL[name],road=new RaceRoad(route),key=`${name}/${style}`,T:Totals={races:0,contacts:0,playerContacts:0,spins:0,playerSpins:0,turnIns:0,stuckSeconds:0,passes:0,retired:0,playerPlace:0,playerTime:0,scrapes:0,onPlayer:0};results[key]=T;
 for(let seed=1;seed<=seeds;seed++){
  const ids=[...CREW_IDS],grid=createCrewGrid(route,ids),world=await RaceWorld.create(createCourseEnvironment(route),CURRENT_HANDLING_PROFILE);
  for(const id of ids)world.addVehicle(id,grid[id],SLINGSHOT_DEFINITION,CURRENT_HANDLING_PROFILE);world.initialize();if(process.env.RACECRAFT!=='0')world.setRacecraft({slipstream:true,rubbing:true});
  const race=new CrewRace(route,ids,'player',false,{eventId:'passing-bench',handlingProfileId:CURRENT_HANDLING_PROFILE});race.restart(crypto.randomUUID());
  const drivers=Object.fromEntries(ids.map(id=>[id,new RivalController(route,id,seed,CURRENT_HANDLING_PROFILE,id==='player'?pace:1)]));
  const touching=new Set<string>(),spinning=new Set<string>(),turning=new Set<string>(),segments:Record<string,number|undefined>={};
  let field=world.telemetry(),lastPlace=4,started=false;
  for(let tick=0;tick<60*60*10;tick++){
   const prev=field,controls:Record<string,ReturnType<RivalController['control']>>={};
   for(const id of ids){const peers=id==='player'&&style==='blind'?{player:field.player}:field;controls[id]=race.control(id,drivers[id].control(field[id],peers,FIXED_DT))}
   world.step(controls,FIXED_DT);field=world.telemetry();race.tick(prev,field,FIXED_DT);
   const s=race.snapshot();if(s.phase==='running')started=true;if(!started)continue;
   // Road frame per car.
   const frame:Record<string,{progress:number;lateral:number;dx:number;dz:number;heading:number;latVel:number}>={};
   for(const id of ids){const v=field[id],p=road.project(v.position.x,v.position.z,segments[id]);segments[id]=p.segment;const yaw=yawOf(v.quaternion,!!route.elevations),fx=-Math.sin(yaw),fz=-Math.cos(yaw);
    frame[id]={progress:p.progress,lateral:(v.position.x-p.x)*-p.dz+(v.position.z-p.z)*p.dx,dx:p.dx,dz:p.dz,heading:Math.acos(Math.max(-1,Math.min(1,fx*p.dx+fz*p.dz))),latVel:v.velocity.x*-p.dz+v.velocity.z*p.dx};
    const spin=Math.abs(v.speed)>3&&frame[id].heading>1.05;if(spin&&!spinning.has(id)){T.spins++;if(id==='player')T.playerSpins++;if(process.env.DEBUG==='spin'){const i=drivers[id].inspect() as Record<string,unknown>,near=ids.filter(o=>o!==id).map(o=>{const d=Math.hypot(field[o].position.x-v.position.x,field[o].position.z-v.position.z);return o+':'+d.toFixed(1)}).join(' ');console.log('  spin',name,style,'seed',seed,'t',(s.elapsedMs/1000).toFixed(1),id,'speed',v.speed.toFixed(1),'draft',world.draftOf(id).toFixed(2),'mode',i.mode,'lane',(i.lane as number).toFixed(2),'lat',frame[id].lateral.toFixed(2),'guards',JSON.stringify(i.guards),'near',near,'scrapes',world.scrapeCount)}}if(spin)spinning.add(id);else if(frame[id].heading<.5)spinning.delete(id)}
   for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=ids[i],b=ids[j],va=field[a],vb=field[b],dx=vb.position.x-va.position.x,dz=vb.position.z-va.position.z,ahead=dx*frame[a].dx+dz*frame[a].dz,side=dx*-frame[a].dz+dz*frame[a].dx,pair=a+':'+b;
    const touch=Math.abs(ahead)<3.7&&Math.abs(side)<1.9;if(touch&&!touching.has(pair)){T.contacts++;if(a==='player'||b==='player')T.playerContacts++}if(touch)touching.add(pair);else if(Math.abs(ahead)>4.5||Math.abs(side)>2.6)touching.delete(pair);
    // A rival moving across toward a car that is alongside it (overlapping, not behind, not already touching: being
    // shoved is counted as contact, not as a turn-in).
    for(const [me,other,rel] of [[a,b,side],[b,a,-side]] as const){if(me==='player')continue;const alongside=Math.abs(ahead)<3.5&&Math.abs(rel)>2.05&&Math.abs(rel)<3.8,toward=Math.sign(rel)*frame[me].latVel>.9,k=me+'>'+other;if(alongside&&toward&&!turning.has(k)){T.turnIns++;if(other==='player'){T.onPlayer++;if(process.env.DEBUG){const i=drivers[me].inspect() as Record<string,unknown>;console.log('  turn-in',name,style,'seed',seed,'t',(s.elapsedMs/1000).toFixed(1),me,'latVel',frame[me].latVel.toFixed(2),'rel',rel.toFixed(2),'ahead',ahead.toFixed(2),'lat',frame[me].lateral.toFixed(2),'player lat',frame.player.lateral.toFixed(2),'mode',i.mode,'lane',(i.lane as number).toFixed(2),'target',(i.targetLane as number).toFixed(2),'guards',JSON.stringify(i.guards),'mistake',i.mistake)}}turning.add(k)}else if(!alongside)turning.delete(k)}
   }
   // Stuck: the faster player sitting close behind a rival in the same lane.
   for(const id of ids){if(id==='player')continue;const gap=frame[id].progress-frame.player.progress;if(gap>4&&gap<18&&Math.abs(frame[id].lateral-frame.player.lateral)<2.2)T.stuckSeconds+=FIXED_DT}
   const place=s.standings.findIndex(x=>x.id==='player')+1;if(place>0&&place<lastPlace)T.passes+=lastPlace-place;if(place>0)lastPlace=place;
   if(s.phase==='finished'||s.playerResult&&s.standings.every(x=>x.status!=='running'))break;
  }
  const s=race.snapshot();T.races++;T.playerPlace+=s.standings.findIndex(x=>x.id==='player')+1;T.playerTime+=(s.playerResult?.timeMs??0)/1000;T.scrapes+=world.scrapeCount;T.retired+=ids.filter(id=>drivers[id].inspect().retiredReason).length;
  world.dispose();
 }
 const r=T.races;console.log(key.padEnd(16),`contacts ${(T.contacts/r).toFixed(1)} (player ${(T.playerContacts/r).toFixed(1)})  spins ${(T.spins/r).toFixed(1)} (player ${(T.playerSpins/r).toFixed(1)})  turn-ins ${(T.turnIns/r).toFixed(1)} (onto player ${(T.onPlayer/r).toFixed(1)})  stuck ${(T.stuckSeconds/r).toFixed(1)}s  passes ${(T.passes/r).toFixed(1)}  place ${(T.playerPlace/r).toFixed(2)}  time ${(T.playerTime/r).toFixed(1)}s  retired ${T.retired}  scrape-steps ${(T.scrapes/r).toFixed(0)}`);
}
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(results,null,2));
