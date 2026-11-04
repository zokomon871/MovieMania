import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27019/streamhub';
const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const LOGOS_URL = 'https://iptv-org.github.io/api/logos.json';
const CATEGORIES_URL = 'https://iptv-org.github.io/api/categories.json';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';
const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller'
];

const SERIES_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller'
];

// Parse command line arguments
const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const getParam = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : fallback;
};

const moviesOnly = hasFlag('--movies-only');
const seriesOnly = hasFlag('--series-only');
const channelsOnly = hasFlag('--channels-only');
const syncAll = hasFlag('--all');

// Even distribution limit across all genres
const userGenreLimit = getParam('genre-limit', null);
const totalLimit = parseInt(getParam('limit', syncAll ? '2400' : '600'), 10);
const perGenreLimit = userGenreLimit
  ? parseInt(userGenreLimit, 10)
  : Math.max(10, Math.ceil(totalLimit / ALL_GENRES.length));

async function syncChannels(db) {
  console.log('\n📡 [1/2] Fetching Live TV Channels...');
  const [channels, streams, logos, categories, countries] = await Promise.all([
    fetch(CHANNELS_URL).then((r) => r.json()),
    fetch(STREAMS_URL).then((r) => r.json()),
    fetch(LOGOS_URL).then((r) => r.json()).catch(() => []),
    fetch(CATEGORIES_URL).then((r) => r.json()).catch(() => []),
    fetch(COUNTRIES_URL).then((r) => r.json()).catch(() => []),
  ]);

  const logosMap = new Map();
  for (const l of logos) {
    if (l.channel && l.url && !logosMap.has(l.channel)) logosMap.set(l.channel, l.url);
  }

  const streamsMap = new Map();
  for (const s of streams) {
    if (!s.channel || !s.url || s.status === 'offline') continue;
    const list = streamsMap.get(s.channel) || [];
    list.push({ channel: s.channel, url: s.url, quality: s.quality, status: s.status });
    streamsMap.set(s.channel, list);
  }

  const uniqueChannels = new Map();
  for (const ch of channels) {
    if (ch.is_nsfw || !ch.id) continue;
    const channelStreams = streamsMap.get(ch.id) || [];
    if (channelStreams.length === 0) continue;

    if (!uniqueChannels.has(ch.id)) {
      uniqueChannels.set(ch.id, {
        id: ch.id,
        name: ch.name || ch.id,
        country: ch.country ? ch.country.toUpperCase() : 'INT',
        network: ch.network,
        languages: ch.languages || [],
        categories: ch.categories || ['General'],
        is_nsfw: false,
        is_verified: channelStreams.some((s) => s.url.startsWith('https://') || s.url.includes('akamaized')),
        logo: logosMap.get(ch.id) || ch.logo,
        streams: channelStreams,
        updated_at: new Date(),
      });
    }
  }

  const validChannels = Array.from(uniqueChannels.values());
  console.log(`📦 Deduplicated: ${validChannels.length} unique active channels.`);

  const channelsCol = db.collection('channels');
  await channelsCol.createIndex({ id: 1 }, { unique: true });
  await channelsCol.createIndex({ country: 1 });
  await channelsCol.createIndex({ categories: 1 });
  await channelsCol.createIndex({ is_nsfw: 1 });
  await channelsCol.createIndex({ online: 1 });
  await channelsCol.createIndex({ name: 'text', alt_names: 'text', id: 'text' });

  const batchSize = 1000;
  for (let i = 0; i < validChannels.length; i += batchSize) {
    const batch = validChannels.slice(i, i + batchSize).map((c) => ({
      updateOne: { filter: { id: c.id }, update: { $set: c }, upsert: true },
    }));
    await channelsCol.bulkWrite(batch);
    process.stdout.write(`⏳ Upserted ${Math.min(i + batchSize, validChannels.length)} / ${validChannels.length}\r`);
  }

  if (categories.length > 0) {
    const catCol = db.collection('categories');
    await catCol.deleteMany({});
    await catCol.insertMany(categories);
  }
  if (countries.length > 0) {
    const countryCol = db.collection('countries');
    await countryCol.deleteMany({});
    await countryCol.insertMany(countries);
  }

  console.log(`\n✅ Channels sync finished: ${validChannels.length} stored without duplicates.`);
}

