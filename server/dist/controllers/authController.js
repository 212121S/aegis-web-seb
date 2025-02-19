"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function register(req, res) {
    try {
        const { email, username, password, phone } = req.body;
        // Check if email or username already exist
        const existingEmail = await User_1.default.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already registered." });
        }
        const existingUsername = await User_1.default.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken." });
        }
        // Hash password
        const hashedPass = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({
            email,
            username,
            password: hashedPass,
            phone
        });
        await newUser.save();
        return res.status(201).json({ message: "User registered successfully!" });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: err });
    }
}
exports.register = register;
