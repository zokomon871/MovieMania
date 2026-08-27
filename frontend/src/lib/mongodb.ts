import { MongoClient, Db, Collection } from 'mongodb';
import { IChannel, ICategory, ICountry } from './types';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27019/streamhub';
const options = {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db('streamhub');
}

export async function getChannelsCollection(): Promise<Collection<IChannel>> {
  const db = await getDb();
  return db.collection<IChannel>('channels');
}

export async function getCategoriesCollection(): Promise<Collection<ICategory>> {
  const db = await getDb();
  return db.collection<ICategory>('categories');
}

export async function getCountriesCollection(): Promise<Collection<ICountry>> {
  const db = await getDb();
  return db.collection<ICountry>('countries');
}

export async function ensureIndexes(): Promise<void> {
  try {
    const db = await getDb();
    const channels = db.collection('channels');

    // Create indexes for efficient search, filtering, and sorting
    await channels.createIndex({ id: 1 }, { unique: true });
    await channels.createIndex({ country: 1 });
    await channels.createIndex({ categories: 1 });
    await channels.createIndex({ is_nsfw: 1 });
    await channels.createIndex({ "streams.0": 1 }); // has at least 1 stream
    await channels.createIndex(
      { name: "text", alt_names: "text", id: "text" },
      { weights: { name: 10, alt_names: 5, id: 2 }, default_language: "none" }
    );
    console.log('[MongoDB] Indexes verified/created successfully');
  } catch (err) {
    console.warn('[MongoDB] Warning creating indexes:', err);
  }
}
