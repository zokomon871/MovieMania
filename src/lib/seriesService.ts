import { ISeries, IEpisode } from './types';
import {
  getTrendingSeriesFromDb,
  getPopularSeriesFromDb,
  searchSeriesFromDb,
  getSeriesByIdFromDb,
  saveDiscoveredSeriesToDb,
} from './seriesDb';
import { getCachedJson, setCachedJson } from './redis';

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

// ── In-Memory Ultra-Fast Zero-Latency Cache (0ms) ──
const seriesMemCache = new Map<string, { data: any; exp: number }>();

function getMem<T>(key: string): T | null {
  const item = seriesMemCache.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) {
    seriesMemCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setMem<T>(key: string, data: T, ttlSec = 300): void {
  seriesMemCache.set(key, { data, exp: Date.now() + ttlSec * 1000 });
}

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
  const cacheKey = `series:realtime:trending:l${limit}:v2`;
  const mem = getMem<ISeries[]>(cacheKey);
  if (mem && mem.length > 0) return mem;

  const cached = await getCachedJson<ISeries[]>(cacheKey);
  if (cached && cached.length > 0) {
    setMem(cacheKey, cached, 300);
    return cached;
  }

  console.log('[Series] ⚡ Fetching real-time trending series from live feed...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${CINEMETA_URL}/catalog/series/top.json`, {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const metas = (await res.json()).metas || [];
      const items = metas.map(normalizeMeta).filter((s: ISeries) => s.id && s.title).slice(0, limit);
      if (items.length > 0) {
        setMem(cacheKey, items, 300);
        await setCachedJson(cacheKey, items, 900);
        saveDiscoveredSeriesToDb(items).catch(() => {});
        return items;
      }
    }
  } catch (err: any) {
    console.warn('[Series] ⚠️ Live trending series fetch error, falling back to database:', err.message);
  }

  const local = await getTrendingSeriesFromDb(limit);
  setMem(cacheKey, local, 120);
  return local;
}

export async function getPopularSeries(page = 1, limit = 20): Promise<ISeries[]> {
  const cacheKey = `series:realtime:popular:p${page}:l${limit}:v2`;
  const mem = getMem<ISeries[]>(cacheKey);
  if (mem && mem.length > 0) return mem;

  const cached = await getCachedJson<ISeries[]>(cacheKey);
  if (cached && cached.length > 0) {
    setMem(cacheKey, cached, 300);
    return cached;
  }

  console.log(`[Series] ⚡ Fetching real-time popular series (page ${page}) from live feed...`);
  try {
    const skip = Math.max(0, (page - 1) * limit);
    const url = skip > 0 ? `${CINEMETA_URL}/catalog/series/top/skip=${skip}.json` : `${CINEMETA_URL}/catalog/series/top.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const metas = (await res.json()).metas || [];
      const items = metas.map(normalizeMeta).filter((s: ISeries) => s.id && s.title).slice(0, limit);
      if (items.length > 0) {
        setMem(cacheKey, items, 300);
        await setCachedJson(cacheKey, items, 900);
        saveDiscoveredSeriesToDb(items).catch(() => {});
        return items;
      }
    }
  } catch (err: any) {
    console.warn(`[Series] ⚠️ Live popular series fetch error (page ${page}), falling back to database:`, err.message);
  }

  const local = await getPopularSeriesFromDb(page, limit);
  setMem(cacheKey, local, 120);
  return local;
}

export async function searchSeries(query = '', genre = '', sortBy = 'rating', minRating = 0, page = 1): Promise<ISeries[]> {
  const q = query.trim();
  if (!q && (!genre || genre === 'All')) return [];

  const cacheKey = `search:series:${q.toLowerCase()}:${genre}:${sortBy}:${page}`;
  const cached = await getCachedJson<ISeries[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const local = await searchSeriesFromDb(q, genre, sortBy, minRating, page, 24);
  if (local.length > 0) {
    console.log(`[Series] ✅ Found ${local.length} series in database for "${q || genre}".`);
    await setCachedJson(cacheKey, local, 7200);
    return local;
  }

  try {
    const endpoint = q
      ? `/catalog/series/top/search=${encodeURIComponent(q)}.json`
      : (genre && genre !== 'All'
      ? `/catalog/series/top/genre=${encodeURIComponent(genre)}.json`
      : `/catalog/series/top.json`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${CINEMETA_URL}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const items = ((await res.json()).metas || []).map(normalizeMeta);
    if (items.length > 0) {
      saveDiscoveredSeriesToDb(items).catch(() => {});
      await setCachedJson(cacheKey, items, 7200);
    }
    return items;
  } catch (err: any) {
    console.warn('[Series] ⚠️ Search error:', err.message);
    return [];
  }
}

export async function fetchSeriesDetails(id: string): Promise<ISeries | null> {
  const memKey = `series:detail:${id}`;
  const mem = getMem<ISeries>(memKey);
  if (mem) return mem;

  const local = await getSeriesByIdFromDb(id);
  if (local?.episodes?.length && local?.tmdbId && !hasDuplicateEpisodes(local.episodes)) {
    setMem(memKey, local, 300);
    return local;
  }
  console.log(`[Series] ℹ️ "${id}" needs enrichment (episodes/TMDB ID). Fetching from Cinemeta...`);
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
    const tmdbId = m.moviedb_id || m.tmdb_id || local?.tmdbId || undefined;
    const seriesDoc: ISeries = {
      id: m.id,
      title: m.name,
      year: m.releaseInfo || m.year || (local?.year || ''),
      overview: m.description || (local?.overview || ''),
      poster: m.poster || (local?.poster || null),
      backdrop: m.background || m.poster || (local?.backdrop || null),
      rating: m.imdbRating ? parseFloat(m.imdbRating) : (local?.rating || 0),
      genres: Array.isArray(m.genres) ? m.genres : (local?.genres || []),
      seasonsCount: episodes.reduce((max, ep) => Math.max(max, ep.season), local?.seasonsCount || 1),
      episodes: episodes.length > 0 ? episodes : (local?.episodes || []),
      tmdbId,
      cast: Array.isArray(m.cast) ? m.cast : (local?.cast || [])
    };
    await saveDiscoveredSeriesToDb([seriesDoc]);
    setMem(memKey, seriesDoc, 300);
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
