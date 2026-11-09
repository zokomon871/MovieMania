import { ISeries, IEpisode } from './types';
import {
  getTrendingSeriesFromDb,
  getPopularSeriesFromDb,
  searchSeriesFromDb,
  getSeriesByIdFromDb,
  saveDiscoveredSeriesToDb,
} from './seriesDb';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

const normalizeMeta = (s: any): ISeries => ({
  id: s.id, title: s.name || s.title || 'Untitled',
  year: s.releaseInfo || s.year || '', overview: s.description || '',
  poster: s.poster || null, backdrop: s.background || s.poster || null,
  rating: s.imdbRating ? parseFloat(s.imdbRating) : 0,
  genres: Array.isArray(s.genres) ? s.genres : [], seasonsCount: 1,
});

function hasDuplicateEpisodes(eps: IEpisode[]): boolean {
  const seen = new Set<string>();
  for (const e of eps) {
    if (seen.has(`${e.season}:${e.episode}`)) return true;
    seen.add(`${e.season}:${e.episode}`);
  }
  return false;
}

export async function getTrendingSeries(limit = 20): Promise<ISeries[]> {
  const local = await getTrendingSeriesFromDb(limit);
  if (local.length > 0) {
    console.log(`[Series] ✅ Loaded ${local.length} trending series directly from database.`);
    return local;
  }
  console.log('[Series] ℹ️ Database empty for trending. Fetching from Cinemeta & saving to DB...');
  try {
    const res = await fetch(`${CINEMETA_URL}/catalog/series/top.json`, { next: { revalidate: 3600 } });
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) await saveDiscoveredSeriesToDb(items);
    return items;
  } catch (err: any) {
    console.warn('[Series] ⚠️ Failed to fetch trending series:', err.message);
    return [];
  }
}

export async function getPopularSeries(page = 1, limit = 20): Promise<ISeries[]> {
  const local = await getPopularSeriesFromDb(page, limit);
  if (local.length > 0) {
    console.log(`[Series] ✅ Loaded ${local.length} popular series from database (page ${page}).`);
    return local;
  }
  console.log(`[Series] ℹ️ Page ${page} not in database. Fetching from Cinemeta & saving to DB...`);
  try {
    const skip = Math.max(0, (page - 1) * limit);
    const url = skip > 0 ? `${CINEMETA_URL}/catalog/series/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/series/top.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) await saveDiscoveredSeriesToDb(items);
    return items;
  } catch (err: any) {
    console.warn('[Series] ⚠️ Failed to fetch popular series:', err.message);
    return [];
  }
}

export async function searchSeries(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1): Promise<ISeries[]> {
  const local = await searchSeriesFromDb(query, genre, sortBy, minRating, page, 24);
  if (local.length > 0) {
    console.log(`[Series] ✅ Found ${local.length} series in database for "${query || genre}".`);
    return local;
  }
  console.log(`[Series] ℹ️ "${query || genre}" not in database. Fetching from Cinemeta & saving to DB...`);
  try {
    const q = query.trim();
    const endpoint = q ? `/catalog/series/top/search=${encodeURIComponent(q)}.json` : (genre && genre !== 'All' ? `/catalog/series/top/genre=${encodeURIComponent(genre)}.json` : `/catalog/series/top.json`);
    const res = await fetch(`${CINEMETA_URL}${endpoint}`);
    if (!res.ok) return [];
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) await saveDiscoveredSeriesToDb(items);
    return items;
  } catch (err: any) {
    console.warn('[Series] ⚠️ Search error:', err.message);
    return [];
  }
}

export async function fetchSeriesDetails(id: string): Promise<ISeries | null> {
  const local = await getSeriesByIdFromDb(id);
  if (local?.episodes?.length && !hasDuplicateEpisodes(local.episodes)) {
    console.log(`[Series] ✅ Loaded "${local.title}" (${local.episodes.length} episodes) directly from database.`);
    return local;
  }
  console.log(`[Series] ℹ️ "${id}" not in database. Fetching episodes from Cinemeta & caching...`);
  try {
    const res = await fetch(`${CINEMETA_URL}/meta/series/${id}.json`);
    if (!res.ok) return local;
    const m = (await res.json()).meta;
    if (!m?.id || !m?.name) return local;
    const seen = new Set<string>();
    const episodes: IEpisode[] = [];
    for (const v of m.videos || []) {
      const season = Number(v.season ?? v.seasonNum ?? 1);
      const episode = Number(v.episode ?? v.number ?? 1);
      if (season <= 0 || episode <= 0 || seen.has(`${season}:${episode}`)) continue;
      seen.add(`${season}:${episode}`);
      episodes.push({ id: v.id || `${m.id}:${season}:${episode}`, season, episode, title: v.name || v.title || `Episode ${episode}`, overview: v.overview || v.description || '', thumbnail: v.thumbnail || null });
    }
    episodes.sort((a, b) => a.season !== b.season ? a.season - b.season : a.episode - b.episode);
    const seriesDoc: ISeries = { id: m.id, title: m.name, year: m.releaseInfo || m.year || '', overview: m.description || '', poster: m.poster || null, backdrop: m.background || m.poster || null, rating: m.imdbRating ? parseFloat(m.imdbRating) : 0, genres: Array.isArray(m.genres) ? m.genres : [], seasonsCount: episodes.reduce((max, ep) => Math.max(max, ep.season), 1), episodes, tmdbId: m.moviedb_id || m.tmdb_id || undefined };
    await saveDiscoveredSeriesToDb([seriesDoc]);
    return seriesDoc;
  } catch (err: any) {
    console.warn(`[Series] ⚠️ Failed to fetch details for ${id}:`, err.message);
    return local;
  }
}

export {
  getTrendingSeriesFromDb,
  getPopularSeriesFromDb,
  searchSeriesFromDb,
  getSeriesByIdFromDb,
  saveDiscoveredSeriesToDb,
};
