import express, { Request, Response, NextFunction } from "express";
import { connectMongo } from "./database";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";

// Import your route modules
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import paymentRoutes from "./routes/payment";
import verificationRoutes from "./routes/verification";

dotenv.config();

const app = express();

// Development mode check
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure CORS with proper options
const allowedOrigins = isDevelopment 
  ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  : (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Log environment configuration
console.log('Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment,
  DOMAIN: process.env.DOMAIN,
  CLIENT_URL: process.env.CLIENT_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  allowedOrigins
});

// Function to check if origin matches allowed patterns
const isOriginAllowed = (origin: string): boolean => {
  // Log the check for debugging
  console.log(`[CORS] Checking origin: ${origin}`);
  console.log(`[CORS] Allowed origins:`, allowedOrigins);
  
  // Check exact matches first
  if (allowedOrigins.includes(origin)) {
    console.log(`[CORS] Origin ${origin} is allowed by exact match`);
    return true;
  }

  // For production, also allow the domain regardless of subdomain
  if (!isDevelopment) {
    try {
      const originUrl = new URL(origin);
      const isAegisDomain = originUrl.hostname.endsWith('aegistestingtech.com');
      if (isAegisDomain) {
        console.log(`[CORS] Origin ${origin} is allowed as aegistestingtech.com subdomain`);
        return true;
      }
    } catch (error) {
      console.error(`[CORS] Error parsing origin URL:`, error);
    }
  }

  console.log(`[CORS] Origin ${origin} is not allowed`);
  return false;
};

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Request Details:', {
    origin: req.headers.origin,
    method: req.method,
    path: req.url,
    headers: req.headers
  });
  next();
});

// Enhanced CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log(`[CORS] Request from origin: ${origin || 'No Origin'}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('[CORS] No origin - allowing request');
      return callback(null, true);
    }

    // Check if origin is allowed
    if (isOriginAllowed(origin)) {
      console.log(`[CORS] Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      // Log more details about the rejection
      console.error(`[CORS] Origin ${origin} rejected. Details:`, {
        origin,
        allowedOrigins,
        isDevelopment,
        NODE_ENV: process.env.NODE_ENV,
        CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Content-Range',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Response logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[Response] Status: ${res.statusCode}`);
    console.log('[Response] Headers:', res.getHeaders());
    return originalSend.call(this, body);
  };
  next();
});

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook needs raw body - must be before JSON parser
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/payment/webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  }
);

// Connect to Mongo once on startup
connectMongo().catch((err) => {
  console.error("Failed to connect Mongo:", err);
  process.exit(1);
});

// Mount your routes here
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/verify", verificationRoutes);

// Root route for Render health checks
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// CORS error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('CORS Error:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path
    });
    return res.status(403).json({
      message: 'CORS policy violation: Origin not allowed',
      origin: req.headers.origin
    });
  }
  next(err);
});

// General error handling middleware (should be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
console.log('Environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV
});

// Render expects web services to listen on port 3000 by default
const port = process.env.PORT || '3000';
const numericPort = parseInt(port, 10);

if (isNaN(numericPort)) {
  console.error('PORT must be a valid number');
  process.exit(1);
}

const host = '0.0.0.0';
console.log(`Attempting to start server on port ${numericPort}`);

const server = app.listen(numericPort, host, () => {
  const address = server.address();
  console.log('Server started successfully');
  console.log(`Server running at http://${host}:${numericPort}`);
  console.log('Server address details:', address);
  console.log('Process ID:', process.pid);
});

server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Export the app for testing
export default app;
