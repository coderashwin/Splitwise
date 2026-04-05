import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet: MongoMemoryReplSet;

export async function setupTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, // single-node replica set is enough for transactions
  });
  const uri = replSet.getUri();
  await mongoose.connect(uri, {
    bufferCommands: false,
    directConnection: true, // required for single-node replica sets
  });
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await replSet.stop();
}
