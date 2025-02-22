// server/src/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "";

const options: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 35000,
  connectTimeoutMS: 35000,
  heartbeatFrequencyMS: 10000, // Reduced frequency for less overhead
  maxPoolSize: 10, // Add connection pooling
  minPoolSize: 2,
  maxIdleTimeMS: 60000, // Keep idle connections for 1 minute
  retryWrites: true
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
