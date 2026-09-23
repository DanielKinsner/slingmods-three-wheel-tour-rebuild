/** Dependency-free attract-mode check, so record writers (achievements, splits) can refuse demo runs without pulling in the DOM shell. */
export function isAttract(search=typeof location==='undefined'?'':location.search){return new URLSearchParams(search).get('attract')==='1'}
