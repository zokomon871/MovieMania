import { getMoviesCollection } from './mongodb';
import { getCachedJson, setCachedJson } from './redis';
import { ITMDBMovie, IMovie } from './types';

function toITMDB(m: IMovie): ITMDBMovie {
  return {
    id: m.id,
    title: m.title,
    poster_path: m.poster || null,
    backdrop_path: m.backdrop || m.poster || null,
    overview: m.overview || '',
    release_date: m.year || '',
    vote_average: m.rating || 0,
  };
}

export async function getTrendingMoviesFromDb(limit = 20): Promise<ITMDBMovie[]> {
  const cacheKey = `movies:trending:${limit}`;
  const cached = await getCachedJson<ITMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const col = await getMoviesCollection();
    const docs = await col.find({}).sort({ rating: -1 }).limit(limit).toArray();
    const results = docs.map(toITMDB);
    if (results.length > 0) await setCachedJson(cacheKey, results, 600);
    return results;
  } catch {
    return [];
  }
}

export async function getPopularMoviesFromDb(page = 1, limit = 20): Promise<ITMDBMovie[]> {
  const cacheKey = `movies:popular:${page}:${limit}`;
  const cached = await getCachedJson<ITMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const col = await getMoviesCollection();
    const skip = Math.max(0, (page - 1) * limit);
    const docs = await col.find({}).sort({ year: -1, rating: -1 }).skip(skip).limit(limit).toArray();
    const results = docs.map(toITMDB);
    if (results.length > 0) await setCachedJson(cacheKey, results, 600);
    return results;
  } catch {
    return [];
  }
}

export async function searchMoviesFromDb(
  query = '',
  genre = '',
  sortBy = 'rating',
  minRating = 0,
  page = 1,
  limit = 24
): Promise<ITMDBMovie[]> {
  try {
    const col = await getMoviesCollection();
    const filter: any = {};
    if (query.trim()) {
      filter.$or = [
        { $text: { $search: query.trim() } },
        { title: { $regex: query.trim(), $options: 'i' } },
      ];
    }
    if (genre && genre !== 'All') {
      filter.genres = genre;
    }
    if (minRating > 0) {
      filter.rating = { $gte: minRating };
    }

    const sortOption: any = {};
    if (sortBy === 'year') sortOption.year = -1;
    else if (sortBy === 'title') sortOption.title = 1;
    else sortOption.rating = -1;

    const skip = Math.max(0, (page - 1) * limit);
    const docs = await col.find(filter).sort(sortOption).skip(skip).limit(limit).toArray();
    return docs.map(toITMDB);
  } catch {
    return [];
  }
}

export async function getMovieByIdFromDb(id: string): Promise<ITMDBMovie | null> {
  const cacheKey = `movie:${id}`;
  const cached = await getCachedJson<ITMDBMovie>(cacheKey);
  if (cached) return cached;

  try {
    const col = await getMoviesCollection();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    const result = toITMDB(doc);
    await setCachedJson(cacheKey, result, 3600);
    return result;
  } catch {
    return null;
  }
}

export async function saveDiscoveredMoviesToDb(movies: IMovie[]): Promise<void> {
  if (!movies || movies.length === 0) return;
  try {
    const col = await getMoviesCollection();
    const batch = movies
      .filter((m) => m.id && m.title)
      .map((m) => ({
        updateOne: {
          filter: { id: m.id },
          update: { $set: { ...m, updated_at: new Date() } },
          upsert: true,
        },
      }));
    if (batch.length > 0) {
      await col.bulkWrite(batch);
    }
  } catch (err) {
    console.warn('[MovieService] Save discovered movies error:', err);
  }
}
