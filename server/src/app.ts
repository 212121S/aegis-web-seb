// server/src/app.ts
import express from "express";
import { connectMongo } from "./database";
import cors from "cors";
import dotenv from "dotenv";

// Import your route modules
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Mongo once on startup
connectMongo().catch((err) => {
  console.error("Failed to connect Mongo:", err);
  process.exit(1);
});

// Mount your routes here
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// (Optional) export the app for testing
export default app;