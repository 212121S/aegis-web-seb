import express, { Request, Response, NextFunction } from "express";
import path from 'path';
import fs from 'fs';
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
import webhookRoutes from "./routes/webhook";
import verificationRoutes from "./routes/verification";
import practiceTestRoutes from "./routes/practiceTest";

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
  origin: '*', // Allow all origins temporarily for debugging
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
app.use('/payment/webhook', express.raw({ type: 'application/json' }));

// Parse request bodies for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware
const requireDatabaseConnection = async (req: Request, res: Response, next: NextFunction) => {
  if (!isConnected()) {
    try {
      await connectMongo();
      return next();
    } catch (error) {
      console.error('Database connection failed:', error);
      res.status(503).json({ error: 'Database connection failed' });
    }
  } else {
    next();
  }
};

// Mount webhook route first (before database middleware)
app.use("/payment/webhook", webhookRoutes);

// Apply database connection middleware to all other routes
app.use(requireDatabaseConnection);

// Log mounted routes for debugging
console.log('Mounting API routes:', {
  auth: '/api/auth',
  exam: '/api/exam',
  payment: '/api/payment',
  verification: '/api/verification',
  practice: '/api/practice'
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/practice", practiceTestRoutes);

// Mount verification routes with explicit logging
app.use("/api/verification", (req: Request, res: Response, next: NextFunction) => {
  console.log('Verification route accessed:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    dirname: __dirname
  });

  // Check if this is the universities endpoint
  if (req.path === '/universities') {
    console.log('Universities endpoint hit');
    const universitiesPath = path.join(process.cwd(), 'src/data/universities.json');
    try {
      const fileContent = fs.readFileSync(universitiesPath, 'utf8');
      console.log('File content:', fileContent);
      
      const universitiesData = JSON.parse(fileContent);
      console.log('Parsed data:', universitiesData);
      
      const usUniversities = universitiesData.US;
      console.log('US universities:', usUniversities);
      
      const ukUniversities = universitiesData.International.filter(
        (uni: any) => uni.country === 'United Kingdom'
      );
      console.log('UK universities:', ukUniversities);
      
      const universities = [...usUniversities, ...ukUniversities];
      console.log('Combined universities:', universities);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json(universities);
    } catch (error) {
      console.error('Error reading universities:', error);
      return res.status(500).json({ error: 'Failed to fetch universities' });
    }
  }

  return next();
}, verificationRoutes);

// Add catch-all route for debugging
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  console.log('Catch-all route hit:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  
  // If this is a 404, send a proper error response
  if (!res.headersSent) {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Log all registered routes
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log('Route:', {
      path: middleware.route.path,
      methods: Object.keys(middleware.route.methods)
    });
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log('Nested Route:', {
          path: handler.route.path,
          methods: Object.keys(handler.route.methods)
        });
      }
    });
  }
});

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
  const port = process.env.NODE_ENV === 'production' ? 10000 : parseInt(process.env.PORT || '3000', 10);
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
