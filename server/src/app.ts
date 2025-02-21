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
  ? ['http://localhost:3000', 'http://localhost:3001']
  : ['https://aegistestingtech.com'];

// Function to check if origin matches allowed patterns
const isOriginAllowed = (origin: string): boolean => {
  if (isDevelopment) {
    return allowedOrigins.includes(origin);
  }
  // In production, allow both www and non-www versions
  return origin === 'https://aegistestingtech.com' || 
         origin === 'https://www.aegistestingtech.com';
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

// CORS configuration
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
      console.log(`[CORS] Origin ${origin} is not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
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
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing
export default app;
