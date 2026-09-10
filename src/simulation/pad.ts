/** Metres, renderer basis. Visual geometry is authored separately in Blender. */
export const PAD = {
  ground: { center: [0,-0.15,0], size: [700,0.3,700] },
  asphalt: { center: [0,0,0], size: [110,0,220] },
  patches: [
    { id:'wet', center:[-28,0.006,-30], size:[18,0.012,36], mu:0.42 },
    { id:'gravel', center:[28,0.006,-30], size:[18,0.012,36], mu:0.57 },
  ],
  obstacles: [
    { id:'one-wheel-bump', center:[19.12,0.065,15], size:[0.65,0.13,1.3] },
    { id:'curb', center:[30,0.09,15], size:[6,0.18,0.4] },
    { id:'barrier', center:[42,0.6,-60], size:[12,1.2,0.6] },
    { id:'seam-a', center:[-25,0.02,18], size:[8,0.04,4] },
    { id:'seam-b', center:[-25,0.02,13.995], size:[8,0.04,4] },
  ],
  /** Wedge bottom -0.1; top rises from0 at center.z+length/2 to rise at center.z-length/2. */
  ramps: [{id:'incline-launch',center:[-40,0,45],width:6,length:10,rise:0.6}],
} as const;
export function surfaceAt(x:number,z:number): {id:string;mu:number;rolling:number} {
  for(const p of PAD.patches) if(Math.abs(x-p.center[0])<p.size[0]/2 && Math.abs(z-p.center[2])<p.size[2]/2)
    return {id:p.id,mu:p.mu,rolling:p.id==='gravel'?0.042:0.015};
  return Math.abs(x)<55 && Math.abs(z)<110 ? {id:'asphalt',mu:1.05,rolling:0.014} : {id:'grass',mu:0.52,rolling:0.065};
}
