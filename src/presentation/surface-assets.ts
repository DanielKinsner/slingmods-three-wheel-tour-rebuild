/** Existing matched scans only. Dimensions come from P11 material-library.json; lawn uses the retained scan. */
const P11='/assets/p11/',QUALITY='/assets/showcase-quality/textures/';
const set=(root:string,name:string,tile:number)=>({tile,urls:['baseColor','normal','ORM'].map(channel=>P11+root+'/'+name+'-'+channel+'.ktx2'),packed:true});
export const SURFACE_SETS={
 concrete:set('trackside-props','concrete',2),metal:set('trackside-props','metal',.5),wood:set('wooden-sign','cedar',1.8),stone:set('ground-cover','rocks',1.8),
 grass:{tile:2,urls:['Diffuse','nor_gl','Rough'].map(channel=>QUALITY+'leafy_grass_'+channel+'.jpg'),packed:false},
} as const;
export type SurfaceKind=keyof typeof SURFACE_SETS;
export const surfaceAssetURLs=(place:'harbor'|'express'|'ridge'|'showroom')=>[...new Set((place==='showroom'?['concrete','metal','wood']:place==='ridge'?['concrete','metal','wood','stone','grass']:place==='express'?['concrete','metal','wood','grass']:['concrete','metal','wood']).flatMap(kind=>SURFACE_SETS[kind as SurfaceKind].urls))];
