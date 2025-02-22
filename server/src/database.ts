import mongoose from 'mongoose';

const isDevelopment = process.env.NODE_ENV !== 'production';
const MONGODB_URI = process.env.MONGODB_URI;

// In development, allow fallback to localhost if MONGODB_URI is not set
if (!MONGODB_URI) {
  if (isDevelopment) {
    console.warn('⚠️  MONGODB_URI not set, falling back to localhost');
  } else {
    console.error('❌ MONGODB_URI environment variable is required in production');
    // Don't exit immediately, let the health check handle the error
  }
}

const connectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

export async function connectMongo(retryCount = 0): Promise<void> {
  try {
    const uri = MONGODB_URI || (isDevelopment ? 'mongodb://localhost:27017/aegis' : null);
    
    if (!uri) {
      throw new Error('No MongoDB URI available');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log(`Using MongoDB URI: ${uri.replace(/\/\/[^@]*@/, '//***:***@')}`);
    
    await mongoose.connect(uri, connectOptions);
    console.log('✅ Connected to MongoDB!');

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectMongo(), 5000);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (retryCount < 5) {
        console.log(`Retrying connection... Attempt ${retryCount + 1} of 5`);
        setTimeout(() => connectMongo(retryCount + 1), 5000);
      } else {
        console.error('Failed to connect to MongoDB after maximum retries');
        // Don't exit, let the health check handle the error
      }
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    if (retryCount < 5) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of 5`);
      setTimeout(() => connectMongo(retryCount + 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after maximum retries');
      // Don't exit, let the health check handle the error
    }
  }
}

// Export connection status check
export const isConnected = () => mongoose.connection.readyState === 1;
