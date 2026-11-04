// One-time (idempotent, safe to re-run) MongoDB index setup.
//
// This used to run automatically on every cold server start via a lazy
// check in src/lib/db.ts. That added a handful of createIndex round-trips
// to MongoDB before the *first* request a fresh serverless instance served
// — including the extension's download-status check, which is exactly the
// request the popup is waiting on before it can render. Since the indexes
// only ever need to be created once (createIndex no-ops if an identical
// index already exists), that work has no business running on the request
// path at all. Run this manually instead, whenever the schema in
// src/lib/db.ts changes: `node scripts/ensure-indexes.js`
//
// Reads MONGODB_URI from .env in the project root (no extra dependency
// needed to load it).
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const line = env.split(/\r?\n/).find((l) => l.startsWith('MONGODB_URI='));
  if (!line) throw new Error('MONGODB_URI not found in .env');
  return line.slice('MONGODB_URI='.length).replace(/^["']|["']$/g, '');
}

async function main() {
  const uri = loadMongoUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('licenseKeys').createIndex({ key: 1 }, { unique: true }),
    db.collection('licenseKeys').createIndex({ email: 1 }),
    // Sparse: only purchase-created keys have a dodoId, and this is what the
    // webhook uses to detect a retried delivery before minting a duplicate key.
    db.collection('licenseKeys').createIndex({ dodoId: 1 }, { sparse: true }),
    db.collection('subscriptions').createIndex({ userId: 1 }, { unique: true }),
    db.collection('subscriptions').createIndex({ dodoId: 1 }, { sparse: true }),
    // Refunds/disputes carry only a payment id; this resolves it to the subscription.
    db.collection('subscriptions').createIndex({ paymentIds: 1 }, { sparse: true }),
    // Rate-limit windows delete themselves once expired (see src/lib/rateLimit.ts).
    db.collection('rateLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('contactMessages').createIndex({ createdAt: -1 }),
  ]);

  console.log('Indexes ensured.');
  await client.close();
}

main().catch((err) => {
  console.error('Failed to ensure indexes:', err);
  process.exit(1);
});
