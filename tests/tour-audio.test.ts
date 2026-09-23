import test from 'node:test';
import assert from 'node:assert/strict';
import {worldMix,MotionSounds,DEFAULT_SOUND_SCENE} from '../src/audio/tour-director';
import {RaceCues,buildCue} from '../src/audio/actions';
import {decodeSave,writeSave,loadSave} from '../src/save';
import {freshRykerRecipe} from '../src/signature/config';
import {Simulation} from '../src/simulation';

test('Music off persists through compatible save migration without changing historical records',()=>{
 const raw={version:1,vehicleId:'slingshot-r-2024',settings:{mute:false,volume:.3,musicVolume:0,environmentVolume:.6},records:{old:{timeMs:3000,recordedAt:'then'}}};
 const save=decodeSave(JSON.stringify(raw));let stored='';const storage={getItem:()=>stored,setItem:(_k:string,v:string)=>stored=v};writeSave(storage,save);
 assert.equal(loadSave(storage).settings.musicVolume,0);assert.equal(loadSave(storage).settings.environmentVolume,.6);assert.deepEqual(loadSave(storage).records,raw.records);
 const legacy=decodeSave(JSON.stringify({...raw,settings:{volume:.3}}));assert.equal(legacy.settings.musicVolume,.45);assert.equal(legacy.settings.volume,.3);
});
test('Surface feedback requires ground contact; wet/night ambience follows the scene',async()=>{
 const sim=await Simulation.create();try{const t=sim.telemetry();t.speed=25;t.wheels.forEach(w=>{w.contact=true;w.slipRatio=.7;w.surface='gravel'});
 const scene={...DEFAULT_SOUND_SCENE,place:'ridge' as const,phase:'running',wet:true,night:true};const mix=worldMix(scene,t);
 assert.ok(mix['tire-scrub']>0&&mix.gravel>0&&mix['wet-tire']>0&&mix.night>0&&mix.rain>0);
 t.wheels.forEach(w=>w.contact=false);const airborne=worldMix(scene,t);assert.equal(airborne['tire-scrub'],0);assert.equal(airborne.gravel,0);assert.equal(airborne['wet-tire'],0);
 assert.equal(worldMix({...scene,phase:'finished'},t)['tire-scrub'],0);
 }finally{sim.dispose()}
});
test('Motion foley rejects normal braking, reset discontinuities and repeated impacts',async()=>{
 const sim=await Simulation.create();try{const t=sim.telemetry(),events=new MotionSounds();t.time=1;t.speed=20;assert.deepEqual(events.update(t),[]);
 t.time+=1/60;t.speed=19.8;assert.deepEqual(events.update(t),[]);
 t.time+=1/60;t.speed=0;assert.deepEqual(events.update(t,true),[]);
 t.time+=1/60;t.speed=20;events.update(t);t.time+=1/60;t.speed=10;assert.equal(events.update(t)[0]?.id,'impact');
 t.time+=1/60;t.speed=5;assert.deepEqual(events.update(t),[]);
 }finally{sim.dispose()}
});

test('Motion foley cooldowns restart with a new attempt clock',async()=>{
 const sim=await Simulation.create();try{
  const t=sim.telemetry(),events=new MotionSounds();
  t.time=100;t.speed=20;t.wheels.forEach(w=>{w.contact=true;w.travel=0});events.update(t);
  t.time+=1/60;t.speed=10;t.wheels[0].travel=.1;
  assert.deepEqual(events.update(t).map(e=>e.id),['impact','suspension']);
  t.time=0;t.speed=20;t.wheels[0].travel=0;assert.deepEqual(events.update(t,true),[]);
  t.time=1/60;t.speed=10;t.wheels[0].travel=.1;
  assert.deepEqual(events.update(t).map(e=>e.id),['impact','suspension']);
 }finally{sim.dispose()}
});
test('Race cue edges distinguish checkpoints and failed finishes without replaying on pause',()=>{
 const cues=new RaceCues(),played:string[]=[];const play=(id:string)=>played.push(id);
 const state={attemptId:'a',phase:'running',paused:false,countdown:0,standings:[{id:'player',lap:1,nextGate:1,valid:true}]};
 cues.update(state,play);state.standings[0].nextGate=2;cues.update(state,play);cues.update(state,play);assert.deepEqual(played,['race.checkpoint']);
 cues.update({...state,phase:'finished',playerResult:{valid:false,status:'invalid'}},play);assert.deepEqual(played,['race.checkpoint','race.invalid']);
 cues.update({...state,phase:'finished',paused:true,playerResult:{valid:false,status:'invalid'}},play);assert.equal(played.length,2);
 cues.update({...state,attemptId:'b',phase:'countdown',countdown:3},play);assert.equal(played.at(-1),'race.count');
});
test('Ryker workshop uses the corresponding component foley and one cue for a preset',()=>{
 const before=freshRykerRecipe();assert.equal(buildCue(before,{...before,ryker:{exhaust:true}}),'part.exhaust.attach');
 assert.equal(buildCue(before,{...before,ryker:{shocks:true,body:true}}),'build.preset');
 assert.equal(buildCue({...before,ryker:{body:true}},before),'part.remove');
});
