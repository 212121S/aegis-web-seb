"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./database"); // <-- from step 2
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "https://www.aegistestingtech.com"
    ]
}));
app.use(express_1.default.json());
// Connect to Mongo
(0, database_1.connectMongo)().catch((err) => {
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
