import type {DeviceSample}from'../driving/input';
/** Shared DeviceSample, native focus and click; no purchase-specific controller shortcut. */
export class BuildMenuInput {
 private armed=false;private padKey='';private prior=[false,false,false,false];private horizontal=[false,false];
 constructor(private root:HTMLElement,private back:()=>void,private extraScope?:string){}
 reset(){this.armed=false;this.padKey='';this.prior=[false,false,false,false];this.horizontal=[false,false]}
 frame(sample:DeviceSample){
  // A game-shell modal (Options) owns the controller while open; re-arm only after release, like any new device.
  if(typeof document!=='undefined'&&document.body?.dataset.gxModal){this.reset();return}
  const pad=sample.pads.find(p=>p?.connected&&p.mapping==='standard');if(!sample.focused||!pad){this.reset();return}const key=`${pad.index}:${pad.id}`;if(key!==this.padKey){this.reset();this.padKey=key}
  const held=(i:number)=>(pad.buttons[i]?.value??0)>.5;const values=[held(0),held(1),held(12)||held(14)||(pad.axes[1]??0)<-.6,held(13)||held(15)||(pad.axes[1]??0)>.6];
  if(!this.armed){if(pad.buttons.every(b=>b.value<.02)&&pad.axes.every(v=>Math.abs(v)<.15))this.armed=true;this.prior=values;return}
  const horizontal=[held(14)||(pad.axes[0]??0)<-.6,held(15)||(pad.axes[0]??0)>.6],direction=horizontal[0]&&!this.horizontal[0]?-1:horizontal[1]&&!this.horizontal[1]?1:0;const adjusted=!!direction&&nudgeMenuControl(direction);this.horizontal=horizontal;
  if(adjusted){}else if(values[1]&&!this.prior[1])this.back();
  else if(values[2]&&!this.prior[2])this.move(-1);
  else if(values[3]&&!this.prior[3])this.move(1);
  else if(values[0]&&!this.prior[0]){const active=document.activeElement;if(active instanceof HTMLElement&&(this.root.contains(active)||!!this.extraScope&&!!active.closest(this.extraScope)))active.click();else this.move(1)}this.prior=values;
 }
 move(direction:number){const selector='button:not(:disabled),a[href]:not([aria-disabled=true]),input:not(:disabled),select:not(:disabled),summary';const choices=[...this.root.querySelectorAll<HTMLElement>(selector),...(this.extraScope?[...document.querySelectorAll<HTMLElement>(this.extraScope)].flatMap(root=>[...root.querySelectorAll<HTMLElement>(selector)]):[])].filter(e=>!e.hidden&&!!e.getClientRects().length);if(!choices.length)return;const current=choices.indexOf(document.activeElement as HTMLElement);choices[(current+direction+choices.length)%choices.length].focus()}
}

/** Controller detents follow native input/change events, including persisted audio mix. */
export function nudgeMenuControl(direction:number){const active=document.activeElement;if(active instanceof HTMLInputElement&&active.type==='range'){const step=Number(active.step)||1,min=Number(active.min)||0,max=Number(active.max)||100;active.value=String(Math.max(min,Math.min(max,Number(active.value)+direction*step)));active.dispatchEvent(new Event('input',{bubbles:true}));active.dispatchEvent(new Event('change',{bubbles:true}));return true}if(active instanceof HTMLSelectElement&&!active.disabled){active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+direction));active.dispatchEvent(new Event('change',{bubbles:true}));return true}return false}
