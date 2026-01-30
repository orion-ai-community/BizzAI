import express from "express";
import {
  getAllExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  restoreExpense,
  getExpenseSummary,
  getExpenseAnalytics,
  getRecurringExpenses,
  bulkDeleteExpenses,
  bulkUpdateCategory,
  exportExpenses,
} from "../controllers/expenseController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Summary and analytics routes (must be before /:id routes)
router.get("/summary", protect, getExpenseSummary);
router.get("/analytics", protect, getExpenseAnalytics);
router.get("/recurring", protect, getRecurringExpenses);
router.get("/export", protect, exportExpenses);

// Bulk operations
router.post("/bulk-delete", protect, bulkDeleteExpenses);
router.put("/bulk-update-category", protect, bulkUpdateCategory);

// Standard CRUD routes
router.get("/", protect, getAllExpenses);
router.post("/", protect, createExpense);
router.get("/:id", protect, getExpenseById);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

// Restore soft-deleted expense
router.post("/:id/restore", protect, restoreExpense);

export default router;
