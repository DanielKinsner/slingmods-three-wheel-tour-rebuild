import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {prepareDayProbe,skyDirection,createNightSky,NIGHT_MOON_DIRECTION} from '../src/presentation/outdoor-environment';
import {harborLighting} from '../src/presentation/harbor-lighting';

test('source HDR solar direction and probe suppression preserve the visible input',()=>{
 const bytes=readFileSync('public/assets/showcase-quality/sky/day-puresky-2k.hdr');
 const hdr=new HDRLoader().setDataType(THREE.FloatType).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 assert.ok(hdr.width&&hdr.height);
 const data=hdr.data as Float32Array,original=data.slice(),result=prepareDayProbe(data,hdr.width,hdr.height);
 assert.deepEqual(data,original);
 assert.ok(result.sunDirection.y>.65&&result.sunDirection.y<.8,'sun elevation should agree with the selected photograph');
 assert.ok(result.maximum>1000*result.ceiling,'actual solar hotspot must be removed from diffuse IBL');
 assert.ok(result.cappedPixels>0&&result.cappedPixels<hdr.width*hdr.height*.02,'only bright hotspot/cloud highlights may be limited');
 for(let i=0;i<result.probe.length;i+=4){const y=.2126*result.probe[i]+.7152*result.probe[i+1]+.0722*result.probe[i+2];assert.ok(Number.isFinite(y)&&y>=0&&y<1.801)}
 assert.ok(result.sunDirection.distanceTo(skyDirection(1218,239,hdr.width,hdr.height))<1e-9);
});

test('night environment has a coherent horizon and finite moon-free illumination',()=>{
 const w=256,h=128,probe=createNightSky(w,h,false),display=createNightSky(w,h,true);
 let brighter=0,maxAngle=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  for(let c=0;c<4;c++)assert.ok(Number.isFinite(probe[i+c])&&probe[i+c]>=0);
  if(display[i]>probe[i]){brighter++;maxAngle=Math.max(maxAngle,skyDirection(x,y,w,h).angleTo(NIGHT_MOON_DIRECTION))}
 }
 assert.ok(brighter>0&&brighter<8);assert.ok(maxAngle<.011);
 assert.ok(probe[(h/2*w)*4]>probe[0],'coastal horizon should be brighter than zenith');
 const upperHorizon=probe[((h/2-1)*w)*4],lowerHorizon=probe[(h/2*w)*4];
 assert.ok(Math.abs(upperHorizon-lowerHorizon)<.008,'night sky must not have a discontinuous dark band below its horizon');
});

test('outdoor light lifecycle removes its lights and returns owned lens materials',()=>{
 const scene=new THREE.Scene(),car=new THREE.Group(),material=new THREE.MeshStandardMaterial();scene.add(car);
 const lens=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),material);lens.name='lights_head__Optical_Lens';car.add(lens);
 for(let attempt=0;attempt<3;attempt++){
  const rig=harborLighting(scene,car,{lamps:[]},'night','standard');assert.notEqual(lens.material,material);
  rig.update(new THREE.Vector3(),0);rig.dispose();assert.equal(lens.material,material);
  let lights=0;scene.traverse(o=>{if(o instanceof THREE.Light)lights++});assert.equal(lights,0);
  assert.equal(scene.children.length,1);assert.equal(car.children.length,1);
 }
 lens.geometry.dispose();material.dispose();
});
