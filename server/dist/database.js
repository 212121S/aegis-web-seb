"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = exports.client = void 0;
// server/src/database.ts
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGO_URI || "";
exports.client = new mongodb_1.MongoClient(uri);
async function connectMongo() {
    try {
        await exports.client.connect();
        console.log("✅ Connected to MongoDB (Native Driver)!");
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}
exports.connectMongo = connectMongo;
