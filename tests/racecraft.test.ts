import test from 'node:test';import assert from 'node:assert/strict';
import {RaceWorld,FIXED_DT,type VehicleTelemetry} from '../src/simulation';
import {RivalController} from '../src/competition';
import {sampleRoad,type CourseRoute} from '../src/course/environment';
// Phase 4A racecraft: slipstream, scrape-not-spin contact, and rivals that hold their line beside another car.
const drive={throttle:1,brake:0,steer:0,reverse:false},coast={throttle:0,brake:0,steer:0,reverse:false};
async function pair(racecraft:boolean,poses:Record<string,{x:number;z:number}>,velocity:Record<string,{x:number;z:number}>){
 const world=await RaceWorld.create(undefined,'slingmods-sport-v5');for(const [id,p] of Object.entries(poses))world.addVehicle(id,{x:p.x,z:p.z,yaw:0});world.initialize();
 if(racecraft)world.setRacecraft({slipstream:true,rubbing:true});
 for(const [id,v] of Object.entries(velocity))world.get(id).setMotion({x:v.x,y:0,z:v.z},{x:0,y:0,z:0});return world;
}
test('slipstream builds behind another car after about a second and is off unless a race enables it',async()=>{
 const speeds:number[]=[];
 for(const racecraft of [false,true]){
  const world=await pair(racecraft,{leader:{x:0,z:-9},follower:{x:0,z:0}},{leader:{x:0,z:-32},follower:{x:0,z:-32}});
  const draft:number[]=[];for(let i=0;i<120;i++){world.step({leader:drive,follower:drive},FIXED_DT);draft.push(world.draftOf('follower'))}
  if(racecraft){assert.ok(draft[20]<.05,'no instant tow');assert.ok(Math.max(...draft.slice(70))>.15,`tow builds: ${Math.max(...draft)}`);assert.equal(world.draftOf('leader'),0,'the leader gets none')}
  else assert.ok(draft.every(d=>d===0));
  speeds.push(world.get('follower').telemetry().speed);world.dispose();
 }
 assert.ok(speeds[1]>speeds[0],`the tow carries more speed: ${speeds}`);
});
test('a glancing side-by-side touch scrapes: less spin than raw contact, and it is reported for sparks',async()=>{
 const yaw:number[]=[];
 for(const racecraft of [false,true]){
  const world=await pair(racecraft,{a:{x:0,z:0},b:{x:2.1,z:-.6}},{a:{x:4,z:-25},b:{x:0,z:-25}});
  let peak=0,rubbed=false;for(let i=0;i<45;i++){world.step({a:coast,b:coast},FIXED_DT);for(const id of ['a','b'])peak=Math.max(peak,Math.abs(world.get(id).telemetry().angularVelocity.y));rubbed||=world.rubbing.length>0}
  yaw.push(peak);if(racecraft){assert.ok(world.scrapeCount>0&&rubbed,'contact seen')}else assert.equal(world.scrapeCount,0);
  world.dispose();
 }
 assert.ok(yaw[1]<yaw[0]*.8,`yaw kick softened: raw ${yaw[0].toFixed(3)}, racecraft ${yaw[1].toFixed(3)}`);
});
const route:CourseRoute={id:'test',version:'1',name:'Test',width:15,runoff:3,length:600,centerline:[[0,0],[0,-300],[-100,-300],[-100,100],[0,100]],start:{x:0,z:5,y:.025,yaw:0},ground:{center:[0,-.15,0],size:[500,.3,500]},colliders:[],lamps:[],checkpoints:[]};
function at(d:number,offset=0):VehicleTelemetry{const p=sampleRoad(route,d);return {position:{x:p.x+offset,z:p.z,y:.48},quaternion:{x:0,y:0,z:0,w:1},velocity:{x:p.dx*30,y:0,z:p.dz*30},angularVelocity:{x:0,y:0,z:0},speed:30,wheels:[-.8,.8,0].map(x=>({localCenter:{x,y:.3,z:0},contact:true}))} as unknown as VehicleTelemetry}
test('a rival never steers across onto a car alongside; alone it moves to its own line',()=>{
 // Maya's own line is on the left (negative lateral). A car sits alongside on that side.
 const lanes=(peers:boolean)=>{const r=new RivalController(route,'maya',11,'slingmods-sport-v5');const me=at(40);for(let i=0;i<90;i++)r.control(me,peers?{maya:me,player:at(40,-2.2)}:{maya:me},FIXED_DT);return r.inspect().lane as number};
 assert.ok(lanes(false)<-.6,'free to take its line');
 assert.ok(lanes(true)>-.2,'holds its line beside another car');
});
test('historical handling profiles keep the original rival behaviour (no racecraft)',()=>{
 const r=new RivalController(route,'maya',11,'legacy-p08a');const me=at(40);for(let i=0;i<90;i++)r.control(me,{maya:me,player:at(40,-2.2)},FIXED_DT);
 assert.ok((r.inspect().lane as number)<-.6,'legacy rivals are unchanged by the new awareness');assert.equal('guards' in r.inspect(),false);
});
