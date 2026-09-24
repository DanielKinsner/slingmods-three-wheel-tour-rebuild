import test from 'node:test';import assert from 'node:assert/strict';
import {shiftLight} from '../src/signature/race-instruments';
test('shift light fills from 72% of the limiter, flashes from 95%, and never shows on a CVT',()=>{
 const at=(ratio:number,powertrain?:string)=>shiftLight(ratio*8000,8000,powertrain);
 assert.deepEqual([.5,.72,.8,.9,.94].map(r=>at(r).level),[0,1,2,4,5]);
 assert.equal(at(.94).flash,false);assert.deepEqual(at(.96),{level:5,flash:true});assert.deepEqual(at(1.2),{level:5,flash:true});
 assert.deepEqual(at(.99,'cvt'),{level:0,flash:false});
});
