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
  if (local.length > 0) return local;

  try {
    const res = await fetch(`${CINEMETA_URL}/catalog/movie/top.json`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return (data.metas || []).map(normalizeMeta);
  } catch {
    return [];
  }
}

export async function getPopularMovies(page = 1): Promise<ITMDBMovie[]> {
  const local = await getPopularMoviesFromDb(page, 20);
  if (local.length > 0) return local;

  try {
    const skip = Math.max(0, (page - 1) * 20);
    const url = skip > 0 ? `${CINEMETA_URL}/catalog/movie/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/movie/top.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return (data.metas || []).map(normalizeMeta);
  } catch {
    return [];
  }
}

export async function searchMovies(
  query = '',
  genre = '',
  sortBy = 'rating',
  minRating = 0,
  page = 1
): Promise<ITMDBMovie[]> {
  // 1. Strictly check local database first!
  const local = await searchMoviesFromDb(query, genre, sortBy, minRating, page, 24);
  if (local.length > 0) return local; // Found in DB -> NEVER fetch externally!

  // 2. Only fetch when NOT in database
  if (!query.trim() && (!genre || genre === 'All')) return [];

  try {
    const q = query.trim();
    const endpoint = q
      ? `/catalog/movie/top/search=${encodeURIComponent(q)}.json`
      : `/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`;
    const res = await fetch(`${CINEMETA_URL}${endpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    const rawMetas = Array.isArray(data.metas) ? data.metas : [];

    // Record newly discovered movies in MongoDB with 0 duplicates
    const toSave: IMovie[] = rawMetas
      .filter((m: any) => m.id && m.name)
      .map((m: any) => ({
        id: m.id,
        title: m.name,
        year: m.releaseInfo || m.year || '',
        overview: m.description || '',
        poster: m.poster || null,
        backdrop: m.background || m.poster || null,
        rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
        genres: Array.isArray(m.genres) ? m.genres : genre && genre !== 'All' ? [genre] : [],
        type: 'movie',
      }));

    if (toSave.length > 0) {
      await saveDiscoveredMoviesToDb(toSave);
    }

    return rawMetas.map(normalizeMeta);
  } catch {
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<ITMDBMovie | null> {
  // 1. Strictly check local database first!
  const local = await getMovieByIdFromDb(id);
  if (local) return local; // Found in DB -> NEVER fetch externally!

  // 2. Only fetch when NOT in database
  try {
    const res = await fetch(`${CINEMETA_URL}/meta/movie/${id}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.meta?.id || !data.meta?.name) return null;

    const m = data.meta;
    const movieDoc: IMovie = {
      id: m.id,
      title: m.name,
      year: m.releaseInfo || m.year || '',
      overview: m.description || '',
      poster: m.poster || null,
      backdrop: m.background || m.poster || null,
      rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
      genres: Array.isArray(m.genres) ? m.genres : [],
      type: 'movie',
      tmdbId: m.moviedb_id || m.tmdb_id || undefined,
    };

    // Record discovered movie in MongoDB
    await saveDiscoveredMoviesToDb([movieDoc]);
    return normalizeMeta(m);
  } catch {
    return null;
  }
}

export { getStreamEmbedUrl, getImageUrl } from './mediaUtils';
