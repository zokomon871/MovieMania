export type VODServer = 'modiplay' | 'iqsmart' | 'vidsrc' | 'vidlink' | 'cinesrc';

const IQ_KEY = 'e11a7debaaa4f5d25b671706ffe4d2acb56efbd4';

export function getMovieStreamUrls(id: string | number, tmdbId?: string | number): Record<VODServer, string> {
  const vidId = tmdbId || id;
  return {
    modiplay: `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${vidId}`,
    iqsmart: `https://streams.iqsmartgames.com/embed/movie/${id}?key=${IQ_KEY}`,
    vidsrc: `https://vidsrc.mov/embed/movie/${id}`,
    vidlink: `https://vidlink.pro/movie/${vidId}?primaryColor=ffd200`,
    cinesrc: `https://cinesrc.st/embed/movie/${id}`,
  };
}

export function getSeriesStreamUrls(id: string, season = 1, episode = 1, tmdbId?: string | number): Record<VODServer, string> {
  const vidId = tmdbId || id;
  const tvId = tmdbId || id;
  return {
    modiplay: `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${vidId}&s=${season}&e=${episode}`,
    iqsmart: `https://streams.iqsmartgames.com/embed/tv/${tvId}/${season}/${episode}?key=${IQ_KEY}`,
    vidsrc: `https://vidsrc.mov/embed/tv/${id}/${season}/${episode}`,
    vidlink: `https://vidlink.pro/tv/${vidId}/${season}/${episode}?primaryColor=ffd200`,
    cinesrc: `https://cinesrc.st/embed/tv/${id}?s=${season}&e=${episode}`,
  };
}

export function getStreamEmbedUrl(id: string | number, server: VODServer = 'modiplay', tmdbId?: string | number): string {
  return getMovieStreamUrls(id, tmdbId)[server];
}

export function getSeriesStreamEmbedUrl(id: string, season = 1, episode = 1, server: VODServer = 'modiplay', tmdbId?: string | number): string {
  return getSeriesStreamUrls(id, season, episode, tmdbId)[server];
}

export const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return FALLBACK_POSTER;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatRating(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'NR';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return !isNaN(num) && num > 0 ? num.toFixed(1) : 'NR';
}

export function formatYear(val: unknown): string {
  if (!val) return 'N/A';
  return String(val).substring(0, 4) || 'N/A';
}
