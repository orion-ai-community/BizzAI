import express from "express";
import {
  getSettings,
  updateSettings,
  updatePassword,
} from "../controllers/settingsController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, updateSettings);
router.put("/password", protect, updatePassword);

export default router;
