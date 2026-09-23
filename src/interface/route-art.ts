/** Actual game captures. Old preview files stay intact for historical review builds. */
export function tourRoutePreview(route: string, night: boolean): string | undefined {
  if (!['harbor', 'express', 'ridge'].includes(route)) return undefined;
  return `/assets/interface/${route}-${route === 'ridge' && night ? 'night' : 'day'}.jpg`;
}
