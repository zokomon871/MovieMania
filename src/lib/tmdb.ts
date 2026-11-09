import { ITMDBMovie, IMovie } from './types';
import {
  getTrendingMoviesFromDb,
  getPopularMoviesFromDb,
  searchMoviesFromDb,
  getMovieByIdFromDb,
  saveDiscoveredMoviesToDb,
} from './movieService';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

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
  };
}

export async function getTrendingMovies(): Promise<ITMDBMovie[]> {
  const local = await getTrendingMoviesFromDb(20);
  if (local.length > 0) {
    console.log(`[Movies] ✅ Loaded ${local.length} trending titles directly from database.`);
    return local;
  }
  console.log('[Movies] ℹ️ Database empty for trending. Fetching from Cinemeta & saving to DB...');
  try {
    const res = await fetch(`${CINEMETA_URL}/catalog/movie/top.json`, { next: { revalidate: 3600 } });
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) await saveDiscoveredMoviesToDb(items.map((m: ITMDBMovie) => ({ id: String(m.id), title: m.title, year: m.release_date, overview: m.overview, poster: m.poster_path, backdrop: m.backdrop_path, rating: m.vote_average, type: 'movie' })));
    return items;
  } catch (err: any) {
    console.warn('[Movies] ⚠️ Failed to fetch trending from Cinemeta:', err.message);
    return [];
  }
}

export async function getPopularMovies(page = 1): Promise<ITMDBMovie[]> {
  const local = await getPopularMoviesFromDb(page, 20);
  if (local.length > 0) {
    console.log(`[Movies] ✅ Loaded ${local.length} popular titles from database (page ${page}).`);
    return local;
  }
  console.log(`[Movies] ℹ️ Page ${page} not in database. Fetching from Cinemeta & saving to DB...`);
  try {
    const skip = Math.max(0, (page - 1) * 20);
    const url = skip > 0 ? `${CINEMETA_URL}/catalog/movie/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/movie/top.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) await saveDiscoveredMoviesToDb(items.map((m: ITMDBMovie) => ({ id: String(m.id), title: m.title, year: m.release_date, overview: m.overview, poster: m.poster_path, backdrop: m.backdrop_path, rating: m.vote_average, type: 'movie' })));
    return items;
  } catch (err: any) {
    console.warn('[Movies] ⚠️ Failed to fetch popular from Cinemeta:', err.message);
    return [];
  }
}

export async function searchMovies(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1): Promise<ITMDBMovie[]> {
  const local = await searchMoviesFromDb(query, genre, sortBy, minRating, page, 24);
  if (local.length > 0) {
    console.log(`[Movies] ✅ Found ${local.length} titles in database for "${query || genre}".`);
    return local;
  }
  if (!query.trim() && (!genre || genre === 'All')) return [];
  console.log(`[Movies] ℹ️ "${query || genre}" not in database. Fetching from Cinemeta & saving to DB...`);
  try {
    const q = query.trim();
    const endpoint = q ? `/catalog/movie/top/search=${encodeURIComponent(q)}.json` : `/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`;
    const res = await fetch(`${CINEMETA_URL}${endpoint}`);
    if (!res.ok) return [];
    const rawMetas = (await res.json()).metas || [];
    const toSave: IMovie[] = rawMetas.filter((m: any) => m.id && m.name).map((m: any) => ({
      id: m.id, title: m.name, year: m.releaseInfo || m.year || '', overview: m.description || '', poster: m.poster || null, backdrop: m.background || m.poster || null, rating: m.imdbRating ? parseFloat(m.imdbRating) : 0, genres: Array.isArray(m.genres) ? m.genres : genre && genre !== 'All' ? [genre] : [], type: 'movie',
    }));
    if (toSave.length > 0) await saveDiscoveredMoviesToDb(toSave);
    return rawMetas.map(normalizeMeta);
  } catch (err: any) {
    console.warn('[Movies] ⚠️ Search error:', err.message);
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<ITMDBMovie | null> {
  const local = await getMovieByIdFromDb(id);
  if (local) {
    console.log(`[Movies] ✅ Loaded "${local.title}" directly from database.`);
    return local;
  }
  console.log(`[Movies] ℹ️ Movie "${id}" not in database. Fetching from Cinemeta & caching...`);
  try {
    const res = await fetch(`${CINEMETA_URL}/meta/movie/${id}.json`);
    if (!res.ok) return null;
    const m = (await res.json()).meta;
    if (!m?.id || !m?.name) return null;
    const movieDoc: IMovie = {
      id: m.id, title: m.name, year: m.releaseInfo || m.year || '', overview: m.description || '', poster: m.poster || null, backdrop: m.background || m.poster || null, rating: m.imdbRating ? parseFloat(m.imdbRating) : 0, genres: Array.isArray(m.genres) ? m.genres : [], type: 'movie', tmdbId: m.moviedb_id || m.tmdb_id || undefined,
    };
    await saveDiscoveredMoviesToDb([movieDoc]);
    return normalizeMeta(m);
  } catch (err: any) {
    console.warn(`[Movies] ⚠️ Failed to fetch details for ${id}:`, err.message);
    return null;
  }
}

export { getStreamEmbedUrl, getImageUrl } from './mediaUtils';
