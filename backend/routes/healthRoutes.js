import express from "express";
import {
    healthCheck,
    readinessCheck,
    livenessCheck,
} from "../controllers/healthController.js";

const router = express.Router();

// Basic health check
router.get("/", healthCheck);

// Kubernetes-style readiness probe
router.get("/ready", readinessCheck);

// Kubernetes-style liveness probe
router.get("/live", livenessCheck);

export default router;
