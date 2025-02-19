import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password, phone } = req.body;

    // Check if email or username already exist
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken." });
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password: hashedPass,
      phone
    });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err });
  }
}