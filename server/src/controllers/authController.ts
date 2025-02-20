import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body;

    // 1) Check if email exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 2) Create new user
    const newUser = new User({
      email,
      name,
      password // Password will be hashed by the pre-save hook
    });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err });
  }
}
