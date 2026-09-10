const mode = new URLSearchParams(location.search).get('scene') ?? 'calibration';
if (mode === 'calibration') await import('./calibration');
else await import('./workbench');
export {};
