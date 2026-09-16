import test from 'node:test';import assert from 'node:assert/strict';
import {buildCue,RaceCues} from '../src/audio/actions';
import {freshRecipe} from '../src/signature/config';
import {displayValues,DISPLAY_MOUNT} from '../src/presentation/powered-display';
import {PresentationTelemetry} from '../src/presentation/interpolate';
import {Simulation} from '../src/simulation';
test('transaction cue classifier: no-op, one material, removal, finish and one preset',()=>{
 const a=freshRecipe(),b=structuredClone(a);assert.equal(buildCue(a,b),undefined);b.products['SM-7720']='brushed-silver';assert.equal(buildCue(a,b),'part.exhaust.attach');assert.equal(buildCue(b,a),'part.remove');assert.equal(buildCue(a,b,true),'build.preset');b.products['SM-3223']='silver';assert.equal(buildCue(a,b),'build.preset');b.products={};b.finish='white-graphite';assert.equal(buildCue(a,b),'finish.apply');
});
test('race cue edges do not repeat on repaint, pause or invalid result',()=>{
 const c=new RaceCues(),heard:string[]=[];const run=(phase:string,countdown=0,paused=false,valid=false)=>c.update({phase,countdown,paused,playerResult:{valid}},id=>heard.push(id));
 run('ready');run('countdown',3);run('countdown',3);run('countdown',2,true);run('countdown',2);run('countdown',1);run('running');run('running');run('finished',0,false,true);run('finished',0,false,true);run('countdown',3);run('finished');assert.deepEqual(heard,['race.count','race.count','race.count','race.start','race.finish','race.count']);
});
test('display converts signed speed and actual gear without inventing unavailable telemetry',()=>{
 assert.deepEqual(displayValues({speed:-10,rpm:3456,gear:-1}),{speed:22,units:'mph',rpm:3460,gear:'R'});assert.equal(displayValues({speed:10,rpm:950,gear:0},true).speed,36);assert.equal(displayValues({speed:0,rpm:950,gear:0}).gear,'N');assert.ok(DISPLAY_MOUNT.width<.216&&DISPLAY_MOUNT.height<.147);assert.ok(DISPLAY_MOUNT.position[2]>-.174);
});
test('reusable render interpolation does not mutate simulation or copy wheel trees',async()=>{
 const sim=await Simulation.create();try{const a=sim.telemetry();sim.step({throttle:.5,brake:0,steer:0,reverse:false});const b=sim.telemetry(),aCopy=structuredClone(a),bCopy=structuredClone(b),p=new PresentationTelemetry(),t=p.sample(a,b,.5);assert.equal(t.wheels,b.wheels);assert.equal(t.rpm,b.rpm);assert.notEqual(t.position,b.position);assert.equal(t.position.x,(a.position.x+b.position.x)/2);assert.equal(p.sample(a,b,1),t);assert.deepEqual(a,aCopy);assert.deepEqual(b,bCopy)}finally{sim.dispose()}
});
