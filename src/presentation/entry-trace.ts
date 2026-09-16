/** Wall-clock phase attribution, including render submission and waiting. Not GPU timings. */
export class EntryTrace {
 readonly started=performance.now();readonly stages:{name:string;start:number;end:number;ms:number}[]=[];
 readonly raf:{at:number;interval:number}[]=[];private last=0;private active=true;private firstControl:number|null=null;private firstDriving:number|null=null;
 constructor(){const frame=(now:number)=>{if(!this.active)return;if(this.raf.length<12000)this.raf.push({at:now,interval:this.last?now-this.last:0});this.last=now;requestAnimationFrame(frame)};requestAnimationFrame(frame);addEventListener('pagehide',()=>{this.active=false},{once:true})}
 async measure<T>(name:string,work:()=>T|Promise<T>):Promise<T>{const start=performance.now();try{return await work()}finally{const end=performance.now();this.stages.push({name,start,end,ms:end-start})}}
 record(name:string,start:number){const end=performance.now();this.stages.push({name,start,end,ms:end-start})}
 driving(){this.firstDriving??=performance.now()}
 ready(){this.firstControl=performance.now();this.active=false}
 inspect(){return {started:this.started,firstControllable:this.firstControl,firstDrivingTick:this.firstDriving,readyBoundary:'First rendered ready menu and enabled start controls; firstDrivingTick is separate after user start/countdown',totalMs:(this.firstControl??performance.now())-this.started,stages:this.stages,raf:this.raf,resources:performance.getEntriesByType('resource').map((r:any)=>({url:r.name,start:r.startTime,duration:r.duration,fetchMs:r.responseEnd-r.fetchStart,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize})),method:'Wall-clock stage boundaries and loading RAF intervals. Fetch timing includes cache behavior; load/decode phases overlap network as stated. Waiting is not CPU or GPU rendering cost.'}}
}
