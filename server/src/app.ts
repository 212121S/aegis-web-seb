import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";

dotenv.config();

const app = express();

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000"] // Adjust for your React dev or production
}));
app.use(morgan("dev"));

// ---------- ROUTES ----------
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);

// ---------- DATABASE & SERVER INIT ----------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aegis";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

export default app;