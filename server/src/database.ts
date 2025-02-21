// server/src/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "";

const options: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 1000
};

export async function connectMongo(): Promise<void> {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, options);
    console.log("✅ Connected to MongoDB!");

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully!');
    });

  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
}

export const connection = mongoose.connection;
