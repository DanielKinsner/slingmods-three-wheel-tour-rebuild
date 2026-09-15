import test from 'node:test';import assert from 'node:assert/strict';
import {departurePose,DEPARTURE_SECONDS} from '../src/signature/departure-motion';
test('Departure path waits for clearance then exits authored bay without a physics change',()=>{
 assert.equal(departurePose(0).door,0);assert.equal(departurePose(2.3).x,0);assert.ok(Math.abs(departurePose(2.3).yaw)<1e-10);
 let priorX=0;for(let i=0;i<=580;i++){const p=departurePose(i/100);assert.ok(p.x>=priorX);priorX=p.x;if(p.x>4.1){assert.equal(p.door,1);assert.ok(p.z>-.4&&p.z<1.2)}}
 const end=departurePose(DEPARTURE_SECONDS);assert.equal(end.x,7.8);assert.equal(end.z,.4);assert.ok(Math.abs(end.yaw+Math.PI/2)<1e-10);assert.equal(end.complete,true);
});
