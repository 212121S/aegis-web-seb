import express, { Request, Response, NextFunction } from "express";
import { connectMongo } from "./database";
import cors from "cors";
import dotenv from "dotenv";

// Import your route modules
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import paymentRoutes from "./routes/payment";

dotenv.config();

const app = express();

// Stripe webhook needs raw body
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

// Regular middleware for other routes
// Configure CORS with proper options
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'https://www.aegistestingtech.com'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to Mongo once on startup
connectMongo().catch((err) => {
  console.error("Failed to connect Mongo:", err);
  process.exit(1);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Mount your routes here
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/payment", paymentRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing
export default app;
