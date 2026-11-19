/**
 * MovieMania — Zero-Latency Cache & Database Warming Script
 *
 * Pre-warms MongoDB Atlas and Redis with:
 *  1. Live real-time trending movies & TV series
 *  2. Popular movies & series (pages 1 & 2)
 *  3. Deep metadata enrichment (numeric TMDB IDs, overviews, episodes, cast)
 *  4. High-resolution actor portraits (Wikipedia REST API)
 *
 * Run: node warm.js (or npm run warm)
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

// ── 1. Load Environment Variables from .env.local ──
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27019/streamhub';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6389';
const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

const STATS = {
  moviesCached: 0,
  seriesCached: 0,
  moviesEnriched: 0,
  seriesEnriched: 0,
  redisKeysSet: 0,
  actorsCached: 0,
  errors: 0,
};

// ── Fetch Helper with Timeout ──
async function fetchJson(url, timeoutMs = 6000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MovieMania/2.0 (Cache-Warmer; https://github.com/MovieMania)',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// ── Normalize Functions ──
function normalizeMovie(m) {
  const ratingNum = m.imdbRating ? parseFloat(m.imdbRating) : 0;
  return {
    id: String(m.id || ''),
    title: m.name || m.title || 'Untitled',
    year: String(m.releaseInfo || m.year || ''),
    overview: m.description || '',
    poster: m.poster || null,
    backdrop: m.background || m.poster || null,
    rating: isNaN(ratingNum) ? 0 : ratingNum,
    genres: Array.isArray(m.genres) ? m.genres : [],
    type: 'movie',
    tmdbId: m.moviedb_id || m.tmdb_id || undefined,
    cast: Array.isArray(m.cast) ? m.cast : [],
    director: Array.isArray(m.director) ? m.director : [],
  };
}

function toITMDBMovie(m) {
  return {
    id: m.id,
    title: m.title,
    poster_path: m.poster || null,
    backdrop_path: m.backdrop || m.poster || null,
    overview: m.overview || '',
    release_date: String(m.year || ''),
    vote_average: m.rating || 0,
    tmdbId: m.tmdbId,
    cast: m.cast || [],
    director: m.director || [],
  };
}

function normalizeSeries(s) {
  const ratingNum = s.imdbRating ? parseFloat(s.imdbRating) : 0;
  return {
    id: String(s.id || ''),
    title: s.name || s.title || 'Untitled',
    year: String(s.releaseInfo || s.year || ''),
    overview: s.description || '',
    poster: s.poster || null,
    backdrop: s.background || s.poster || null,
    rating: isNaN(ratingNum) ? 0 : ratingNum,
    genres: Array.isArray(s.genres) ? s.genres : [],
    seasonsCount: 1,
    episodes: [],
    tmdbId: s.moviedb_id || s.tmdb_id || undefined,
    cast: Array.isArray(s.cast) ? s.cast : [],
  };
}

// ── Main Warming Runner ──
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(65));
  console.log('🚀 MOVIEMANIA — ZERO-LATENCY CACHE & DATABASE WARMER');
  console.log('='.repeat(65));

  // 1. Initialize Database & Redis
  console.log('\n[1/5] 🔌 Connecting to Database & Redis...');
  let mongoClient;
  let db;
  let redis;

  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    db = mongoClient.db();
    console.log('  ✅ MongoDB Atlas connected successfully.');
  } catch (err) {
    console.error('  ❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
    });
    await new Promise((resolve, reject) => {
      redis.once('ready', resolve);
      redis.once('error', reject);
    });
    console.log('  ✅ Redis cache connected successfully.');
  } catch (err) {
    console.error('  ❌ Redis connection failed:', err.message);
    if (mongoClient) await mongoClient.close();
    process.exit(1);
  }

  const moviesCol = db.collection('movies');
  const seriesCol = db.collection('series');

  // Helper to set Redis cache with stats
  async function cacheSet(key, value, ttl = 18000) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      STATS.redisKeysSet++;
    } catch (e) {
      STATS.errors++;
    }
  }

  // 2. Fetch Real-time Trending & Popular Movies
  console.log('\n[2/5] 🎬 Warming Movies (Trending & Popular Feeds)...');
  const [topMoviesRaw, popMoviesP2Raw] = await Promise.all([
    fetchJson(`${CINEMETA_URL}/catalog/movie/top.json`),
    fetchJson(`${CINEMETA_URL}/catalog/movie/top/skip=20.json`),
  ]);

  const trendingMetas = (topMoviesRaw && topMoviesRaw.metas) || [];
  const popP2Metas = (popMoviesP2Raw && popMoviesP2Raw.metas) || [];

  const trendingMovies = trendingMetas.map(normalizeMovie).filter((m) => m.id && m.title);
  const popP2Movies = popP2Metas.map(normalizeMovie).filter((m) => m.id && m.title);

  const trendingITMDB = trendingMovies.map(toITMDBMovie);
  const popP2ITMDB = popP2Movies.map(toITMDBMovie);

  // Cache in Redis
  await cacheSet('movies:realtime:trending:v2', trendingITMDB, 3600);
  await cacheSet('movies:trending:20', trendingITMDB.slice(0, 20), 18000);
  await cacheSet('movies:realtime:popular:p1:v2', trendingITMDB.slice(0, 20), 3600);
  await cacheSet('movies:popular:1:20', trendingITMDB.slice(0, 20), 18000);
  await cacheSet('movies:realtime:popular:p2:v2', popP2ITMDB.slice(0, 20), 3600);
  await cacheSet('movies:popular:2:20', popP2ITMDB.slice(0, 20), 18000);

  // Bulk Upsert Movies into MongoDB
  const allMoviesToSave = [...trendingMovies, ...popP2Movies];
  if (allMoviesToSave.length > 0) {
    const batch = allMoviesToSave.map((m) => ({
      updateOne: {
        filter: { id: m.id },
        update: { $set: { ...m, updated_at: new Date() } },
        upsert: true,
      },
    }));
    const res = await moviesCol.bulkWrite(batch);
    STATS.moviesCached += allMoviesToSave.length;
    console.log(`  ✅ Processed ${allMoviesToSave.length} movies (MongoDB: ${res.upsertedCount} new, ${res.modifiedCount} updated).`);
  }

  // 3. Fetch Real-time Trending & Popular TV Series
  console.log('\n[3/5] 📺 Warming TV Series (Trending & Popular Feeds)...');
  const [topSeriesRaw, popSeriesP2Raw] = await Promise.all([
    fetchJson(`${CINEMETA_URL}/catalog/series/top.json`),
    fetchJson(`${CINEMETA_URL}/catalog/series/top/skip=20.json`),
  ]);

  const trendingSeriesMetas = (topSeriesRaw && topSeriesRaw.metas) || [];
  const popSeriesP2Metas = (popSeriesP2Raw && popSeriesP2Raw.metas) || [];

  const trendingSeries = trendingSeriesMetas.map(normalizeSeries).filter((s) => s.id && s.title);
  const popP2Series = popSeriesP2Metas.map(normalizeSeries).filter((s) => s.id && s.title);

  // Cache in Redis
  await cacheSet('series:realtime:trending:l20:v2', trendingSeries.slice(0, 20), 3600);
  await cacheSet('series:realtime:trending:l16:v2', trendingSeries.slice(0, 16), 3600);
  await cacheSet('series:trending:20', trendingSeries.slice(0, 20), 18000);
  await cacheSet('series:trending:16', trendingSeries.slice(0, 16), 18000);
  await cacheSet('series:realtime:popular:p1:l20:v2', trendingSeries.slice(0, 20), 3600);
  await cacheSet('series:pop:1:20', trendingSeries.slice(0, 20), 18000);
  await cacheSet('series:realtime:popular:p2:l20:v2', popP2Series.slice(0, 20), 3600);
  await cacheSet('series:pop:2:20', popP2Series.slice(0, 20), 18000);

  // Bulk Upsert Series into MongoDB
  const allSeriesToSave = [...trendingSeries, ...popP2Series];
  if (allSeriesToSave.length > 0) {
    const batch = allSeriesToSave.map((s) => ({
      updateOne: {
        filter: { id: s.id },
        update: { $set: { ...s, updated_at: new Date() } },
        upsert: true,
      },
    }));
    const res = await seriesCol.bulkWrite(batch);
    STATS.seriesCached += allSeriesToSave.length;
    console.log(`  ✅ Processed ${allSeriesToSave.length} TV series (MongoDB: ${res.upsertedCount} new, ${res.modifiedCount} updated).`);
  }

  // 4. Deep Enrichment of Top 20 Movies & Top 20 Series
  console.log('\n[4/5] 🔍 Deep Enriching Metadata (Numeric TMDB IDs, Episodes, Cast)...');
  const topEnrichMovies = trendingMovies.slice(0, 20);
  const topEnrichSeries = trendingSeries.slice(0, 20);

  const actorNames = new Set();

  // Enrich Movies
  console.log(`  Enriching top ${topEnrichMovies.length} movies...`);
  await Promise.all(
    topEnrichMovies.map(async (m) => {
      try {
        const raw = await fetchJson(`${CINEMETA_URL}/meta/movie/${m.id}.json`, 5000);
        if (raw && raw.meta) {
          const meta = raw.meta;
          const tmdbId = meta.moviedb_id || meta.tmdb_id || m.tmdbId || undefined;
          const enrichedMovie = {
            id: meta.id || m.id,
            title: meta.name || m.title,
            year: meta.releaseInfo || meta.year || m.year,
            overview: meta.description || m.overview,
            poster: meta.poster || m.poster,
            backdrop: meta.background || meta.poster || m.backdrop,
            rating: meta.imdbRating ? parseFloat(meta.imdbRating) : m.rating,
            genres: Array.isArray(meta.genres) ? meta.genres : m.genres,
            type: 'movie',
            tmdbId,
            cast: Array.isArray(meta.cast) ? meta.cast : m.cast,
            director: Array.isArray(meta.director) ? meta.director : m.director,
          };

          if (Array.isArray(enrichedMovie.cast)) {
            enrichedMovie.cast.slice(0, 6).forEach((c) => actorNames.add(c));
          }

          // Update MongoDB
          await moviesCol.updateOne(
            { id: enrichedMovie.id },
            { $set: { ...enrichedMovie, updated_at: new Date() } },
            { upsert: true }
          );

          // Update Redis keys for instant 0ms single item lookup
          const itmdb = toITMDBMovie(enrichedMovie);
          await cacheSet(`movie:${enrichedMovie.id}`, itmdb, 18000);
          await cacheSet(`movie:detail:${enrichedMovie.id}`, itmdb, 3600);
          STATS.moviesEnriched++;
        }
      } catch (err) {
        STATS.errors++;
      }
    })
  );

  // Enrich Series (Episodes & TMDB IDs)
  console.log(`  Enriching top ${topEnrichSeries.length} TV series...`);
  await Promise.all(
    topEnrichSeries.map(async (s) => {
      try {
        const raw = await fetchJson(`${CINEMETA_URL}/meta/series/${s.id}.json`, 5000);
        if (raw && raw.meta) {
          const meta = raw.meta;
          const tmdbId = meta.moviedb_id || meta.tmdb_id || s.tmdbId || undefined;

          // Parse episodes from videos array
          const seen = new Set();
          const episodes = [];
          if (Array.isArray(meta.videos)) {
            for (const v of meta.videos) {
              if (v.season && v.number) {
                const epKey = `${v.season}:${v.number}`;
                if (!seen.has(epKey)) {
                  seen.add(epKey);
                  episodes.push({
                    id: v.id || `${meta.id}:${v.season}:${v.number}`,
                    season: Number(v.season),
                    episode: Number(v.number),
                    title: v.title || `Episode ${v.number}`,
                    overview: v.overview || v.description || '',
                    thumbnail: v.thumbnail || null,
                  });
                }
              }
            }
          }

          const seasonsCount = episodes.reduce((max, e) => Math.max(max, e.season), 1);

          const enrichedSeries = {
            id: meta.id || s.id,
            title: meta.name || s.title,
            year: meta.releaseInfo || meta.year || s.year,
            overview: meta.description || s.overview,
            poster: meta.poster || s.poster,
            backdrop: meta.background || meta.poster || s.backdrop,
            rating: meta.imdbRating ? parseFloat(meta.imdbRating) : s.rating,
            genres: Array.isArray(meta.genres) ? meta.genres : s.genres,
            seasonsCount,
            episodes,
            tmdbId,
            cast: Array.isArray(meta.cast) ? meta.cast : s.cast,
          };

          if (Array.isArray(enrichedSeries.cast)) {
            enrichedSeries.cast.slice(0, 6).forEach((c) => actorNames.add(c));
          }

          // Update MongoDB
          await seriesCol.updateOne(
            { id: enrichedSeries.id },
            { $set: { ...enrichedSeries, updated_at: new Date() } },
            { upsert: true }
          );

          // Update Redis keys for instant 0ms single item lookup
          await cacheSet(`series:${enrichedSeries.id}`, enrichedSeries, 18000);
          await cacheSet(`series:detail:${enrichedSeries.id}`, enrichedSeries, 3600);
          STATS.seriesEnriched++;
        }
      } catch (err) {
        STATS.errors++;
      }
    })
  );

  console.log(`  ✅ Enriched ${STATS.moviesEnriched} movies and ${STATS.seriesEnriched} TV series with full TMDB IDs & episodes.`);

  // 5. Pre-warm Actor Portraits (Top 30 Cast Members)
  console.log('\n[5/5] 🎭 Warming Actor Portraits...');
  const topActors = Array.from(actorNames).slice(0, 30);
  console.log(`  Pre-fetching photos for ${topActors.length} top cast members...`);

  await Promise.all(
    topActors.map(async (name) => {
      try {
        const cacheKey = `actor:img:${name.toLowerCase()}`;
        const existing = await redis.get(cacheKey);
        if (existing !== null) return;

        const formatted = encodeURIComponent(name.replace(/ /g, '_'));
        const wiki = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`, 4000);
        const imageUrl = wiki?.thumbnail?.source || '';
        await redis.setex(cacheKey, imageUrl ? 604800 : 86400, JSON.stringify(imageUrl));
        STATS.redisKeysSet++;
        if (imageUrl) STATS.actorsCached++;
      } catch (err) {
        // Silently continue
      }
    })
  );
  console.log(`  ✅ Cached ${STATS.actorsCached} actor portraits in Redis.`);

  // Cleanup & Summary
  await mongoClient.close();
  redis.disconnect();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(65));
  console.log('🎉 WARMING COMPLETE! All Caches & Database Primed in ' + duration + 's');
  console.log('='.repeat(65));
  console.log(`  🎬 Movies in Feed:        ${STATS.moviesCached}`);
  console.log(`  📺 Series in Feed:        ${STATS.seriesCached}`);
  console.log(`  ⭐ Movies Enriched:       ${STATS.moviesEnriched}`);
  console.log(`  ⭐ Series Enriched:       ${STATS.seriesEnriched}`);
  console.log(`  🎭 Actor Photos Cached:   ${STATS.actorsCached}`);
  console.log(`  ⚡ Total Redis Keys Set:  ${STATS.redisKeysSet}`);
  console.log('='.repeat(65));
}

main().catch((err) => {
  console.error('\n❌ Unhandled warming error:', err);
  process.exit(1);
});
