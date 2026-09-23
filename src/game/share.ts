import {gameCue} from './audio-bus';
import {stamp} from './shell';
/**
 * Shareable result card: grabs the next rendered frame (read in the same task as the render, like photo mode), composes
 * a branded 1200x630 card on a 2D canvas and hands it to the system share sheet, falling back to a PNG download.
 */
let waiting:((c:HTMLCanvasElement)=>void)[]=[];
/** Call right after the drive renders a frame. */
export function afterRender(canvas:HTMLCanvasElement){if(!waiting.length)return;const grab=document.createElement('canvas');grab.width=canvas.width;grab.height=canvas.height;grab.getContext('2d')!.drawImage(canvas,0,0);const w=waiting;waiting=[];for(const f of w)f(grab)}
const nextFrame=()=>new Promise<HTMLCanvasElement>(resolve=>{waiting.push(resolve);setTimeout(()=>{if(waiting.includes(resolve)){waiting=waiting.filter(f=>f!==resolve);const c=document.querySelector<HTMLCanvasElement>('#app canvas,canvas');const grab=document.createElement('canvas');grab.width=c?.width??1200;grab.height=c?.height??630;resolve(grab)}},1500)});
const image=(src:string)=>new Promise<HTMLImageElement|null>(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
export interface ShareData {headline:string;kicker:string;course:string;detail:string[];accent?:string}
export async function composeCard(d:ShareData){
 const W=1200,H=630,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d')!;
 const [frame,logo]=await Promise.all([nextFrame(),image('/assets/brand/slingmods-logo-main.png')]);
 try{await Promise.all([document.fonts.load('italic 800 120px "Barlow Condensed"'),document.fonts.load('800 20px Manrope')])}catch{/* fallback fonts */}
 const s=Math.max(W/frame.width,H/frame.height);g.drawImage(frame,(W-frame.width*s)/2+120,(H-frame.height*s)/2,frame.width*s,frame.height*s);
 let grad=g.createLinearGradient(0,0,W,0);grad.addColorStop(0,'rgba(7,8,10,.96)');grad.addColorStop(.46,'rgba(7,8,10,.78)');grad.addColorStop(.75,'rgba(7,8,10,.05)');g.fillStyle=grad;g.fillRect(0,0,W,H);
 grad=g.createLinearGradient(0,H,0,H-180);grad.addColorStop(0,'rgba(7,8,10,.9)');grad.addColorStop(1,'rgba(7,8,10,0)');g.fillStyle=grad;g.fillRect(0,H-180,W,180);
 const accent=d.accent??'#ff3b2f';g.save();g.transform(1,0,-.14,1,0,0);g.fillStyle=accent;g.fillRect(40+70,0,10,H);g.restore();
 if(logo){const lw=210,lh=logo.height*lw/logo.width;g.drawImage(logo,64,54,lw,lh)}
 g.fillStyle='rgba(255,255,255,.62)';g.font='800 16px Manrope, "Segoe UI", sans-serif';g.letterSpacing='5px';g.fillText('THREE-WHEEL TOUR',66,140);
 g.fillStyle=accent;g.font='800 20px Manrope, "Segoe UI", sans-serif';g.letterSpacing='6px';g.fillText(d.kicker.toUpperCase(),66,236);
 g.fillStyle='#f6f5ef';g.font='italic 800 132px "Barlow Condensed", "Arial Narrow", sans-serif';g.letterSpacing='0px';g.fillText(d.headline,58,360);
 g.font='italic 800 44px "Barlow Condensed", "Arial Narrow", sans-serif';g.fillText(d.course.toUpperCase(),62,420);
 g.fillStyle='rgba(255,255,255,.78)';g.font='700 21px Manrope, "Segoe UI", sans-serif';d.detail.forEach((line,i)=>g.fillText(line,64,470+i*32));
 g.fillStyle='rgba(255,255,255,.5)';g.font='800 14px Manrope, "Segoe UI", sans-serif';g.letterSpacing='4px';g.fillText('SLINGMODS.COM',64,H-40);g.textAlign='right';g.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}).toUpperCase(),W-48,H-40);
 return c;
}
export async function shareCard(d:ShareData){
 gameCue('gx.select');const card=await composeCard(d);const blob=await new Promise<Blob|null>(r=>card.toBlob(r,'image/png'));if(!blob)return;
 const file=new File([blob],`slingmods-tour-${Date.now()}.png`,{type:'image/png'}),nav=navigator as Navigator&{canShare?(d:{files:File[]}):boolean};
 if(nav.canShare?.({files:[file]})&&matchMedia('(pointer:coarse)').matches){try{await nav.share({files:[file],title:'SlingMods Three-Wheel Tour',text:`${d.headline} · ${d.course}`});return}catch{/* cancelled: fall through to download */}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);stamp('SAVED','Result card downloaded','good');
}
