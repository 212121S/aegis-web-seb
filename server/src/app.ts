import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo } from "./database"; // your Mongoose connect function
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";

dotenv.config();

const app = express();

// CORS setup: allow local dev & your production domain
app.use(cors({
  origin: [
    "http://localhost:3000",        // local dev React
    "https://www.aegistestingtech.com" // your deployed frontend domain
  ]
}));
app.use(express.json());

// 1) Connect to Mongo
connectMongo().catch((err) => {
  console.error("Failed to init Mongo:", err);
  process.exit(1);
});

// 2) Basic test route
app.get("/", (req, res) => {
  res.send("Hello from Aegis!");
});

// 3) Use your routes
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);

// 4) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});