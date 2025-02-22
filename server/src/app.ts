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
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (!isDevelopment) {
    try {
      const originUrl = new URL(origin);
      return originUrl.hostname.endsWith('aegistestingtech.com');
    } catch (error) {
      console.error(`[CORS] Error parsing origin URL:`, error);
    }
  }

  return false;
};

// Enhanced CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
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
    'X-Requested-With'
  ],
  maxAge: 86400
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook needs raw body
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' })
);

// Connect to MongoDB
connectMongo().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/verify", verificationRoutes);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await connectMongo();
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// CORS error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err.message === 'Not allowed by CORS') {
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
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server with retry logic
const startServer = async (retryCount = 0, maxRetries = 3) => {
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0';

  try {
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
    process.exit(1);
  }
};

startServer();

export default app;
