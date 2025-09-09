import { MongoClient } from "mongodb";

let client;
let db;

export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, 
    });

    await client.connect();
    db = client.db("turkey_locations");
    console.log("MongoDB bağlantısı başarılı!");
    return db;

  } catch (err) {
    console.error("MongoDB bağlantısı kurulamadı:", err.message);
    process.exit(1);
  }
}

export async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}
