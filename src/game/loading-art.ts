/**
 * Loading-screen key art (original illustrations generated for this game, see assets/game-feel/README.md). One image per
 * course and light, plus the garage for each ride. Pure lookup from URL-style parameters so the page-change curtain and
 * index.html's inline boot script can pick the same art before any scene code has loaded.
 */
export type ArtId='harbor-day'|'harbor-night'|'express-day'|'express-dusk'|'express-night'|'ridge-day'|'ridge-night'|'garage'|'garage-ryker'|'garage-spyder';
export const ART_DIR='/assets/game-feel/loading/';
export const artUrl=(id:ArtId)=>`${ART_DIR}${id}.jpg`;
const NIGHTISH=/night/,DUSKISH=/dusk/;
/** Course + look -> art. Harbor has day/night art; Express day/dusk/night; Ridge late afternoon / blue hour. */
export function courseArt(route:string,look='day'):ArtId{
 if(route==='ridge')return /night|blue/.test(look)?'ridge-night':'ridge-day';
 if(route==='harbor')return NIGHTISH.test(look)||DUSKISH.test(look)?'harbor-night':'harbor-day';
 return NIGHTISH.test(look)?'express-night':DUSKISH.test(look)?'express-dusk':'express-day';
}
/** Art for a same-origin game URL (used by the curtain for the destination it is heading to). */
export function artForSearch(search:string):ArtId{
 const q=new URLSearchParams(search),scene=q.get('scene')??'',route=q.get('route')??(scene==='ridge'?'ridge':scene==='harbor'||scene==='crew'?'harbor':scene==='express'?'express':'');
 const look=q.get('lighting')??q.get('look')??q.get('preset')??'day';
 if(route)return courseArt(route,look);
 return q.get('visual')==='spyder'?'garage-spyder':q.get('visual')==='ryker'?'garage-ryker':'garage';
}
