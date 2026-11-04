export function getStreamEmbedUrl(id: string | number): string {
  return `https://vidsrc.mov/embed/movie/${id}`;
}

export function getSeriesStreamEmbedUrl(id: string, season = 1, episode = 1): string {
  return `https://vidsrc.mov/embed/tv/${id}/${season}/${episode}`;
}

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
