import express from "express";
import {
    createReturn,
    getAllReturns,
    getReturnById,
    deleteReturn,
} from "../controllers/returnController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";
import { auditDelete } from "../middlewares/auditMiddleware.js";

const router = express.Router();

router.post("/", protect, createReturn);
router.get("/", protect, getAllReturns);
router.get("/:id", protect, getReturnById);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:return"),
    auditDelete("Return", "DELETE_RETURN"),
    deleteReturn
);

export default router;
