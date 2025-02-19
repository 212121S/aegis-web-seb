import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPass });
    await newUser.save();
    return res.status(201).json({ message: "User registered" });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "secret";
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h"
    });

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}