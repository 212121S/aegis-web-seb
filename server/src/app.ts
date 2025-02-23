import express, { Request, Response, NextFunction } from "express";
import { connectMongo, isConnected } from "./database";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { stripeConfig } from "./config/stripe";

// Import your route modules
// Log Stripe configuration
console.log('Stripe Configuration:', {
  secretKeyConfigured: !!stripeConfig.secretKey,
  priceIds: stripeConfig.prices,
  timestamp: new Date().toISOString()
});

import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import paymentRoutes from "./routes/payment";
import verificationRoutes from "./routes/verification";

dotenv.config();

const app = express();

// Development mode check
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure CORS with proper options
const defaultAllowedOrigins = isDevelopment 
  ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  : ['https://aegistestingtech.com', 'https://www.aegistestingtech.com', 'https://aegis-web-seb.onrender.com'];

const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
];

// Log environment configuration
console.log('Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment,
  DOMAIN: process.env.DOMAIN,
  CLIENT_URL: process.env.CLIENT_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  allowedOrigins
});

// Enhanced CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Log CORS check
    console.log('CORS Check:', { origin, allowedOrigins });

    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'stripe-signature'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Stripe webhook needs raw body - this must come BEFORE the json parser
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Parse request bodies for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware
const requireDatabaseConnection = async (req: Request, res: Response, next: NextFunction) => {
  if (!isConnected()) {
    try {
      await connectMongo();
      next();
    } catch (error) {
      console.error('Database connection failed:', error);
      res.status(503).json({ error: 'Database connection failed' });
    }
  } else {
    next();
  }
};

// Apply database connection middleware to API routes
app.use('/api', requireDatabaseConnection);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth/verify", verificationRoutes);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const status = {
    server: 'ok',
    database: isConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  if (!isConnected()) {
    try {
      await connectMongo();
      status.database = 'connected';
      res.json(status);
    } catch (error) {
      status.database = 'error';
      res.status(503).json(status);
    }
  } else {
    res.json(status);
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
});

// CORS error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err.message === 'Not allowed by CORS') {
    console.error('CORS Error:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      allowedOrigins
    });
    res.status(403).json({
      message: 'CORS policy violation: Origin not allowed',
      origin: req.headers.origin
    });
  } else {
    next(err);
  }
});

// General error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: isDevelopment ? err.message : undefined
  });
});

// Start server with retry logic
const startServer = async (retryCount = 0, maxRetries = 3) => {
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0';

  try {
    // Initial database connection attempt
    await connectMongo();

    const server = app.listen(port, host, () => {
      console.log(`Server running at http://${host}:${port}`);
      const address = server.address();
      if (address && typeof address !== 'string') {
        console.log('Server address details:', {
          address: address.address,
          family: address.family,
          port: address.port
        });
      }
      console.log('Process ID:', process.pid);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && retryCount < maxRetries) {
        console.log(`Port ${port} is in use, trying port ${port + 1}...`);
        process.env.PORT = (port + 1).toString();
        startServer(retryCount + 1, maxRetries);
      } else {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (retryCount < maxRetries) {
      console.log(`Retrying server start... Attempt ${retryCount + 1} of ${maxRetries}`);
      setTimeout(() => startServer(retryCount + 1, maxRetries), 5000);
    } else {
      console.error('Failed to start server after maximum retries');
      process.exit(1);
    }
  }
};

startServer();

export default app;
