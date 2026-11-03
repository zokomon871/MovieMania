import { getDb, getChannelsCollection, getCategoriesCollection, getCountriesCollection, ensureIndexes } from './mongodb';
import { invalidateCachePattern } from './redis';
import { IChannel, ICategory, ICountry, IStream, ILogo } from './types';

const CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const LOGOS_URL = 'https://iptv-org.github.io/api/logos.json';
const CATEGORIES_URL = 'https://iptv-org.github.io/api/categories.json';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';

export interface SyncStats {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  totalChannels: number;
  totalStreams: number;
  lastSyncTime: string | null;
  error?: string;
}

let syncStats: SyncStats = {
  status: 'idle',
  totalChannels: 0,
  totalStreams: 0,
  lastSyncTime: null,
};

export function getSyncStats(): SyncStats {
  return syncStats;
}

export async function runSyncPipeline(): Promise<SyncStats> {
  if (syncStats.status === 'syncing') return syncStats;
  syncStats = { ...syncStats, status: 'syncing', error: undefined };

  try {
    await ensureIndexes();
    const [channelsRes, streamsRes, logosRes, categoriesRes, countriesRes] = await Promise.all([
      fetch(CHANNELS_URL).then((r) => r.json()),
      fetch(STREAMS_URL).then((r) => r.json()),
      fetch(LOGOS_URL).then((r) => r.json()).catch(() => []),
      fetch(CATEGORIES_URL).then((r) => r.json()).catch(() => []),
      fetch(COUNTRIES_URL).then((r) => r.json()).catch(() => []),
    ]);

    const logosMap = new Map<string, string>();
    for (const l of logosRes as ILogo[]) {
      if (l.channel && l.url && !logosMap.has(l.channel)) logosMap.set(l.channel, l.url);
    }

    const streamsMap = new Map<string, IStream[]>();
    for (const s of streamsRes as IStream[]) {
      if (!s.channel || !s.url || s.status === 'offline') continue;
      const list = streamsMap.get(s.channel) || [];
      list.push({ channel: s.channel, url: s.url, quality: s.quality, status: s.status });
      streamsMap.set(s.channel, list);
    }

    const joinedChannels: IChannel[] = [];
    for (const ch of channelsRes) {
      if (ch.is_nsfw) continue;
      const streams = streamsMap.get(ch.id) || [];
      if (streams.length === 0) continue;

      const isVerified = streams.some((s) => s.url.startsWith('https://') || s.url.includes('akamaized'));
      joinedChannels.push({
        id: ch.id,
        name: ch.name || ch.id,
        country: ch.country ? ch.country.toUpperCase() : 'INT',
        network: ch.network,
        languages: ch.languages || [],
        categories: ch.categories || ['General'],
        is_nsfw: false,
        is_verified: isVerified,
        logo: logosMap.get(ch.id) || ch.logo,
        streams,
        updated_at: new Date(),
      });
    }

    const channelsCol = await getChannelsCollection();
    const categoriesCol = await getCategoriesCollection();
    const countriesCol = await getCountriesCollection();

    const bulk = joinedChannels.map((c) => ({
      updateOne: { filter: { id: c.id }, update: { $set: c }, upsert: true },
    }));

    if (bulk.length > 0) {
      for (let i = 0; i < bulk.length; i += 1000) {
        await channelsCol.bulkWrite(bulk.slice(i, i + 1000));
      }
    }

    if (categoriesRes?.length > 0) {
      await categoriesCol.deleteMany({});
      await categoriesCol.insertMany(categoriesRes);
    }
    if (countriesRes?.length > 0) {
      await countriesCol.deleteMany({});
      await countriesCol.insertMany(countriesRes);
    }

    await invalidateCachePattern('*');

    syncStats = {
      status: 'completed',
      totalChannels: joinedChannels.length,
      totalStreams: streamsRes.length,
      lastSyncTime: new Date().toISOString(),
    };
    return syncStats;
  } catch (err: any) {
    syncStats = { ...syncStats, status: 'failed', error: err.message };
    return syncStats;
  }
}

