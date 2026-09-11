const mode = new URLSearchParams(location.search).get('scene') ?? 'bay';
if (mode === 'calibration') {
  document.querySelector('#stage')!.textContent='P00 / CALIBRATION';
  document.querySelector('#title')!.textContent='Materials. Scale. Motion.';
  document.querySelector('#subtitle')!.textContent='Blender to glTF to Three.js - neutral calibration fixture';
  await import('./calibration');
} else if(mode==='harbor') await import('./harbor');
else await import('./workbench');
export {};
