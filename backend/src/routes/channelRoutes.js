const express = require('express');
const { createClient } = require('redis');
const Channel = require('../models/Channel');

const router = express.Router();

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.log('[Redis] Client Error', err));
  redisClient.connect().catch(console.error);
}

router.get('/channels', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const country = (req.query.country || '').trim().toUpperCase();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '36', 10)));
    const favorites = req.query.favorites || '';

    const cacheKey = `channels:s=${encodeURIComponent(search)}:cat=${category}:cou=${country}:p=${page}:l=${limit}:fav=${favorites}`;

    // 1. Try to get from Redis Cache
    if (redisClient && redisClient.isOpen) {
      const cachedChannels = await redisClient.get(cacheKey);
      if (cachedChannels) {
        return res.json(JSON.parse(cachedChannels));
      }
    }

    // 2. Build MongoDB Filter Query
    const filter = {};

    if (favorites) {
      const favList = favorites.split(',').filter(Boolean);
      filter.channel_id = { $in: favList };
    } else {
      if (category && category !== 'all') filter.category = category;
      if (country && country !== 'ALL') filter.country = country;
      if (search) {
        const regex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        filter.$or = [{ name: { $regex: regex } }, { channel_id: { $regex: regex } }];
      }
    }

    const skip = (page - 1) * limit;

    const [channels, total] = await Promise.all([
      Channel.find(filter).sort({ score: -1, name: 1 }).skip(skip).limit(limit).lean(),
      Channel.countDocuments(filter)
    ]);

    const mappedChannels = channels.map(c => ({
      ...c,
      id: c.channel_id,
      categories: c.category ? [c.category] : [],
      streams: [{ url: c.stream_url }]
    }));

    const totalPages = Math.ceil(total / limit);
    const result = { channels: mappedChannels, total, page, limit, totalPages, hasMore: page < totalPages };

    // 3. Save to Redis Cache (Expire after 5 minutes)
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    }

    res.json(result);
  } catch (error) {
    console.error('[API] Error fetching channels:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const country = (req.query.country || '').trim().toUpperCase();
    const pipeline = [];

    if (country && country !== 'ALL') {
      pipeline.push({ $match: { country } });
    }

    pipeline.push(
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $match: { _id: { $ne: '' } } },
      { $project: { id: '$_id', name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    );

    const categories = await Channel.aggregate(pipeline);
    res.json({ categories });
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    res.status(500).json({ categories: [] });
  }
});

router.get('/countries', async (req, res) => {
  try {
    const countries = await Channel.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $match: { _id: { $ne: '' } } },
      { $project: { code: '$_id', name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    res.json({ countries });
  } catch (error) {
    console.error('[API] Error fetching countries:', error);
    res.status(500).json({ countries: [] });
  }
});

module.exports = router;
