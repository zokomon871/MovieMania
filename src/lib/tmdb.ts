import { ITMDBMovie } from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchFromTMDb(endpoint: string, params: Record<string, string | number> = {}) {
  if (!TMDB_API_KEY) {
    return { results: [] };
  }
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();

  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getTrendingMovies(): Promise<ITMDBMovie[]> {
  try {
    const data = await fetchFromTMDb('/trending/movie/day');
    return data.results || [];
  } catch (err) {
    console.warn('[TMDb] Trending movies fetch failed:', err);
    return [];
  }
}

export async function getPopularMovies(page = 1): Promise<ITMDBMovie[]> {
  try {
    const data = await fetchFromTMDb('/movie/popular', { page });
    return data.results || [];
  } catch (err) {
    console.warn('[TMDb] Popular movies fetch failed:', err);
    return [];
  }
}

export async function searchMovies(query: string, page = 1): Promise<ITMDBMovie[]> {
  if (!query.trim()) return [];
  try {
    const data = await fetchFromTMDb('/search/movie', { query, page });
    return data.results || [];
  } catch (err) {
    console.warn('[TMDb] Search movies fetch failed:', err);
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<ITMDBMovie | null> {
  try {
    return await fetchFromTMDb(`/movie/${id}`);
  } catch {
    return null;
  }
}

export function getStreamEmbedUrl(tmdbId: string): string {
  return `https://vidsrc.mov/embed/movie/${tmdbId}`;
}

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

