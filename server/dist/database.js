"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = void 0;
// server/src/database.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // loads .env
const MONGO_URI = process.env.MONGO_URI || "";
if (!MONGO_URI) {
    throw new Error("No MONGO_URI found in .env");
}
// Connects via Mongoose instead of MongoClient
async function connectMongo() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB Atlas via Mongoose!");
    }
    catch (err) {
        console.error("Mongoose connect error:", err);
        throw err;
    }
}
exports.connectMongo = connectMongo;
