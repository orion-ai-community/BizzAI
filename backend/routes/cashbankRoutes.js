import express from "express";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  createTransfer,
  getAccountLedger,
  toggleReconciliation,
  bulkReconcile,
  getBankSummary,
  getCashBankPosition,
  exportStatement,
  createCashTransaction,
} from "../controllers/cashbankController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Account Management
router.get("/accounts", protect, getAccounts);
router.post("/accounts", protect, createAccount);
router.put("/accounts/:id", protect, updateAccount);
router.delete("/accounts/:id", protect, deleteAccount);

// Transactions
router.get("/accounts/:id/transactions", protect, getTransactions);
router.post("/transfers", protect, createTransfer);
router.post("/cash-transactions", protect, createCashTransaction);

// Reconciliation & Ledger
router.get("/accounts/:id/ledger", protect, getAccountLedger);
router.put("/transactions/:id/reconcile", protect, toggleReconciliation);
router.put("/transactions/bulk-reconcile", protect, bulkReconcile);

// Reporting
router.get("/summary", protect, getBankSummary);
router.get("/position", protect, getCashBankPosition);
router.get("/export", protect, exportStatement);

export default router;