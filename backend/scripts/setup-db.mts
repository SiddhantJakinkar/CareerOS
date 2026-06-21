import 'dotenv/config';
import mongoose from 'mongoose';
import '../src/models/index.js';

const SOURCE_DB = 'test';
const TARGET_DB = 'ai-placement-copilot';

async function migrateCollection(
  sourceDb: mongoose.mongo.Db,
  targetDb: mongoose.mongo.Db,
  collectionName: string
): Promise<number> {
  const source = sourceDb.collection(collectionName);
  const target = targetDb.collection(collectionName);
  const existing = await target.countDocuments();

  if (existing > 0) {
    console.log(`  skip ${collectionName} (${existing} docs already in target)`);
    return 0;
  }

  const documents = await source.find({}).toArray();
  if (documents.length === 0) {
    console.log(`  skip ${collectionName} (empty)`);
    return 0;
  }

  await target.insertMany(documents, { ordered: false });
  console.log(`  migrated ${collectionName}: ${documents.length} docs`);
  return documents.length;
}

async function syncIndexes(): Promise<void> {
  const models = mongoose.modelNames();
  for (const name of models) {
    await mongoose.model(name).syncIndexes();
    console.log(`  indexes synced: ${name}`);
  }
}

async function main(): Promise<void> {
  const baseUri = process.env.MONGODB_URI?.replace(/\/[^/?]+(\?|$)/, '/$1') ?? '';
  const clusterUri = baseUri.replace(/\/ai-placement-copilot.*$/, '').replace(/\/$/, '');

  if (!clusterUri) {
    throw new Error('MONGODB_URI is not set');
  }

  const sourceUri = `${clusterUri}/${SOURCE_DB}`;
  const targetUri = `${clusterUri}/${TARGET_DB}`;

  console.log(`Source: ${SOURCE_DB}`);
  console.log(`Target: ${TARGET_DB}\n`);

  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  const sourceDb = sourceConn.db!;
  const targetDb = targetConn.db!;

  const collections = await sourceDb.listCollections().toArray();
  let migrated = 0;

  console.log('Migrating collections...');
  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    migrated += await migrateCollection(sourceDb, targetDb, name);
  }

  await sourceConn.close();

  console.log('\nSyncing indexes...');
  await mongoose.connect(targetUri);
  await syncIndexes();

  const summary = await Promise.all(
    (await targetDb.listCollections().toArray()).map(async ({ name }) => ({
      name,
      count: await targetDb.collection(name).countDocuments(),
    }))
  );

  console.log('\nDatabase ready in MongoDB Compass:');
  console.log(`  Database name: ${TARGET_DB}`);
  console.log(`  Connection URI: ${targetUri}`);
  console.log('\nCollections:');
  for (const { name, count } of summary.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${name}: ${count}`);
  }
  console.log(`\nMigrated ${migrated} documents from "${SOURCE_DB}".`);

  await targetConn.close();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
