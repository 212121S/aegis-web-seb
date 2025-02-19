// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ message: "No auth header" });
  }
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}