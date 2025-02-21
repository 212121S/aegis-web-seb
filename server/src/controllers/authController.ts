import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        _id: user._id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success with token
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export async function verify(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string; email: string };
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      verified: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Token verification error:", err);
    return res.status(500).json({ 
      message: "Token verification failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

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
