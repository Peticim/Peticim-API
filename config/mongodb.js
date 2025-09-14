// config/mongodb.js
import mongoose from "mongoose";

let db;

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB (Mongoose) bağlantısı başarılı!");
  } catch (err) {
    console.error("❌ MongoDB bağlantısı kurulamadı:", err.message);
    process.exit(1);
  }
}


export async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}
