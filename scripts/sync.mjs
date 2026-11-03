import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27019/streamhub';
const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const LOGOS_URL = 'https://iptv-org.github.io/api/logos.json';
const CATEGORIES_URL = 'https://iptv-org.github.io/api/categories.json';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';

async function populate() {
  console.log('🚀 Connecting to MongoDB at:', MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('streamhub');
  console.log('✅ Connected to MongoDB.');

  console.log('📡 Fetching live channel feeds from IPTV datasets...');
  const [channels, streams, logos, categories, countries] = await Promise.all([
    fetch(CHANNELS_URL).then((r) => r.json()),
    fetch(STREAMS_URL).then((r) => r.json()),
    fetch(LOGOS_URL).then((r) => r.json()).catch(() => []),
    fetch(CATEGORIES_URL).then((r) => r.json()).catch(() => []),
    fetch(COUNTRIES_URL).then((r) => r.json()).catch(() => []),
  ]);

  console.log(`📊 Fetched: ${channels.length} channels, ${streams.length} streams, ${logos.length} logos.`);

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

  const validChannels = [];
  for (const ch of channels) {
    if (ch.is_nsfw) continue;
    const channelStreams = streamsMap.get(ch.id) || [];
    if (channelStreams.length === 0) continue;

    const isVerified = channelStreams.some(
      (s) => s.url.startsWith('https://') || s.url.includes('akamaized') || s.url.includes('cloudfront')
    );

    validChannels.push({
      id: ch.id,
      name: ch.name || ch.id,
      country: ch.country ? ch.country.toUpperCase() : 'INT',
      network: ch.network,
      languages: ch.languages || [],
      categories: ch.categories || ['General'],
      is_nsfw: false,
      is_verified: isVerified,
      logo: logosMap.get(ch.id) || ch.logo,
      streams: channelStreams,
      updated_at: new Date(),
    });
  }

  console.log(`📦 Prepared ${validChannels.length} active live channels with working streams.`);
  const channelsCol = db.collection('channels');

  // Create search and filter indexes
  await channelsCol.createIndex({ id: 1 }, { unique: true });
  await channelsCol.createIndex({ country: 1 });
  await channelsCol.createIndex({ categories: 1 });
  await channelsCol.createIndex({ is_nsfw: 1 });
  await channelsCol.createIndex({ name: 'text', alt_names: 'text', id: 'text' });

  // Bulk upsert in batches
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

  console.log('\n🎉 Database populated successfully with live channels, categories, and countries!');
  await client.close();
}

populate().catch((err) => {
  console.error('❌ Populate failed:', err);
  process.exit(1);
});

