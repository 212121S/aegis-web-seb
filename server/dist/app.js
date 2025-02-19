"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database"); // your Mongoose connect function
const auth_1 = __importDefault(require("./routes/auth"));
const exam_1 = __importDefault(require("./routes/exam"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS setup: allow local dev & your production domain
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "https://www.aegistestingtech.com" // your deployed frontend domain
    ]
}));
app.use(express_1.default.json());
// 1) Connect to Mongo
(0, database_1.connectMongo)().catch((err) => {
    console.error("Failed to init Mongo:", err);
    process.exit(1);
});
// 2) Basic test route
app.get("/", (req, res) => {
    res.send("Hello from Aegis!");
});
// 3) Use your routes
app.use("/api/auth", auth_1.default);
app.use("/api/exam", exam_1.default);
// 4) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
