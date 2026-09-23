import test from 'node:test';import assert from 'node:assert/strict';
import {photoDimensions} from '../src/game/photo-capture';
test('photo export preserves the composition and stays within 4K and GPU bounds',()=>{
 for(const [w,h,limit] of [[1600,900,8192],[2560,1440,8192],[844,390,8192],[900,1600,8192],[5120,1440,2048]]){
  const out=photoDimensions(w,h,limit);
  assert.ok(out.width<=3840&&out.height<=2160&&out.width<=limit&&out.height<=limit);
  assert.ok(Math.abs(out.width/out.height-w/h)<.003);
 }
 assert.deepEqual(photoDimensions(1600,900),{width:3840,height:2160,aspect:16/9});
});
