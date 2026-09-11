import type {DeviceSample}from'../driving/input';
/** Shared DeviceSample, native focus and click; no purchase-specific controller shortcut. */
export class BuildMenuInput {
 private armed=false;private prior=[false,false,false,false];
 constructor(private root:HTMLElement,private back:()=>void){}
 reset(){this.armed=false;this.prior=[false,false,false,false]}
 frame(sample:DeviceSample){
  const pad=sample.pads.find(p=>p?.connected&&p.mapping==='standard');if(!sample.focused||!pad){this.reset();return}
  const held=(i:number)=>(pad.buttons[i]?.value??0)>.5;const values=[held(0),held(1),held(12)||held(14)||(pad.axes[1]??0)<-.6,held(13)||held(15)||(pad.axes[1]??0)>.6];
  if(!this.armed){if(pad.buttons.every(b=>b.value<.02)&&pad.axes.every(v=>Math.abs(v)<.15))this.armed=true;this.prior=values;return}
  if(values[1]&&!this.prior[1])this.back();
  else if(values[2]&&!this.prior[2])this.move(-1);
  else if(values[3]&&!this.prior[3])this.move(1);
  else if(values[0]&&!this.prior[0]){const active=document.activeElement;if(active instanceof HTMLElement&&this.root.contains(active))active.click();else this.move(1)}this.prior=values;
 }
 move(direction:number){const choices=[...this.root.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled)')].filter(e=>!e.hidden&&!!e.getClientRects().length);if(!choices.length)return;const current=choices.indexOf(document.activeElement as HTMLElement);choices[(current+direction+choices.length)%choices.length].focus()}
}
