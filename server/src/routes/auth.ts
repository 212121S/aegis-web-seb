import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// Protected routes
router.get("/verify", authenticateToken, authController.verify);
router.get("/user/profile", authenticateToken, authController.getProfile);

export default router;
