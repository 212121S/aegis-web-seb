import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password, phone } = req.body;

    // Validate required fields
    if (!email || !username || !password || !phone) {
      return res.status(400).json({ 
        message: "All fields are required (email, username, password, phone)" 
      });
    }

    // 1) Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 2) Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken." });
    }

    // 3) Create new user
    const newUser = new User({
      email,
      username,
      password, // Password will be hashed by the pre-save hook
      phone
    });
    await newUser.save();

    return res.status(201).json({ 
      message: "User registered successfully!",
      userId: newUser._id 
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ 
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
