import { MongoClient } from 'mongodb';
import fs from 'fs';

// Read .env.local
let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf8');
  const match = envText.match(/MONGODB_URI=(.*)/);
  if (match) uri = match[1].trim();
}

console.log('🔍 Testing MongoDB Atlas connection...');
if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const masked = uri.replace(/:[^:]*@/, ':****@');
console.log('📌 Target:', masked);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  console.log('\n🎉 SUCCESS! MongoDB Atlas is connected and fully working!');
  const db = client.db('moviemania');
  const collections = await db.listCollections().toArray();
  console.log('📁 Collections in "moviemania":', collections.map((c) => c.name));
  await client.close();
} catch (err) {
  console.log('\n❌ Atlas is still blocking the connection:');
  console.log('   Error:', err.message);
  console.log('\n👉 Action needed: Go to cloud.mongodb.com -> Network Access -> Add 0.0.0.0/0');
}

