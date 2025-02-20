import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserCollection, IUser } from "../models/User";

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password, phone } = req.body;
    const userCol = getUserCollection();

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
    const hashedPass = await bcrypt.hash(password, 10);

    // 3) Insert new user doc
    const newUser: IUser = {
      email,
      username,
      password: hashedPass,
      phone,
      role: "student" // or set default if you want
    };
    await userCol.insertOne(newUser);

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err });
  }
}