import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import type {LightPreset} from './harbor-lighting';
import type {Look} from './time-of-day';

export const DAY_SKY_URL='/assets/showcase-quality/sky/day-puresky-2k.hdr';
export const NIGHT_MOON_DIRECTION=new THREE.Vector3(-22,42,-28).normalize();
const luminance=(r:number,g:number,b:number)=>.2126*r+.7152*g+.0722*b;

/** HDRLoader rows run north to south; the GPU upload has flipY=true. */
export function skyDirection(x:number,y:number,width:number,height:number){
 const longitude=((x+.5)/width-.5)*Math.PI*2,latitude=(.5-(y+.5)/height)*Math.PI;
 return new THREE.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
}

/** A separate light probe removes the tiny HDR solar hotspot before direct lighting.
 * Clouds/sky and all directional color stay intact. The visible source remains untouched. */
export function prepareDayProbe(data:Float32Array,width:number,height:number){
 const samples:number[]=[];let maximum=-Infinity,sunIndex=0;
 for(let y=0;y<height/2;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,value=luminance(data[i],data[i+1],data[i+2]);
  if(value>maximum){maximum=value;sunIndex=y*width+x}
  if((x&7)===0&&(y&3)===0&&Number.isFinite(value))samples.push(value);
 }
 samples.sort((a,b)=>a-b);const p95=samples[Math.floor((samples.length-1)*.95)]||1;
 const ceiling=p95*2,scale=.9/p95,probe=new Float32Array(data.length);
 let cappedPixels=0;
 for(let i=0;i<data.length;i+=4){
  const value=luminance(data[i],data[i+1],data[i+2]),cap=value>ceiling?ceiling/value:1;
  if(cap<1)cappedPixels++;
  probe[i]=Math.max(0,data[i]*cap*scale);probe[i+1]=Math.max(0,data[i+1]*cap*scale);probe[i+2]=Math.max(0,data[i+2]*cap*scale);probe[i+3]=1;
 }
 return{probe,displayScale:scale,sunDirection:skyDirection(sunIndex%width,Math.floor(sunIndex/width),width,height),p95,ceiling,maximum,cappedPixels};
}

/** An original night sky, not a dimmed daylight photograph or an indoor reflection.
 * A broad coastal horizon gradient lights silhouettes; only the display has a moon disk. */
export function createNightSky(width=512,height=256,moon=true){
 const data=new Float32Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const direction=skyDirection(x,y,width,height),horizon=Math.exp(-Math.abs(direction.y)*5.5);
  const upper=Math.max(0,direction.y),lower=.42+.58*THREE.MathUtils.smoothstep(direction.y,-.12,.015);
  const haze=1+.055*Math.sin(direction.x*11+direction.z*7)*Math.sin(direction.z*19-direction.y*8);
  const rgb=[(.018+.035*horizon-.008*upper)*lower*haze,(.029+.037*horizon-.010*upper)*lower*haze,(.048+.047*horizon-.012*upper)*lower*haze];
  if(moon){const distance=direction.angleTo(NIGHT_MOON_DIRECTION),disk=1-THREE.MathUtils.smoothstep(distance,.006,.011);rgb[0]+=disk*2.8;rgb[1]+=disk*3;rgb[2]+=disk*3.2}
  const i=(y*width+x)*4;data.set([...rgb,1],i);
 }
 return data;
}

function skyTexture(data:Float32Array,width:number,height:number){
 // The photographed solar disk exceeds half-float range; display saturation is
 // harmless here, but infinity would poison subsequent cube-map filtering.
 const half=new Uint16Array(data.length);for(let i=0;i<data.length;i++)half[i]=THREE.DataUtils.toHalfFloat(Math.min(65504,Math.max(0,data[i])));
 const texture=new THREE.DataTexture(half,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;
 texture.flipY=true;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

/** @param look optional Phase 2 time-of-day look. Its HDR sky goes through the same sun-capped probe as the day sky. */
export async function loadOutdoorEnvironment(scene:THREE.Scene,renderer:THREE.WebGLRenderer,preset:LightPreset,look?:Look){
 let background:THREE.DataTexture,probe:THREE.DataTexture,metadata:Record<string,unknown>;
 const skyURL=look?.sky??(preset==='day'?DAY_SKY_URL:null);
 if(skyURL){
  const source=await new HDRLoader().setDataType(THREE.FloatType).loadAsync(skyURL);
  const {data,width,height}=source.image as unknown as {data:Float32Array;width:number;height:number};
  const prepared=prepareDayProbe(data,width,height);
  background=skyTexture(data,width,height);probe=skyTexture(prepared.probe,width,height);source.dispose();
  scene.backgroundIntensity=prepared.displayScale*1.6*(look?.skyGain??1);scene.environmentIntensity=look?.environment??.95;
  scene.userData.outdoorSunDirection=prepared.sunDirection.toArray();
  metadata={source:skyURL,look:look?.id??preset,sourceResolution:[width,height],solarDirection:prepared.sunDirection.toArray(),p95:prepared.p95,probeCap:prepared.ceiling,sourceMaximum:prepared.maximum,cappedPixels:prepared.cappedPixels,normalization:prepared.displayScale,backgroundDisplayGain:1.6,probe:'sun-capped source, PMREM'};
 }else{
  background=skyTexture(createNightSky(1024,512),1024,512);probe=skyTexture(createNightSky(512,256,false),512,256);
  scene.backgroundIntensity=1;scene.environmentIntensity=1;
  scene.userData.outdoorSunDirection=NIGHT_MOON_DIRECTION.toArray();
  metadata={source:'original analytic coastal night sky',sourceResolution:[1024,512],solarDirection:NIGHT_MOON_DIRECTION.toArray(),probe:'moon-free coastal sky, PMREM'};
 }
 const generator=new THREE.PMREMGenerator(renderer);generator.compileEquirectangularShader();
 const environment=generator.fromEquirectangular(probe);generator.dispose();probe.dispose();
 scene.background=background;scene.environment=environment.texture;scene.backgroundBlurriness=0;
 scene.backgroundRotation.set(0,0,0);scene.environmentRotation.set(0,0,0);
 renderer.toneMappingExposure=look?.exposure??(preset==='day'?.95:1.05);
 scene.userData.outdoorEnvironment={...metadata,preset,environmentIntensity:scene.environmentIntensity,backgroundIntensity:scene.backgroundIntensity,exposure:renderer.toneMappingExposure};
 let disposed=false;
 return{inspect:()=>({...scene.userData.outdoorEnvironment}),dispose(){if(disposed)return;disposed=true;if(scene.background===background)scene.background=null;if(scene.environment===environment.texture)scene.environment=null;background.dispose();environment.dispose();delete scene.userData.outdoorSunDirection;delete scene.userData.outdoorEnvironment}};
}
