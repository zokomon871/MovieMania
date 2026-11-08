import { Filter } from 'mongodb';
import { getChannelsCollection } from './mongodb';
import { getCachedJson, setCachedJson } from './redis';
import { IChannel, IChannelFilterParams, IChannelListResponse, ICategory, ICountry } from './types';

export async function fetchChannelsService(params: IChannelFilterParams): Promise<IChannelListResponse> {
  const search = (params.search || '').trim();
  const category = (params.category || '').trim();
  const country = (params.country || '').trim().toUpperCase();
  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.min(100, Math.max(1, Number(params.limit || 36)));
  const favorites = (params.favorites || '').trim();

  const cacheKey = `channels:s=${encodeURIComponent(search)}:cat=${category}:cou=${country}:p=${page}:l=${limit}:fav=${favorites}`;
  const cached = await getCachedJson<IChannelListResponse>(cacheKey);
  if (cached) return cached;

  const collection = await getChannelsCollection();
  const filter: Filter<IChannel> = { is_nsfw: false, online: { $ne: false } };

  if (favorites) {
    const favList = favorites.split(',').filter(Boolean);
    filter.id = { $in: favList };
  } else {
    if (category && category !== 'all') {
      filter.categories = category;
    }
    if (country && country !== 'ALL') {
      filter.country = country;
    }
    if (search) {
      filter.$text = { $search: search };
    }
  }

  const skip = (page - 1) * limit;
  const [channels, total] = await Promise.all([
    collection.find(filter).sort({ is_verified: -1, name: 1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const result: IChannelListResponse = {
    channels: channels.map((c) => ({ ...c, _id: undefined })),
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };

  await setCachedJson(cacheKey, result, 18000);
  return result;
}

export async function fetchCategoriesService(country?: string): Promise<ICategory[]> {
  const countryCode = (country || '').trim().toUpperCase();
  const cacheKey = `categories:c=${countryCode || 'ALL'}`;
  const cached = await getCachedJson<ICategory[]>(cacheKey);
  if (cached) return cached;

  const collection = await getChannelsCollection();
  const pipeline: any[] = [{ $match: { is_nsfw: false, online: { $ne: false } } }];
  if (countryCode && countryCode !== 'ALL') {
    pipeline.push({ $match: { country: countryCode } });
  }
  pipeline.push(
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    { $match: { _id: { $ne: '' } } },
    { $project: { id: '$_id', name: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  );

  const categories = (await collection.aggregate<ICategory>(pipeline).toArray()) || [];
  await setCachedJson(cacheKey, categories, 18000);
  return categories;
}

export async function fetchCountriesService(): Promise<ICountry[]> {
  const cacheKey = 'countries:all';
  const cached = await getCachedJson<ICountry[]>(cacheKey);
  if (cached) return cached;

  const collection = await getChannelsCollection();
  const pipeline = [
    { $match: { is_nsfw: false, online: { $ne: false } } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $match: { _id: { $nin: ['', null] } } },
    { $project: { code: '$_id', name: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ];

  const countries = (await collection.aggregate<ICountry>(pipeline).toArray()) || [];
  await setCachedJson(cacheKey, countries, 18000);
  return countries;
}

