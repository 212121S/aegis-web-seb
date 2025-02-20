"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import your route modules
const auth_1 = __importDefault(require("./routes/auth"));
const exam_1 = __importDefault(require("./routes/exam"));
const payment_1 = __importDefault(require("./routes/payment"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Stripe webhook needs raw body
app.use('/api/payment/webhook', express_1.default.raw({ type: 'application/json' }), (req, res, next) => {
    if (req.originalUrl === '/api/payment/webhook') {
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// Regular middleware for other routes
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Connect to Mongo once on startup
(0, database_1.connectMongo)().catch((err) => {
    console.error("Failed to connect Mongo:", err);
    process.exit(1);
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Mount your routes here
app.use("/api/auth", auth_1.default);
app.use("/api/exam", exam_1.default);
app.use("/api/payment", payment_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Export the app for testing
exports.default = app;
