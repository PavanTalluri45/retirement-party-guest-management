import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "./env.js";

let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas and cache the client + db instances.
 */
export async function connectDB() {
  if (client && db) return { client, db };

  client = new MongoClient(config.mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db(config.dbName);

  return { client, db };
}

/**
 * Return the cached database instance.
 * Throws if connectDB() has not been called first.
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

/**
 * Inject a custom db instance (used in tests to replace the real connection).
 */
export function setDb(injectedDb) {
  db = injectedDb;
}

/**
 * Close the MongoDB connection gracefully.
 */
export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}