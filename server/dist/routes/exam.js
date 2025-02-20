"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const examController = __importStar(require("../controllers/examController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const subscriptionMiddleware_1 = require("../middleware/subscriptionMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Configure multer for recording uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});
// Test session management - all routes require active subscription
router.post("/initialize", authMiddleware_1.authenticateToken, subscriptionMiddleware_1.requireActiveSubscription, examController.initializeTest);
router.get("/:sessionId/next", authMiddleware_1.authenticateToken, subscriptionMiddleware_1.requireActiveSubscription, examController.getNextQuestion);
router.post("/:sessionId/answer", authMiddleware_1.authenticateToken, subscriptionMiddleware_1.requireActiveSubscription, examController.submitAnswer);
router.post("/:sessionId/recording", authMiddleware_1.authenticateToken, subscriptionMiddleware_1.requireActiveSubscription, upload.single('recording'), examController.submitRecording);
router.post("/:sessionId/finalize", authMiddleware_1.authenticateToken, subscriptionMiddleware_1.requireActiveSubscription, examController.finalizeTest);
exports.default = router;
