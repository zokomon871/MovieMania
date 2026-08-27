const axios = require('axios');
const Channel = require('../models/Channel');

const IPTV_NEXUS_API = "https://dearbulut.github.io/iptv/api/v1/channels.online.json";

async function collectAndSyncData() {
  console.log(`[DataCollector] Starting data collection from ${IPTV_NEXUS_API}`);
  try {
    const response = await axios.get(IPTV_NEXUS_API);
    const channels = response.data;
    
    console.log(`[DataCollector] Fetched ${channels.length} channels.`);

    // Filter channels
    const goodChannels = channels.filter(channel => 
      channel.online === true && channel.score >= 70
    );

    console.log(`[DataCollector] Filtered to ${goodChannels.length} high-quality channels.`);

    // Map to MongoDB schema and prepare bulk operations
    const bulkOps = goodChannels.map(channel => {
      // Determine the stream URL. It could be channel.url, channel.stream_url, or inside streams array
      let streamUrl = channel.url || channel.stream_url;
      if (!streamUrl && channel.streams && channel.streams.length > 0) {
        streamUrl = channel.streams[0].url;
      }

      return {
        updateOne: {
          filter: { channel_id: channel.id },
          update: {
            $set: {
              name: channel.name,
              logo: channel.logo || '',
              country: channel.country || 'Unknown',
              category: (channel.categories && channel.categories.length > 0) ? channel.categories[0] : 'Uncategorized',
              stream_url: streamUrl || '',
              score: channel.score,
              online: channel.online,
              languages: channel.languages || [],
              is_nsfw: channel.is_nsfw || false,
              lastChecked: new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      const result = await Channel.bulkWrite(bulkOps);
      console.log(`[DataCollector] BulkWrite complete. Matched: ${result.matchedCount}, Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    } else {
      console.log(`[DataCollector] No channels matched the criteria.`);
    }

  } catch (error) {
    console.error(`[DataCollector] Error fetching or syncing data:`, error.message);
  }
}

module.exports = {
  collectAndSyncData
};
