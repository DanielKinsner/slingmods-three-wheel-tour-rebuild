import * as THREE from 'three';
/** Opt-in bounded CPU/RAF collector. No storage, asset scans, GPU queries or readbacks per frame. */
export class RuntimeProfile {
 readonly rows:number[][]=[];readonly events:{wall:number;event:string;data:unknown}[]=[];
 private lightList:THREE.Light[]|undefined;renderMs=0;private lastState='';private lastPrograms=-1;private lastLights='';overflow=0;
 constructor(readonly enabled:boolean){}
 mark(event:string,data:unknown={}){if(this.enabled&&this.events.length<20000)this.events.push({wall:performance.now(),event,data})}
 frame(now:number,interval:number,cpu:number,ticks:number,race:{phase:string;attempt:number;elapsedMs:number},camera:string,renderer:THREE.WebGLRenderer,scene:THREE.Scene){
  if(!this.enabled)return;
  const start=performance.now(),programs=renderer.info.programs?.length??0;
  if(programs!==this.lastPrograms){this.mark('program-count',{from:this.lastPrograms,to:programs});this.lastPrograms=programs}
  const state=[race.phase,race.attempt,camera].join('/');if(state!==this.lastState){this.mark('phase-camera',{state,ticks,elapsedMs:race.elapsedMs});this.lastState=state}
  // Constant small light census only in opt-in profiling, never material/texture census.
  if(!this.lightList){this.lightList=[];scene.traverse(o=>{if(o instanceof THREE.Light)this.lightList!.push(o)})}
  let spots=0,areas=0,emitting=0;this.lightList.forEach(o=>{if(!o.parent||!o.visible)return;if(o instanceof THREE.SpotLight){spots++;if(o.intensity>0)emitting++}if(o instanceof THREE.RectAreaLight)areas++});
  const lights=`${spots}/${areas}/${emitting}`;if(lights!==this.lastLights){this.mark('light-slots',{spots,areas,emitting,ticks,elapsedMs:race.elapsedMs});this.lastLights=lights}
  if(this.rows.length<30000)this.rows.push([now,interval,cpu,this.renderMs,ticks,race.elapsedMs,programs,spots,areas,performance.now()-start,['ready','countdown','running','finished'].indexOf(race.phase),race.attempt]);else this.overflow++;
 }
 export(){return{columns:['rafMs','intervalMs','cpuFrameMs','renderSubmissionMs','ticks','raceMs','programs','residentSpot','residentArea','collectorMs','phaseCode','attempt'],rows:this.rows,events:this.events,overflow:this.overflow,method:'Native RAF timestamps; CPU frame/render-submission times are not GPU timings. 30000-row bound, no truncation of earlier outliers.'}}
}
