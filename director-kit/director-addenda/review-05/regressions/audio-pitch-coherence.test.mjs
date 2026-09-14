/** Copy to tests/ in the project. Run with the existing tsx runner.
 * AUDIO_MAPPER_URL is only for Astra's isolated before/after diagnostic.
 * It does not modify the source. This validates commanded pitch, not timbre.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
const target=process.env.AUDIO_MAPPER_URL ?? new URL('../src/audio/mapper.ts',import.meta.url).href;
const {mapAudio}=await import(target);
const life={enabled:true,paused:false,mute:false,volume:.55,cockpit:false};
const wheel={contact:true,longitudinalSpeed:0,slipRatio:0,slipAngle:0,surface:'asphalt'};
const telemetry=rpm=>({rpm,speed:0,throttle:1,shifting:false,gear:1,wheels:[{...wheel},{...wheel},{...wheel}]});
const engineLayers=(rpm,throttle=1)=>mapAudio({...telemetry(rpm),throttle},life).layers.filter(l=>/^engine-\d+-(load|lift)$/.test(l.name)&&l.gain>1e-5);
test('engine pitch: every contributing bed follows the one commanded engine RPM',()=>{
 const failures=[];
 for(const rpm of [950,1200,1500,1800,1980,2100,2200,2340,2400,3000,3600,4800,6000,6200,7000,8000,8500]) {
  for(const throttle of [0,.5,1])for(const l of engineLayers(rpm,throttle)){
   const reference=Number(l.name.split('-')[1]),effective=reference*l.rate;
   if(Math.abs(effective/rpm-1)>.001)failures.push({rpm,throttle,name:l.name,gain:l.gain,effectiveRpm:effective});
  }
 }
 assert.deepEqual(failures,[],'A nonzero bed must not be clamped to a different effective engine speed. Retune it or fade it out with continuous coverage.');
});
test('engine pitch: finite nonnegative layer parameters and nonzero coverage across operating range',()=>{
 for(let rpm=950;rpm<=8500;rpm+=25){
  const p=mapAudio(telemetry(rpm),life);
  assert.ok(p.layers.every(l=>Number.isFinite(l.gain)&&l.gain>=0&&Number.isFinite(l.rate)&&l.rate>0));
  assert.ok(engineLayers(rpm).reduce((s,l)=>s+l.gain,0)>.01,`No engine coverage at ${rpm}`);
 }
});
test('engine pitch: lifecycle master muting and no-road-at-rest remain intact',()=>{
 for(const settings of [{...life,mute:true},{...life,paused:true},{...life,enabled:false}])assert.equal(mapAudio(telemetry(2400),settings).master,0);
 assert.equal(mapAudio(telemetry(2400),life).layers.find(x=>x.name==='road').gain,0);
});
