import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// (Optional) If you have login logic:
// router.post("/login", authController.login);

export default router;