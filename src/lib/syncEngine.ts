import { getChannelsCollection, getCategoriesCollection, getCountriesCollection, ensureIndexes, getDb } from './mongodb';
import { invalidateCachePattern } from './redis';
import { IChannel, ICategory, ICountry, IStream, ILogo } from './types';

const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const LOGOS_URL = 'https://iptv-org.github.io/api/logos.json';
const CATEGORIES_URL = 'https://iptv-org.github.io/api/categories.json';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';
const BLOCKLIST_URL = 'https://iptv-org.github.io/api/blocklist.json';

export interface SyncStats {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  totalChannelsFetched: number;
  totalStreamsFetched: number;
  totalJoinedChannels: number;
  blockedCount: number;
  lastSyncTime: string | null;
  error?: string;
  durationMs?: number;
}

let currentSyncStats: SyncStats = {
  status: 'idle',
  totalChannelsFetched: 0,
  totalStreamsFetched: 0,
  totalJoinedChannels: 0,
  blockedCount: 0,
  lastSyncTime: null,
};

export function getSyncStats(): SyncStats {
  return currentSyncStats;
}

export async function runSyncPipeline(): Promise<SyncStats> {
  if (currentSyncStats.status === 'syncing') {
    return currentSyncStats;
  }

  const startTime = Date.now();
  currentSyncStats = {
    ...currentSyncStats,
    status: 'syncing',
    error: undefined,
  };

  try {
    console.log('[Sync Engine] Starting IPTV-Org ETL Data Pipeline...');
    await ensureIndexes();

    // 1. Fetch datasets in parallel
    const [
      channelsRes,
      streamsRes,
      logosRes,
      categoriesRes,
      countriesRes,
      blocklistRes,
    ] = await Promise.all([
      fetch(CHANNELS_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch channels.json: ${r.statusText}`);
        return r.json();
      }),
      fetch(STREAMS_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch streams.json: ${r.statusText}`);
        return r.json();
      }),
      fetch(LOGOS_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch logos.json: ${r.statusText}`);
        return r.json();
      }),
      fetch(CATEGORIES_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch categories.json: ${r.statusText}`);
        return r.json();
      }),
      fetch(COUNTRIES_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch countries.json: ${r.statusText}`);
        return r.json();
      }),
      fetch(BLOCKLIST_URL).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch blocklist.json: ${r.statusText}`);
        return r.json();
      }).catch(() => []), // fallback to empty if blocklist fails
    ]);

    console.log(`[Sync Engine] Fetched raw datasets: Channels: ${channelsRes.length}, Streams: ${streamsRes.length}, Logos: ${logosRes.length}`);

    // 2. Build Blocklist Set
    const blocklistSet = new Set<string>();
    if (Array.isArray(blocklistRes)) {
      for (const item of blocklistRes) {
        if (item.channel) blocklistSet.add(item.channel);
      }
    }

    // 3. Build Logos Lookup Map (channel_id -> logo url)
    const logosMap = new Map<string, string>();
    if (Array.isArray(logosRes)) {
      for (const logo of logosRes as ILogo[]) {
        if (logo.channel && logo.url && !logosMap.has(logo.channel)) {
          logosMap.set(logo.channel, logo.url);
        }
      }
    }

    // 4. Build Streams Lookup Map (channel_id -> IStream[])
    const streamsMap = new Map<string, IStream[]>();
    if (Array.isArray(streamsRes)) {
      for (const stream of streamsRes as IStream[]) {
        if (!stream.channel || !stream.url) continue;
        if (stream.status === 'offline' || stream.status === 'error') continue;
        const list = streamsMap.get(stream.channel) || [];
        list.push({
          channel: stream.channel,
          url: stream.url,
          feed: stream.feed,
          quality: stream.quality,
          referrer: stream.referrer,
          user_agent: stream.user_agent,
          status: stream.status,
          width: stream.width,
          height: stream.height,
          bitrate: stream.bitrate,
          fps: stream.fps,
        });
        streamsMap.set(stream.channel, list);
      }
    }

    // 5. Join Channels with Streams & Logos + Apply Filters
    const joinedChannels: IChannel[] = [];
    const now = new Date();

    if (Array.isArray(channelsRes)) {
      for (const ch of channelsRes) {
        // Filter out blocklisted channels
        if (blocklistSet.has(ch.id)) continue;
        // Filter out NSFW by default
        if (ch.is_nsfw === true) continue;

        const channelStreams = streamsMap.get(ch.id) || [];
        // Prioritize channels with active/available streams
        if (channelStreams.length === 0) continue;

        const logoUrl = logosMap.get(ch.id) || ch.logo || null;

        // Determine if channel is hosted on high-reliability CDN / HTTPS stream
        const isVerified = channelStreams.some(s => {
          const u = (s.url || '').toLowerCase();
          const isRawIp = /^http:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?\//.test(u);
          if (isRawIp) return false;
          return (
            u.startsWith('https://') ||
            u.includes('akamaized.net') ||
            u.includes('amagi.tv') ||
            u.includes('wurl.tv') ||
            u.includes('cloudfront.net') ||
            u.includes('uplynk.com') ||
            u.includes('fastly') ||
            u.includes('wiseplayout') ||
            u.includes('tangotv') ||
            u.includes('smartplaytv') ||
            u.includes('thelegitpro') ||
            u.includes('pishow.tv') ||
            u.includes('samsung') ||
            u.includes('pluto.tv') ||
            u.includes('rakuten') ||
            u.includes('tubi') ||
            u.includes('redbull') ||
            u.includes('france24') ||
            u.includes('bloomberg')
          );
        });

        joinedChannels.push({
          id: ch.id,
          name: ch.name || ch.id,
          native_name: ch.native_name,
          alt_names: Array.isArray(ch.alt_names) ? ch.alt_names : [],
          network: ch.network,
          owners: ch.owners,
          country: ch.country ? ch.country.toUpperCase() : 'INT',
          subdivision: ch.subdivision,
          city: ch.city,
          broadcast_area: ch.broadcast_area,
          languages: Array.isArray(ch.languages) ? ch.languages : [],
          categories: Array.isArray(ch.categories) ? ch.categories : [],
          is_nsfw: !!ch.is_nsfw,
          is_verified: isVerified,
          launched: ch.launched,
          closed: ch.closed,
          website: ch.website,
          logo: logoUrl || undefined,
          streams: channelStreams,
          updated_at: now,
        });
      }
    }

    // 6. Bulk Upsert into MongoDB
    const channelsCol = await getChannelsCollection();
    const categoriesCol = await getCategoriesCollection();
    const countriesCol = await getCountriesCollection();

    console.log(`[Sync Engine] Ingesting ${joinedChannels.length} joined channels into MongoDB...`);

    // Ingest in batches of 1000 for high performance
    const batchSize = 1000;
    for (let i = 0; i < joinedChannels.length; i += batchSize) {
      const batch = joinedChannels.slice(i, i + batchSize);
      const bulkOps = batch.map(ch => ({
        updateOne: {
          filter: { id: ch.id },
          update: { $set: ch },
          upsert: true,
        },
      }));
      await channelsCol.bulkWrite(bulkOps, { ordered: false });
    }

    // Upsert categories & count channels
    if (Array.isArray(categoriesRes)) {
      const categoryCounts = await channelsCol.aggregate([
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
      ]).toArray();

      const catCountMap = new Map(categoryCounts.map(c => [c._id, c.count]));

      const categoriesToUpsert = categoriesRes.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        count: catCountMap.get(cat.id) || 0,
      }));

      const catOps = categoriesToUpsert.map(cat => ({
        updateOne: {
          filter: { id: cat.id },
          update: { $set: cat },
          upsert: true,
        },
      }));
      if (catOps.length > 0) {
        await categoriesCol.bulkWrite(catOps, { ordered: false });
      }
    }

    // Upsert countries & count channels
    if (Array.isArray(countriesRes)) {
      const countryCounts = await channelsCol.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
      ]).toArray();

      const countryCountMap = new Map(countryCounts.map(c => [c._id, c.count]));

      const countriesToUpsert = countriesRes.map((c: any) => ({
        code: (c.code || '').toUpperCase(),
        name: c.name,
        languages: c.languages,
        flag: c.flag,
        count: countryCountMap.get((c.code || '').toUpperCase()) || 0,
      })).filter(c => c.code);

      const countryOps = countriesToUpsert.map(c => ({
        updateOne: {
          filter: { code: c.code },
          update: { $set: c },
          upsert: true,
        },
      }));
      if (countryOps.length > 0) {
        await countriesCol.bulkWrite(countryOps, { ordered: false });
      }
    }

    // Record sync metadata
    const db = await getDb();
    const duration = Date.now() - startTime;
    await db.collection('sync_meta').updateOne(
      { key: 'last_sync' },
      {
        $set: {
          key: 'last_sync',
          timestamp: now.toISOString(),
          durationMs: duration,
          channelCount: joinedChannels.length,
          streamCount: streamsRes.length,
        },
      },
      { upsert: true }
    );

    // Invalidate Redis query caches so new data is fresh
    await invalidateCachePattern('channels:*');
    await invalidateCachePattern('categories:*');
    await invalidateCachePattern('countries:*');

    currentSyncStats = {
      status: 'completed',
      totalChannelsFetched: channelsRes.length,
      totalStreamsFetched: streamsRes.length,
      totalJoinedChannels: joinedChannels.length,
      blockedCount: blocklistSet.size,
      lastSyncTime: now.toISOString(),
      durationMs: duration,
    };

    console.log(`[Sync Engine] Synchronization completed successfully in ${(duration / 1000).toFixed(2)}s!`);
    return currentSyncStats;
  } catch (error: any) {
    console.error('[Sync Engine] ETL Pipeline error:', error);
    currentSyncStats = {
      ...currentSyncStats,
      status: 'failed',
      error: error?.message || 'Unknown sync error',
      durationMs: Date.now() - startTime,
    };
    return currentSyncStats;
  }
}
