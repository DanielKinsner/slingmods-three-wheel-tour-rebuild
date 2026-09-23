/** Actual game captures. Old preview files stay intact for historical review builds. */
export function tourRoutePreview(route: string, night: boolean): string | undefined {
  if (!['harbor', 'express', 'ridge'].includes(route)) return undefined;
  return `/assets/interface/${route}-${route === 'ridge' && night ? 'night' : 'day'}.jpg`;
}

/** Illustrated course maps (generated key art, see assets/game-feel/README.md): the route drawn from the real layout. */
export function courseMap(route: string): string | undefined {
  return ['harbor', 'express', 'ridge'].includes(route) ? `/assets/game-feel/maps/${route}.jpg` : undefined;
}
