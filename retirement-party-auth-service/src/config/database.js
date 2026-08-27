import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "./env.js";

let client = null;
let db = null;

export async function connectDB() {
  if (db) {
    return db;
  }

  client = new MongoClient(config.mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db(config.dbName);

  // Ping the database to verify connectivity
  await db.command({ ping: 1 });
  console.log(`[MongoDB] Successfully connected to database: ${config.dbName}`);

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("[MongoDB] Connection closed.");
  }
}

export { client };
export default client;