import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// GET /api/auth/verify
router.get("/verify", authController.verify);

export default router;
