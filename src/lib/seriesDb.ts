import { getSeriesCollection } from './mongodb';
import { getCachedJson, setCachedJson } from './redis';
import { ISeries } from './types';

export const toPlain = (d: any): ISeries => ({
  id: d.id, title: d.title, year: d.year || '', overview: d.overview || '',
  poster: d.poster || null, backdrop: d.backdrop || null, rating: d.rating || 0,
  genres: Array.isArray(d.genres) ? d.genres : [], seasonsCount: d.seasonsCount || 1,
  episodes: Array.isArray(d.episodes) ? d.episodes : [], tmdbId: d.tmdbId || d.moviedb_id,
});

export async function getTrendingSeriesFromDb(limit = 20): Promise<ISeries[]> {
  const cached = await getCachedJson<ISeries[]>(`series:trending:${limit}`);
  if (cached) return cached;
  try {
    const col = await getSeriesCollection();
    const docs = (await col.find({}).sort({ rating: -1 }).limit(limit).toArray()).map(toPlain);
    if (docs.length > 0) await setCachedJson(`series:trending:${limit}`, docs, 18000);
    return docs;
  } catch { return []; }
}

export async function getPopularSeriesFromDb(page = 1, limit = 20): Promise<ISeries[]> {
  const cached = await getCachedJson<ISeries[]>(`series:pop:${page}:${limit}`);
  if (cached) return cached;
  try {
    const col = await getSeriesCollection();
    const docs = (await col.find({}).sort({ year: -1, rating: -1 }).skip(Math.max(0, (page - 1) * limit)).limit(limit).toArray()).map(toPlain);
    if (docs.length > 0) await setCachedJson(`series:pop:${page}:${limit}`, docs, 18000);
    return docs;
  } catch { return []; }
}

export async function searchSeriesFromDb(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1, limit = 24): Promise<ISeries[]> {
  try {
    const col = await getSeriesCollection();
    const filter: any = {};
    if (query.trim()) filter.$or = [{ $text: { $search: query.trim() } }, { title: { $regex: query.trim(), $options: 'i' } }];
    if (genre && genre !== 'All') filter.genres = genre;
    if (minRating > 0) filter.rating = { $gte: minRating };
    const sort: any = sortBy === 'year' ? { year: -1 } : sortBy === 'title' ? { title: 1 } : { rating: -1 };
    return (await col.find(filter).sort(sort).skip(Math.max(0, (page - 1) * limit)).limit(limit).toArray()).map(toPlain);
  } catch { return []; }
}

export async function getSeriesByIdFromDb(id: string): Promise<ISeries | null> {
  const cached = await getCachedJson<ISeries>(`series:${id}`);
  if (cached) return cached;
  try {
    const col = await getSeriesCollection();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    const plain = toPlain(doc);
    await setCachedJson(`series:${id}`, plain, 18000);
    return plain;
  } catch { return null; }
}

export async function saveDiscoveredSeriesToDb(list: ISeries[]): Promise<void> {
  if (!list?.length) return;
  try {
    const col = await getSeriesCollection();
    const batch = list.filter((s) => s.id && s.title).map((s) => ({
      updateOne: { filter: { id: s.id }, update: { $set: { ...s, updated_at: new Date() } }, upsert: true },
    }));
    if (batch.length > 0) {
      const res = await col.bulkWrite(batch);
      console.log(`[Series] 💾 Successfully cached/updated ${batch.length} series in MongoDB (${res.upsertedCount} new).`);
    }
  } catch (err) { console.warn('[SeriesDb] Save error:', err); }
}

