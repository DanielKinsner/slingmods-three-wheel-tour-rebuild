/** Distances from the player's body, in meters; forward is positive. No predicted or scripted traffic. */
export interface NearbyVehicle {id:string;right:number;forward:number;inView?:boolean}
export interface ProximityCue {id:string;side:'left'|'right'|'rear';distance:number}
export function proximityCues(peers:readonly NearbyVehicle[],view:string):ProximityCue[]{
 const nearest=new Map<ProximityCue['side'],ProximityCue>();
 for(const peer of peers){
  if(peer.inView===true)continue;
  if(!['maya','jett','nico'].includes(peer.id)||!Number.isFinite(peer.right)||!Number.isFinite(peer.forward))continue;
  const distance=Math.hypot(peer.right,peer.forward);
  if(distance>11||distance<.1||peer.forward>3.5)continue;
  // A held rearward view already shows the car behind. A normal chase camera can see a car well ahead.
  if(view==='rearward'&&peer.forward<0)continue;
  if(view!=='cockpit'&&peer.forward>1.5&&Math.abs(peer.right)<3)continue;
  const side:ProximityCue['side']=Math.abs(peer.right)<1.8&&peer.forward<0?'rear':peer.right<0?'left':'right';
  const prior=nearest.get(side);if(!prior||distance<prior.distance)nearest.set(side,{id:peer.id,side,distance});
 }
 return [...nearest.values()];
}
