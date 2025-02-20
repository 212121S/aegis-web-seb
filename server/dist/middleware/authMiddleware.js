"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const payload = {
            _id: decoded._id,
            email: decoded.email
        };
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.error('Auth error:', error);
        return res.status(500).json({ message: 'Authentication failed' });
    }
};
exports.authenticateToken = authenticateToken;
// Middleware to check if user has an active subscription
const requireActiveSubscription = async (req, res, next) => {
    try {
        // Example: Check user's subscription status in database
        // const user = await User.findById(req.user?.id);
        // if (!user?.subscription?.active) {
        //   return res.status(403).json({ message: 'Active subscription required' });
        // }
        next();
    }
    catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ message: 'Failed to verify subscription status' });
    }
};
exports.requireActiveSubscription = requireActiveSubscription;
