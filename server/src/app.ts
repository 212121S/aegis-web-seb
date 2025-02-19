import express from "express";
import { connectMongo } from "./database"; // <-- from step 2
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to Mongo
connectMongo().catch((err) => {
  console.error("Failed to init Mongo:", err);
  process.exit(1);
});

// Example route
app.get("/", (req, res) => {
  res.send("Hello from Aegis!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});