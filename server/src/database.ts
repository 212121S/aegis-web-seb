import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

export async function connectMongo(retryCount = 0): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB!');

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectMongo(), RETRY_INTERVAL);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(() => connectMongo(retryCount + 1), RETRY_INTERVAL);
      } else {
        console.error('Failed to connect to MongoDB after maximum retries');
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      setTimeout(() => connectMongo(retryCount + 1), RETRY_INTERVAL);
    } else {
      console.error('Failed to connect to MongoDB after maximum retries');
      process.exit(1);
    }
  }
}
