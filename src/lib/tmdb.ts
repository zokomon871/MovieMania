import { ITMDBMovie, IMovie } from './types';
import {
  getTrendingMoviesFromDb,
  getPopularMoviesFromDb,
  searchMoviesFromDb,
  getMovieByIdFromDb,
  saveDiscoveredMoviesToDb,
} from './movieService';
import { getCachedJson, setCachedJson } from './redis';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

// ── In-Memory Ultra-Fast Zero-Latency Cache (0ms) ──
const memoryCache = new Map<string, { data: any; exp: number }>();

function getMem<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setMem<T>(key: string, data: T, ttlSec = 300): void {
  memoryCache.set(key, { data, exp: Date.now() + ttlSec * 1000 });
}

function normalizeMeta(m: any): ITMDBMovie {
  return {
    id: m.id,
    title: m.name || m.title || 'Untitled',
    poster_path: m.poster || null,
    backdrop_path: m.background || m.poster || null,
    overview: m.description || '',
    release_date: m.releaseInfo || m.year || '',
    vote_average: m.imdbRating ? parseFloat(m.imdbRating) : 0,
    tmdbId: m.moviedb_id || m.tmdb_id || undefined,
    cast: Array.isArray(m.cast) ? m.cast : [],
    director: Array.isArray(m.director) ? m.director : [],
  };
}

export async function getTrendingMovies(): Promise<ITMDBMovie[]> {
  const cacheKey = 'movies:realtime:trending:v2';
  const mem = getMem<ITMDBMovie[]>(cacheKey);
  if (mem && mem.length > 0) return mem;

  const cached = await getCachedJson<ITMDBMovie[]>(cacheKey);
  if (cached && cached.length > 0) {
    setMem(cacheKey, cached, 300);
    return cached;
  }

  console.log('[Movies] ⚡ Fetching real-time trending movies from live feed...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${CINEMETA_URL}/catalog/movie/top.json`, {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const metas = (await res.json()).metas || [];
      const items = metas.map(normalizeMeta).filter((m: ITMDBMovie) => m.id && m.title);
      if (items.length > 0) {
        setMem(cacheKey, items, 300);
        await setCachedJson(cacheKey, items, 900);
        saveDiscoveredMoviesToDb(
          items.map((m: ITMDBMovie) => ({
            id: String(m.id),
            title: m.title,
            year: m.release_date,
            overview: m.overview,
            poster: m.poster_path,
            backdrop: m.backdrop_path,
            rating: m.vote_average,
            type: 'movie',
            tmdbId: m.tmdbId,
          }))
        ).catch(() => {});
        return items;
      }
    }
  } catch (err: any) {
    console.warn('[Movies] ⚠️ Live trending fetch error, falling back to database:', err.message);
  }

  const local = await getTrendingMoviesFromDb(20);
  setMem(cacheKey, local, 120);
  return local;
}

