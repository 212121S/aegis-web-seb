// NEW app.ts
import express from "express";
import { connectMongo } from "./database";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Mongo once on startup
connectMongo().catch(err => {
  console.error("Failed to connect Mongo", err);
  process.exit(1);
});

// Your routes, e.g. app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});