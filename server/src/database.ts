// server/src/database.ts
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "";
export const client = new MongoClient(uri);

export async function connectMongo(): Promise<void> {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB (Native Driver)!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}