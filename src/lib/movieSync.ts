import { getMoviesCollection } from './mongodb';
import { invalidateCachePattern } from './redis';
import { IMovie } from './types';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

export async function syncMoviesPipeline(maxPages = 5): Promise<number> {
  try {
    const col = await getMoviesCollection();
    const allMetas: any[] = [];

    // Fetch multiple pages of top & popular movies
    for (let page = 0; page < maxPages; page++) {
      const skip = page * 20;
      const url = skip > 0 ? `${CINEMETA_URL}/catalog/movie/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/movie/top.json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.metas)) {
        allMetas.push(...data.metas);
      }
    }

    if (allMetas.length === 0) return 0;

    const movies: IMovie[] = allMetas
      .filter((m) => m.id && m.name)
      .map((m) => ({
        id: m.id,
        title: m.name,
        year: m.releaseInfo || m.year || '',
        overview: m.description || '',
        poster: m.poster || null,
        backdrop: m.background || m.poster || null,
        rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
        genres: m.genres || [],
        type: 'movie',
        updated_at: new Date(),
      }));

    // Deduplicate by ID
    const uniqueMap = new Map<string, IMovie>();
    for (const mov of movies) {
      if (!uniqueMap.has(mov.id)) uniqueMap.set(mov.id, mov);
    }

    const bulk = Array.from(uniqueMap.values()).map((m) => ({
      updateOne: { filter: { id: m.id }, update: { $set: m }, upsert: true },
    }));

    if (bulk.length > 0) {
      await col.bulkWrite(bulk);
    }

    await invalidateCachePattern('movie*');
    return uniqueMap.size;
  } catch (err) {
    console.warn('[MovieSync] Failed to sync movies:', err);
    return 0;
  }
}

