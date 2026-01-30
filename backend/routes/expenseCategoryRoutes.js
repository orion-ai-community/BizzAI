import express from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryBudgetStatus,
    getAllBudgetUtilization,
    seedDefaultCategories,
} from "../controllers/expenseCategoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Budget routes (must be before /:id routes)
router.get("/budget-utilization", protect, getAllBudgetUtilization);

// Seed default categories
router.post("/seed-defaults", protect, seedDefaultCategories);

// Standard CRUD routes
router.get("/", protect, getAllCategories);
router.post("/", protect, createCategory);
router.get("/:id", protect, getCategoryById);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

// Budget status for specific category
router.get("/:id/budget-status", protect, getCategoryBudgetStatus);

export default router;