async function syncMovies(db) {
  console.log(`\n🎬 [2/2] Fetching Movies Across All ${ALL_GENRES.length} Genres (${perGenreLimit} per genre, No Duplicates)...`);
  const moviesCol = db.collection('movies');

  await moviesCol.createIndex({ id: 1 }, { unique: true });
  await moviesCol.createIndex({ rating: -1 });
  await moviesCol.createIndex({ year: -1 });
  await moviesCol.createIndex({ genres: 1 });
  await moviesCol.createIndex({ title: 'text', overview: 'text' });

  // Map to enforce 100% deduplication by IMDb ID
  const uniqueMovies = new Map();

  const addMovie = (m, genreName) => {
    if (!m.id || !m.name) return;
    if (uniqueMovies.has(m.id)) {
      // Merge genre into existing movie so it has full category tags
      const existing = uniqueMovies.get(m.id);
      if (genreName && !existing.genres.includes(genreName)) {
        existing.genres.push(genreName);
      }
      return;
    }
    const genres = Array.isArray(m.genres) ? [...m.genres] : [];
    if (genreName && !genres.includes(genreName)) genres.push(genreName);

    uniqueMovies.set(m.id, {
      id: m.id,
      title: m.name,
      year: m.releaseInfo || m.year || '',
      overview: m.description || '',
      poster: m.poster || null,
      backdrop: m.background || m.poster || null,
      rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
      genres,
      type: 'movie',
      updated_at: new Date(),
    });
  };

  // 1. Fetch from every single genre evenly
  const pagesNeeded = Math.ceil(perGenreLimit / 20);

  for (const genre of ALL_GENRES) {
    let collectedForGenre = 0;
    for (let page = 0; page < pagesNeeded; page++) {
      const skip = page * 20;
      const skipParam = skip > 0 ? `skip=${skip}&` : '';
      const url = `${CINEMETA_URL}/catalog/movie/top/${skipParam}genre=${encodeURIComponent(genre)}.json`;

      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data.metas)) {
          for (const m of data.metas) {
            addMovie(m, genre);
            collectedForGenre++;
            if (collectedForGenre >= perGenreLimit) break;
          }
        }
      } catch {
        // Skip page on network issue
      }
      if (collectedForGenre >= perGenreLimit) break;
    }
    console.log(`  ✓ ${genre.padEnd(12)} : ${collectedForGenre} titles collected (Total unique: ${uniqueMovies.size})`);
  }

  // 2. Also fetch the overall top-rated general catalog
  console.log(`⏳ Adding top-rated global blockbusters...`);
  try {
    const res = await fetch(`${CINEMETA_URL}/catalog/movie/top.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.metas)) {
        for (const m of data.metas) addMovie(m, 'Top Rated');
      }
    }
  } catch {}

  const movieBatch = Array.from(uniqueMovies.values()).map((m) => ({
    updateOne: { filter: { id: m.id }, update: { $set: m }, upsert: true },
  }));

  if (movieBatch.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < movieBatch.length; i += batchSize) {
      await moviesCol.bulkWrite(movieBatch.slice(i, i + batchSize));
    }
    console.log(`\n✅ Stored ${movieBatch.length} unique movies evenly across all genres (0 duplicates).`);
  }
}

async function syncSeries(db) {
  console.log(`\n📺 [3/3] Fetching TV Shows & Series Across All ${SERIES_GENRES.length} Genres (${perGenreLimit} per genre, No Duplicates)...`);
  const seriesCol = db.collection('series');

  await seriesCol.createIndex({ id: 1 }, { unique: true });
  await seriesCol.createIndex({ rating: -1 });
  await seriesCol.createIndex({ year: -1 });
  await seriesCol.createIndex({ genres: 1 });
  await seriesCol.createIndex({ title: 'text', overview: 'text' });

  // Map to enforce 100% deduplication by IMDb ID
  const uniqueSeries = new Map();

  const addSeries = (s, genreName) => {
    if (!s.id || !s.name) return;
    if (uniqueSeries.has(s.id)) {
      const existing = uniqueSeries.get(s.id);
      if (genreName && !existing.genres.includes(genreName)) {
        existing.genres.push(genreName);
      }
      return;
    }
    const genres = Array.isArray(s.genres) ? [...s.genres] : [];
    if (genreName && !genres.includes(genreName)) genres.push(genreName);

    uniqueSeries.set(s.id, {
      id: s.id,
      title: s.name,
      year: s.releaseInfo || s.year || '',
      overview: s.description || '',
      poster: s.poster || null,
      backdrop: s.background || s.poster || null,
      rating: s.imdbRating ? parseFloat(s.imdbRating) : 0,
      genres,
      seasonsCount: 1,
      episodes: [],
      type: 'series',
      updated_at: new Date(),
    });
  };

  // 1. Fetch from every single TV genre evenly
  const pagesNeeded = Math.ceil(perGenreLimit / 20);

  for (const genre of SERIES_GENRES) {
    let collectedForGenre = 0;
    for (let page = 0; page < pagesNeeded; page++) {
      const skip = page * 20;
      const skipParam = skip > 0 ? `skip=${skip}&` : '';
      const url = `${CINEMETA_URL}/catalog/series/top/${skipParam}genre=${encodeURIComponent(genre)}.json`;

      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data.metas)) {
          for (const s of data.metas) {
            addSeries(s, genre);
            collectedForGenre++;
            if (collectedForGenre >= perGenreLimit) break;
          }
        }
      } catch {}
      if (collectedForGenre >= perGenreLimit) break;
    }
    console.log(`  ✓ ${genre.padEnd(14)} : ${collectedForGenre} titles collected (Total unique: ${uniqueSeries.size})`);
  }

  // 2. Also fetch top-rated global television series
  console.log(`⏳ Adding top-rated global TV series...`);
  try {
    const res = await fetch(`${CINEMETA_URL}/catalog/series/top.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.metas)) {
        for (const s of data.metas) addSeries(s, 'Top Rated');
      }
    }
  } catch {}

  const seriesBatch = Array.from(uniqueSeries.values()).map((s) => ({
    updateOne: { filter: { id: s.id }, update: { $set: s }, upsert: true },
  }));

  if (seriesBatch.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < seriesBatch.length; i += batchSize) {
      await seriesCol.bulkWrite(seriesBatch.slice(i, i + batchSize));
    }
    console.log(`\n✅ Stored ${seriesBatch.length} unique TV series evenly across all genres (0 duplicates).`);
  }
}

async function main() {
  console.log('🚀 Connecting to MongoDB at:', MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('streamhub');
  console.log('✅ Connected to MongoDB.');

  if (seriesOnly) {
    await syncSeries(db);
  } else if (moviesOnly) {
    await syncMovies(db);
  } else if (channelsOnly) {
    await syncChannels(db);
  } else {
    await syncChannels(db);
    await syncMovies(db);
    await syncSeries(db);
  }

  await client.close();
  console.log('\n🎉 Sync finished successfully! Database is up to date.');
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
