"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
async function register(req, res) {
    try {
        const { email, username, password, phone } = req.body;
        const userCol = (0, User_1.getUserCollection)();
        // 1) Check if email or username exist
        const existingEmail = await userCol.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already registered." });
        }
        const existingUsername = await userCol.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken." });
        }
        // 2) Hash password
        const hashedPass = await bcrypt_1.default.hash(password, 10);
        // 3) Insert new user doc
        const newUser = {
            email,
            username,
            password: hashedPass,
            phone,
            role: "student" // or set default if you want
        };
        await userCol.insertOne(newUser);
        return res.status(201).json({ message: "User registered successfully!" });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: err });
    }
}
exports.register = register;
