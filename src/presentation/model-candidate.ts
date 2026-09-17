import {VEHICLE_VISUAL} from './vehicle-asset';
/** Honest visual identity while the donor's remaining surface joins are refined. */
export function showModelCandidate(){
 if(VEHICLE_VISUAL!=='josh')return;
 const tag=document.createElement('aside');tag.setAttribute('aria-label','Vehicle candidate status');
 tag.style.cssText='position:fixed;z-index:90;left:50%;transform:translateX(-50%);top:70px;max-width:calc(100vw - 48px);padding:5px 11px;background:#15191ee8;color:#e7edf2;border-left:2px solid #e09b54;font:10px/1.35 Arial,sans-serif;text-align:center;';
 const title=document.createElement('strong');title.textContent='JOSH MODEL · ADAPTATION CANDIDATE';
 const detail=document.createElement('div');detail.textContent='2015 donor → 2024 R · fit refinements pending';
 const link=document.createElement('a');link.textContent='Use current default';link.style.color='#d7e9ff';
 const url=new URL(location.href);url.searchParams.set('visual','legacy');link.href=url.pathname+url.search+url.hash;
 tag.append(title,detail,link);document.body.append(tag);
}
