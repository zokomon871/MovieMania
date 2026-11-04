import { getSeriesCollection } from './mongodb';
import { getCachedJson, setCachedJson } from './redis';
import { ISeries, IEpisode } from './types';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

function toPlain(d: any): ISeries {
  return {
    id: d.id, title: d.title, year: d.year || '', overview: d.overview || '',
    poster: d.poster || null, backdrop: d.backdrop || null, rating: d.rating || 0,
    genres: Array.isArray(d.genres) ? d.genres : [], seasonsCount: d.seasonsCount || 1,
    episodes: Array.isArray(d.episodes) ? d.episodes : [],
  };
}

function hasDuplicateEpisodes(eps: IEpisode[]): boolean {
  const seen = new Set<string>();
  for (const e of eps) {
    const k = `${e.season}:${e.episode}`;
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}
export async function getTrendingSeriesFromDb(limit = 20): Promise<ISeries[]> {
  const cached = await getCachedJson<ISeries[]>(`series:trending:${limit}`);
  if (cached) return cached;
  try {
    const col = await getSeriesCollection();
    const docs = (await col.find({}).sort({ rating: -1 }).limit(limit).toArray()).map(toPlain);
    if (docs.length > 0) await setCachedJson(`series:trending:${limit}`, docs, 600);
    return docs;
  } catch { return []; }
}
export async function getPopularSeriesFromDb(page = 1, limit = 20): Promise<ISeries[]> {
  const cached = await getCachedJson<ISeries[]>(`series:pop:${page}:${limit}`);
  if (cached) return cached;
  try {
    const col = await getSeriesCollection();
    const docs = (await col.find({}).sort({ year: -1, rating: -1 }).skip(Math.max(0, (page - 1) * limit)).limit(limit).toArray()).map(toPlain);
    if (docs.length > 0) await setCachedJson(`series:pop:${page}:${limit}`, docs, 600);
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
    await setCachedJson(`series:${id}`, plain, 3600);
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
    if (batch.length > 0) await col.bulkWrite(batch);
  } catch (err) { console.warn('[SeriesService] Save error:', err); }
}
export async function fetchSeriesDetails(id: string): Promise<ISeries | null> {
  const local = await getSeriesByIdFromDb(id);
  if (local?.episodes?.length && !hasDuplicateEpisodes(local.episodes)) return local;

  try {
    const res = await fetch(`${CINEMETA_URL}/meta/series/${id}.json`);
    if (!res.ok) return local;
    const data = await res.json();
    if (!data.meta?.id || !data.meta?.name) return local;

    const m = data.meta;
    const seen = new Set<string>();
    const episodes: IEpisode[] = [];

    for (const v of m.videos || []) {
      const season = v.season !== undefined ? Number(v.season) : (v.seasonNum !== undefined ? Number(v.seasonNum) : 1);
      const episode = v.episode !== undefined ? Number(v.episode) : (v.number !== undefined ? Number(v.number) : 1);
      if (season <= 0 || episode <= 0) continue;
      const key = `${season}:${episode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      episodes.push({
        id: v.id || `${m.id}:${season}:${episode}`,
        season, episode,
        title: v.name || v.title || `Episode ${episode}`,
        overview: v.overview || v.description || '',
        thumbnail: v.thumbnail || null,
      });
    }

    episodes.sort((a, b) => a.season !== b.season ? a.season - b.season : a.episode - b.episode);

    const seriesDoc: ISeries = {
      id: m.id, title: m.name, year: m.releaseInfo || m.year || '',
      overview: m.description || '', poster: m.poster || null,
      backdrop: m.background || m.poster || null, rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
      genres: Array.isArray(m.genres) ? m.genres : [],
      seasonsCount: episodes.reduce((max, ep) => Math.max(max, ep.season), 1),
      episodes,
    };

    await saveDiscoveredSeriesToDb([seriesDoc]);
    return seriesDoc;
  } catch { return local; }
}

export async function searchSeries(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1): Promise<ISeries[]> {
  const local = await searchSeriesFromDb(query, genre, sortBy, minRating, page, 24);
  if (local.length > 0) return local;
  if (!query.trim() && (!genre || genre === 'All')) return [];

  try {
    const q = query.trim();
    const endpoint = q ? `/catalog/series/top/search=${encodeURIComponent(q)}.json` : `/catalog/series/top/genre=${encodeURIComponent(genre)}.json`;
    const res = await fetch(`${CINEMETA_URL}${endpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    const raw = Array.isArray(data.metas) ? data.metas : [];

    const discovered: ISeries[] = raw.filter((s: any) => s.id && s.name).map((s: any) => ({
      id: s.id, title: s.name, year: s.releaseInfo || s.year || '',
      overview: s.description || '', poster: s.poster || null,
      backdrop: s.background || s.poster || null, rating: s.imdbRating ? parseFloat(s.imdbRating) : 0,
      genres: Array.isArray(s.genres) ? s.genres : genre && genre !== 'All' ? [genre] : [],
      seasonsCount: 1,
    }));

    if (discovered.length > 0) await saveDiscoveredSeriesToDb(discovered);
    return discovered;
  } catch { return []; }
}
