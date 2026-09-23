export type RecoveryKind='assets'|'graphics'|'context'|'demo'|'timeout'|'startup';
export const RECOVERY_REPORT_KEY='slingmods-last-startup-error-v1';

export function classifyStartupError(error:unknown):RecoveryKind{
 const message=error instanceof Error?error.message:String(error);
 if(/demo session/i.test(message))return 'demo';
 if(/loading timed out/i.test(message))return 'timeout';
 if(/webgl|graphics context|error creating.*context/i.test(message))return 'graphics';
 if(/fetch|network|failed to load|load failed|loading chunk/i.test(message))return 'assets';
 return 'startup';
}

/** Diagnostic text only: never include the build fragment, transfer payload or career record. */
function clean(text:string){return text.replace(/https?:\/\/[^\s"'<>]+/g,value=>{try{const url=new URL(value);url.search='';url.hash='';return url.href}catch{return '[resource URL]'}}).slice(0,5000)}
export function recoveryReport(kind:RecoveryKind,error:unknown,context:{scene:string;build:string;elapsedMs:number}){
 return {version:1,kind,scene:context.scene,build:context.build,at:new Date().toISOString(),elapsedMs:Math.round(context.elapsedMs),name:error instanceof Error?error.name:'Error',message:clean(error instanceof Error?error.message:String(error??kind)),stack:error instanceof Error&&error.stack?clean(error.stack):undefined};
}
export function retainRecoveryReport(report:ReturnType<typeof recoveryReport>,storage:Pick<Storage,'setItem'>){try{storage.setItem(RECOVERY_REPORT_KEY,JSON.stringify(report))}catch{/* Recovery must still work when browser storage is unavailable. */}}

export function recoveryCopy(kind:RecoveryKind,scene:string){
 const place=scene==='bay'||scene==='career'?'Your career':scene==='express'||scene==='ridge'||scene==='crew'||scene==='harbor'?'The drive':'The showroom';
 if(kind==='demo')return {heading:'This demo session needs a reset',message:'Your demo session cannot be read. Return to Development Preview and choose Reset demo. This resets only the prepared demo profile; your saved career is preserved.'};
 if(kind==='context')return {heading:'Graphics connection interrupted',message:'The game is paused. Reload to create a fresh graphics and audio session. This interrupts the current attempt; your saved career is preserved.'};
 if(kind==='graphics')return {heading:'WebGL 2 is unavailable',message:'This preview needs a desktop browser with WebGL 2 enabled. Check browser graphics support, then retry.'};
 if(kind==='timeout')return {heading:place+' is taking too long to load',message:'Loading did not finish in time. Retry the page to start a fresh loading session. Your saved career has not been reset.'};
 return {heading:place+' could not finish loading',message:kind==='assets'?'A required game file could not load. Retry the page. Your saved career has not been reset.':'The game encountered an error while starting. Retry the page. Your saved career has not been reset.'};
}
