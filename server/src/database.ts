// server/src/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // loads .env

const MONGO_URI = process.env.MONGO_URI || "";
if (!MONGO_URI) {
  throw new Error("No MONGO_URI found in .env");
}

// Connects via Mongoose instead of MongoClient
export async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas via Mongoose!");
  } catch (err) {
    console.error("Mongoose connect error:", err);
    throw err;
  }
}