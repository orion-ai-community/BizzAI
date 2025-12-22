import express from "express";
import { registerUser, loginUser, getProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST - Register a new user
router.post("/register", registerUser);

// POST - Login existing user
router.post("/login", loginUser);

// GET - Get current user profile (protected)
router.get("/profile", protect, getProfile);

// Password reset flow
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
