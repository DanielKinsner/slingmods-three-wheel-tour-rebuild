/** URL lists only (no renderer imports), so the showroom can warm these downloads without pulling in the loaders. */
const P11='/assets/p11/';
export const BASIS_TRANSCODER_URLS=['/assets/basis/basis_transcoder.js','/assets/basis/basis_transcoder.wasm'];
/** Only requested by wet looks. */
export const PUDDLE_MASK_URL=P11+'race-asphalt/puddle-mask.ktx2';
export const RACE_ASPHALT_URLS=['track-4m-baseColor','dry-4m-normal','dry-4m-ORM','detail-normal'].map(n=>P11+'race-asphalt/'+n+'.ktx2');
export const ROAD_DECAL_URLS=[...['baseColor','normal','ORM'].map(n=>P11+'road-decals/'+n+'.ktx2'),P11+'road-decals/atlas.json'];
export const TRACKSIDE_KIT=P11+'trackside-props/';
export const tracksideAssetURLs=(props:readonly string[])=>[...props.flatMap(p=>[0,1,2].map(l=>`${TRACKSIDE_KIT}${p}-lod${l}.glb`)),...['trim-baseColor','trim-normal','trim-ORM','chain-link'].map(n=>TRACKSIDE_KIT+n+'.ktx2')];
export const EXPRESS_PROPS=['armco-straight','jersey-red-white','catch-fence','streetlight','distance-150','distance-100','distance-50']as const;
export const HARBOR_PROPS=['catch-fence','distance-150','distance-100','distance-50']as const;
/** Everything Phase 1 adds to a flat harbour-side route. */
export const speedDressingURLs=(route:'express'|'harbor')=>[...BASIS_TRANSCODER_URLS,...RACE_ASPHALT_URLS,PUDDLE_MASK_URL,...ROAD_DECAL_URLS,...tracksideAssetURLs(route==='express'?EXPRESS_PROPS:HARBOR_PROPS)];
