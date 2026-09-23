import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FILMS,FinishFilmGate,filmDuration,sampleFilm,type Film} from '../src/presentation/cinematics/tracks';
import {visitorSearch} from '../src/demo/profile';

test('cinematic tracks remain finite and terminate at every supported frame rate',()=>{
  for(const film of Object.keys(FILMS) as Film[])for(const fps of [24,30,60,144]){
    const duration=filmDuration(film);assert.ok(duration<10);
    for(let t=0;t<duration;t+=1/fps){
      const frame=sampleFilm(film,t);
      assert.ok([...frame.position,...frame.aim,frame.fov].every(Number.isFinite));
      assert.ok(frame.position[1]>.2);assert.ok(frame.fov>=35&&frame.fov<=70);
      assert.equal(frame.done,false);
    }
    assert.equal(sampleFilm(film,duration).done,true);
    assert.equal(sampleFilm(film,duration+100).done,true);
  }
});

test('victory gate accepts real finishes once, defers paused finishes, ignores invalid attempts',()=>{
  const gate=new FinishFilmGate();
  assert.equal(gate.accept(null,false),false);
  assert.equal(gate.accept({attemptId:'invalid',valid:false,place:null},false),false);
  const result={attemptId:'first',valid:true,place:1};
  assert.equal(gate.accept(result,true),false);
  assert.equal(gate.accept(result,false),true);
  for(let i=0;i<100;i++)assert.equal(gate.accept(result,false),false);
  assert.equal(gate.accept({...result,attemptId:'second',place:3},false),true);
  assert.equal(gate.accept(result,false),false);
});

test('packaged previews preserve the bounded cinematic choice without admitting arbitrary fixtures',()=>{
  assert.equal(new URLSearchParams(visitorSearch('?scene=express&cinematic=victory&clock=controlled')).get('cinematic'),'victory');
  assert.equal(new URLSearchParams(visitorSearch('?cinematic=arbitrary')).has('cinematic'),false);
  assert.equal(new URLSearchParams(visitorSearch('?cinematic=arrival&clock=controlled')).has('clock'),false);
});
