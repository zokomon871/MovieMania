import { MongoClient } from 'mongodb';
import fs from 'fs';

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync('.env.local')) {
  const match = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.*)/);
  if (match) uri = match[1].trim();
}

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'Western', 'Documentary', 'Family',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCatalog(type, genre, skip) {
  try {
    const ep = genre
      ? `${CINEMETA_URL}/catalog/${type}/top/genre=${encodeURIComponent(genre)}&skip=${skip}.json`
      : `${CINEMETA_URL}/catalog/${type}/top/skip=${skip}.json`;
    const res = await fetch(ep);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.metas) ? data.metas : [];
  } catch {
    return [];
  }
}

async function seed() {
  console.log('🚀 Starting Fast Catalog Seeder (Target: 5,000+ Titles, 0 Duplicates)...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('moviemania');
  const moviesCol = db.collection('movies');
  const seriesCol = db.collection('series');

  await moviesCol.createIndex({ id: 1 }, { unique: true });
  await seriesCol.createIndex({ id: 1 }, { unique: true });

  let movieTotal = await moviesCol.countDocuments();
  let seriesTotal = await seriesCol.countDocuments();
  console.log(`📊 Initial Counts: ${movieTotal} Movies | ${seriesTotal} Series | Total: ${movieTotal + seriesTotal}`);

  // 1. Seed Movies up to 2,500+
  console.log('\n🎬 Seeding Movies across genres (Popular, New, Classic, All Genres)...');
  for (const genre of ['', ...GENRES]) {
    if (movieTotal >= 2600) break;
    for (const skip of [0, 48, 96, 144, 192]) {
      if (movieTotal >= 2600) break;
      const metas = await fetchCatalog('movie', genre, skip);
      if (!metas.length) break;

      const ops = metas.filter((m) => m.id && m.name).map((m) => ({
        updateOne: {
          filter: { id: m.id },
          update: {
            $setOnInsert: {
              id: m.id,
              title: m.name,
              year: m.releaseInfo || m.year || '',
              overview: m.description || '',
              poster: m.poster || null,
              backdrop: m.background || m.poster || null,
              rating: m.imdbRating ? parseFloat(m.imdbRating) : 0,
              genres: Array.isArray(m.genres) ? m.genres : genre ? [genre] : [],
              type: 'movie',
              created_at: new Date(),
            },
          },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        const res = await moviesCol.bulkWrite(ops, { ordered: false });
        movieTotal = await moviesCol.countDocuments();
        console.log(`  ✓ Movies [${genre || 'Top'}] skip=${skip} -> +${res.upsertedCount} new (Total: ${movieTotal})`);
      }
      await sleep(150);
    }
  }

  // 2. Seed TV Series up to 2,500+
  console.log('\n📺 Seeding TV Series across genres...');
  for (const genre of ['', ...GENRES]) {
    if (seriesTotal >= 2600) break;
    for (const skip of [0, 48, 96, 144, 192]) {
      if (seriesTotal >= 2600) break;
      const metas = await fetchCatalog('series', genre, skip);
      if (!metas.length) break;

      const ops = metas.filter((s) => s.id && s.name).map((s) => ({
        updateOne: {
          filter: { id: s.id },
          update: {
            $setOnInsert: {
              id: s.id,
              title: s.name,
              year: s.releaseInfo || s.year || '',
              overview: s.description || '',
              poster: s.poster || null,
              backdrop: s.background || s.poster || null,
              rating: s.imdbRating ? parseFloat(s.imdbRating) : 0,
              genres: Array.isArray(s.genres) ? s.genres : genre ? [genre] : [],
              seasonsCount: 1,
              episodes: [],
              created_at: new Date(),
            },
          },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        const res = await seriesCol.bulkWrite(ops, { ordered: false });
        seriesTotal = await seriesCol.countDocuments();
        console.log(`  ✓ Series [${genre || 'Top'}] skip=${skip} -> +${res.upsertedCount} new (Total: ${seriesTotal})`);
      }
      await sleep(150);
    }
  }

  const finalMovies = await moviesCol.countDocuments();
  const finalSeries = await seriesCol.countDocuments();
  console.log('\n🎉 SEEDING COMPLETE!');
  console.log(`📁 Final Database Counts:`);
  console.log(`   🎬 Movies: ${finalMovies}`);
  console.log(`   📺 Series: ${finalSeries}`);
  console.log(`   🌟 Total Titles in MongoDB Atlas: ${finalMovies + finalSeries} (0 Duplicates)`);

  await client.close();
}

seed().catch(console.error);