export async function getPopularMovies(page = 1): Promise<ITMDBMovie[]> {
  const cacheKey = `movies:realtime:popular:p${page}:v2`;
  const mem = getMem<ITMDBMovie[]>(cacheKey);
  if (mem && mem.length > 0) return mem;

  const cached = await getCachedJson<ITMDBMovie[]>(cacheKey);
  if (cached && cached.length > 0) {
    setMem(cacheKey, cached, 300);
    return cached;
  }

  console.log(`[Movies] ⚡ Fetching real-time popular movies (page ${page}) from live feed...`);
  try {
    const skip = Math.max(0, (page - 1) * 20);
    const url = skip > 0 ? `${CINEMETA_URL}/catalog/movie/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/movie/top.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const metas = (await res.json()).metas || [];
      const items = metas.map(normalizeMeta).filter((m: ITMDBMovie) => m.id && m.title);
      if (items.length > 0) {
        setMem(cacheKey, items, 300);
        await setCachedJson(cacheKey, items, 900);
        saveDiscoveredMoviesToDb(
          items.map((m: ITMDBMovie) => ({
            id: String(m.id),
            title: m.title,
            year: m.release_date,
            overview: m.overview,
            poster: m.poster_path,
            backdrop: m.backdrop_path,
            rating: m.vote_average,
            type: 'movie',
            tmdbId: m.tmdbId,
          }))
        ).catch(() => {});
        return items;
      }
    }
  } catch (err: any) {
    console.warn(`[Movies] ⚠️ Live popular fetch error (page ${page}), falling back to database:`, err.message);
  }

  const local = await getPopularMoviesFromDb(page, 20);
  setMem(cacheKey, local, 120);
  return local;
}

export async function searchMovies(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1): Promise<ITMDBMovie[]> {
  const q = query.trim();
  if (!q && (!genre || genre === 'All')) return [];

  const cacheKey = `search:movies:${q.toLowerCase()}:${genre}:${sortBy}:${page}`;
  const cached = await getCachedJson<ITMDBMovie[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const local = await searchMoviesFromDb(q, genre, sortBy, minRating, page, 24);
  if (local.length > 0) {
    console.log(`[Movies] ✅ Found ${local.length} titles in database for "${q || genre}".`);
    await setCachedJson(cacheKey, local, 7200);
    return local;
  }

  try {
    const endpoint = q ? `/catalog/movie/top/search=${encodeURIComponent(q)}.json` : `/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${CINEMETA_URL}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const rawMetas = (await res.json()).metas || [];
    const toSave: IMovie[] = rawMetas.filter((m: any) => m.id && m.name).map((m: any) => ({
      id: m.id, title: m.name, year: m.releaseInfo || m.year || '', overview: m.description || '', poster: m.poster || null, backdrop: m.background || m.poster || null, rating: m.imdbRating ? parseFloat(m.imdbRating) : 0, genres: Array.isArray(m.genres) ? m.genres : genre && genre !== 'All' ? [genre] : [], type: 'movie',
    }));
    if (toSave.length > 0) saveDiscoveredMoviesToDb(toSave).catch(() => {});

    const results = rawMetas.map(normalizeMeta);
    if (results.length > 0) {
      await setCachedJson(cacheKey, results, 7200);
    }
    return results;
  } catch (err: any) {
    console.warn('[Movies] ⚠️ Search error:', err.message);
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<ITMDBMovie | null> {
  const memKey = `movie:detail:${id}`;
  const mem = getMem<ITMDBMovie>(memKey);
  if (mem) return mem;

  const local = await getMovieByIdFromDb(id);
  // If already in database WITH numeric TMDB ID and overview, return immediately
  if (local && local.tmdbId && local.overview) {
    setMem(memKey, local, 300);
    return local;
  }

  console.log(`[Movies] ℹ️ Movie "${id}" needs enrichment (missing TMDB ID or overview). Fetching from Cinemeta...`);
  try {
    const res = await fetch(`${CINEMETA_URL}/meta/movie/${id}.json`);
    if (!res.ok) return local;
    const m = (await res.json()).meta;
    if (!m?.id || !m?.name) return local;

    const tmdbId = m.moviedb_id || m.tmdb_id || local?.tmdbId || undefined;
    const movieDoc: IMovie = {
      id: m.id,
      title: m.name,
      year: m.releaseInfo || m.year || (local?.release_date || ''),
      overview: m.description || (local?.overview || ''),
      poster: m.poster || (local?.poster_path || null),
      backdrop: m.background || m.poster || (local?.backdrop_path || null),
      rating: m.imdbRating ? parseFloat(m.imdbRating) : (local?.vote_average || 0),
      genres: Array.isArray(m.genres) ? m.genres : [],
      type: 'movie',
      tmdbId,
      cast: Array.isArray(m.cast) ? m.cast : (local?.cast || []),
      director: Array.isArray(m.director) ? m.director : (local?.director || []),
    };

    await saveDiscoveredMoviesToDb([movieDoc]);
    const finalMovie = normalizeMeta({ ...m, moviedb_id: tmdbId });
    setMem(memKey, finalMovie, 300);
    return finalMovie;
  } catch (err: any) {
    console.warn(`[Movies] ⚠️ Failed to fetch details for ${id}:`, err.message);
    return local;
  }
}

export { getStreamEmbedUrl, getImageUrl } from './mediaUtils';
