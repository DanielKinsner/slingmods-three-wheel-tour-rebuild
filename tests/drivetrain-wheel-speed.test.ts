import test from 'node:test';
import assert from 'node:assert/strict';
import {AutoDrive,DRIVETRAIN} from '../src/simulation/drivetrain.ts';
const radius=0.3455,speed=10,dt=1/60,ticks=24;
function sample(rearOverspeed:number,bodySpeed=speed){
  const d=new AutoDrive();
  for(let i=0;i<ticks;i++)d.step(bodySpeed,rearOverspeed,radius,0,1,false,dt);
  return {rpm:d.rpm,gear:d.gear,shiftRemaining:d.shiftRemaining};
}
test('fixture: stationary zero-throttle engine stays at idle',()=>{
  assert.equal(sample(0,0).rpm,DRIVETRAIN.idle);
});
test('fixture: freely rolling rear wheel raises coupled engine RPM above idle',()=>{
  assert.ok(sample(0).rpm>DRIVETRAIN.idle+500);
});
test('fixture: positive rear wheel overspeed raises RPM above rolling baseline',()=>{
  assert.ok(sample(speed/radius).rpm>sample(0).rpm);
});
test('REGRESSION: zero-throttle wheel lock must not rev higher than free rolling',()=>{
  // The renderer integrates wheel phase from longitudinalSpeed/radius + overspeed.
  // On a straight flat surface, this exact negative overspeed cancels wheel rotation.
  const rolling=sample(0),locked=sample(-speed/radius),spinning=sample(speed/radius);
  assert.ok(locked.rpm<rolling.rpm,
    `Locked wheel: ${locked.rpm} RPM; rolling: ${rolling.rpm}; spinning: ${spinning.rpm}. `+
    'Signed rotational contributions must be combined before taking magnitude.');
});


test('reverse wheel lock cancels signed rolling rotation while reverse wheelspin raises RPM',()=>{
 const reverseRolling=sample(0,-speed),reverseLocked=sample(speed/radius,-speed),reverseSpin=sample(-speed/radius,-speed);
 assert.equal(reverseLocked.rpm,DRIVETRAIN.idle);
 assert.ok(reverseRolling.rpm>reverseLocked.rpm);
 assert.ok(reverseSpin.rpm>reverseRolling.rpm);
});
