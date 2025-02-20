"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const User_1 = require("../models/User");
async function register(req, res) {
    try {
        const { email, name, password } = req.body;
        // 1) Check if email exists
        const existingUser = await User_1.User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered." });
        }
        // 2) Create new user
        const newUser = new User_1.User({
            email,
            name,
            password // Password will be hashed by the pre-save hook
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
