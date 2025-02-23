import mongoose from 'mongoose';

const isDevelopment = process.env.NODE_ENV !== 'production';
const MONGODB_URI = process.env.MONGODB_URI;

// Log database configuration (hiding credentials)
const logMongoConfig = () => {
  const uri = MONGODB_URI || 'not set';
  console.log('MongoDB Configuration:', {
    uri: uri.replace(/\/\/[^@]*@/, '//***:***@'),
    environment: process.env.NODE_ENV,
    development: isDevelopment
  });
};

const connectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

export async function connectMongo(retryCount = 0): Promise<void> {
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 5000;

  try {
    // In development, allow fallback to localhost
    const uri = MONGODB_URI || (isDevelopment ? 'mongodb://localhost:27017/aegis' : null);
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required in production');
    }

    logMongoConfig();
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(uri, connectOptions);
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
        // Don't exit, let the health check handle the error
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('MONGODB_URI environment variable is required')) {
        console.error('❌', error.message);
        if (!isDevelopment) {
          console.error('This error indicates that the MONGODB_URI environment variable is not set.');
          console.error('Please ensure you have set this variable in your Render dashboard.');
          console.error('Go to: Dashboard > Your Service > Environment Variables');
        }
      } else {
        console.error('Failed to connect to MongoDB:', error);
      }
    } else {
      console.error('Unknown error during MongoDB connection:', error);
    }

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      setTimeout(() => connectMongo(retryCount + 1), RETRY_INTERVAL);
    } else {
      console.error('Failed to connect to MongoDB after maximum retries');
      // Don't exit, let the health check handle the error
    }
  }
}

// Export connection status check
export const isConnected = () => mongoose.connection.readyState === 1;

// Export connection instance for direct access if needed
export const connection = mongoose.connection;
