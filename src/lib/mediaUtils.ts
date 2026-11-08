export type VODServer = 'vidsrc' | 'vidlink';

export function getMovieStreamUrls(id: string | number, tmdbId?: string | number): Record<VODServer, string> {
  const vidId = tmdbId || id;
  return {
    vidsrc: `https://vidsrc.mov/embed/movie/${id}`,
    vidlink: `https://vidlink.pro/movie/${vidId}?primaryColor=ffd200`,
  };
}

export function getSeriesStreamUrls(id: string, season = 1, episode = 1, tmdbId?: string | number): Record<VODServer, string> {
  const vidId = tmdbId || id;
  return {
    vidsrc: `https://vidsrc.mov/embed/tv/${id}/${season}/${episode}`,
    vidlink: `https://vidlink.pro/tv/${vidId}/${season}/${episode}?primaryColor=ffd200`,
  };
}

export function getStreamEmbedUrl(id: string | number, server: VODServer = 'vidsrc', tmdbId?: string | number): string {
  return getMovieStreamUrls(id, tmdbId)[server];
}

export function getSeriesStreamEmbedUrl(id: string, season = 1, episode = 1, server: VODServer = 'vidsrc', tmdbId?: string | number): string {
  return getSeriesStreamUrls(id, season, episode, tmdbId)[server];
}

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
