import { MongoClient } from 'mongodb';
import Redis from 'ioredis';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27019/streamhub';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6389';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const m = args.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=')[1] : fallback;
};
const hasFlag = (f) => args.includes(f);

const limit = parseInt(getArg('limit', '0'), 10);
const concurrency = parseInt(getArg('concurrency', '20'), 10);
const timeoutMs = parseInt(getArg('timeout', '3000'), 10);
const pruneDead = hasFlag('--prune');
const targetCategory = getArg('category', null);
const targetCountry = getArg('country', null);

async function pingStream(url) {
  if (!url || !url.startsWith('http')) return { ok: false, error: 'Invalid URL' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-100' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const latency = Date.now() - start;
    const isBad = res.status === 404 || res.status === 403 || res.status === 410 || res.status >= 500;
    const ok = !isBad && (res.ok || (res.status >= 200 && res.status < 400));
    return { ok, status: res.status, latency };
  } catch (err) {
    clearTimeout(timer);
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError' || latency >= timeoutMs;
    return { ok: false, error: isTimeout ? 'Timeout (>3s)' : err.message, latency };
  }
}

async function runHealthCheck() {
  console.log(`\n🏥 [Stream-Health Filter] Initializing stream health checks...`);
  console.log(`   Timeout: ${timeoutMs}ms | Concurrency: ${concurrency} workers | Prune: ${pruneDead ? 'YES (drop bad links)' : 'NO (mark offline)'}`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const channelsCol = db.collection('channels');

  const filter = { is_nsfw: false };
  if (targetCategory) filter.categories = targetCategory;
  if (targetCountry) filter.country = targetCountry.toUpperCase();

  let query = channelsCol.find(filter);
  if (limit > 0) query = query.limit(limit);
  const channels = await query.toArray();

  console.log(`📋 Found ${channels.length} channels to verify.\n`);

  let checkedCount = 0;
  let onlineCount = 0;
  let offlineCount = 0;
  const updates = [];
  const toDelete = [];

  async function processChannel(channel) {
    const streams = channel.streams || [];
    let workingStream = null;
    let bestLatency = 9999;

    for (const s of streams) {
      const res = await pingStream(s.url);
      if (res.ok) {
        workingStream = s;
        bestLatency = res.latency;
        break;
      }
    }

    checkedCount++;
    if (workingStream) {
      onlineCount++;
      const orderedStreams = [workingStream, ...streams.filter((s) => s.url !== workingStream.url)];
      updates.push({
        updateOne: {
          filter: { id: channel.id },
          update: { $set: { online: true, streams: orderedStreams, last_checked: new Date() } },
        },
      });
    } else {
      offlineCount++;
      if (pruneDead) {
        toDelete.push(channel.id);
      } else {
        updates.push({
          updateOne: {
            filter: { id: channel.id },
            update: { $set: { online: false, last_checked: new Date() } },
          },
        });
      }
    }

    process.stdout.write(`⏳ Checked: ${checkedCount}/${channels.length} | Online: ${onlineCount} | Bad/Dead: ${offlineCount}\r`);
  }

  for (let i = 0; i < channels.length; i += concurrency) {
    const chunk = channels.slice(i, i + concurrency);
    await Promise.all(chunk.map(processChannel));
    if (updates.length >= 200) {
      await channelsCol.bulkWrite(updates.splice(0, updates.length));
    }
  }

  if (updates.length > 0) await channelsCol.bulkWrite(updates);
  if (toDelete.length > 0) {
    await channelsCol.deleteMany({ id: { $in: toDelete } });
    console.log(`\n🗑️  Pruned ${toDelete.length} bad/geo-blocked channels from database.`);
  }

  console.log(`\n\n📊 Health Check Complete:`);
  console.log(`   Total Verified: ${checkedCount}`);
  console.log(`   ✅ Active & Healthy: ${onlineCount} (${Math.round((onlineCount / (checkedCount || 1)) * 100)}%)`);
  console.log(`   ❌ Bad / 404 / 403 / Timeout: ${offlineCount}`);

  try {
    const redis = new Redis(REDIS_URL);
    const keys = await redis.keys('channels:*');
    if (keys.length > 0) await redis.del(...keys);
    await redis.quit();
    console.log(`🔄 Flushed Redis channels cache. Active UI updated.\n`);
  } catch {}

  await client.close();
}

runHealthCheck().catch(console.error);

