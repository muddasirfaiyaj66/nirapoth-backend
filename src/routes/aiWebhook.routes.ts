import express from "express";
import {
  fireDetectionWebhook,
  accidentDetectionWebhook,
  violationDetectionWebhook,
  webhookHealthCheck,
} from "../controllers/aiWebhook.controller";

const router = express.Router();

/**
 * @route GET /api/ai-webhook/health
 * @desc Health check for AI webhook system
 * @access Public
 */
router.get("/health", webhookHealthCheck);

/**
 * @route POST /api/ai-webhook/fire-detection
 * @desc Webhook for AI fire detection
 * @access Public (AI System Only)
 * @body {
 *   imageUrl: string (Cloudinary URL),
 *   location: { latitude: number, longitude: number, address?: string, locationId?: string },
 *   severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   confidence: number (0-100)
 * }
 */
router.post("/fire-detection", fireDetectionWebhook);

/**
 * @route POST /api/ai-webhook/accident-detection
 * @desc Webhook for AI accident detection
 * @access Public (AI System Only)
 * @body {
 *   imageUrl: string (Cloudinary URL),
 *   location: { latitude: number, longitude: number, address?: string, locationId?: string },
 *   severity: "MINOR" | "MODERATE" | "SERIOUS" | "SEVERE" | "CRITICAL",
 *   confidence: number (0-100),
 *   vehiclesInvolved?: number
 * }
 */
router.post("/accident-detection", accidentDetectionWebhook);

/**
 * @route POST /api/ai-webhook/violation-detection
 * @desc Webhook for AI traffic violation detection
 * @access Public (AI System Only)
 * @body {
 *   imageUrl: string (Cloudinary URL),
 *   numberPlate: string (e.g., "লক্ষ্মীপুর-ল-১১-৬১২৬"),
 *   violationType: "SPEEDING" | "RED_LIGHT" | "WRONG_WAY" | "NO_HELMET" | "RECKLESS_DRIVING",
 *   location: { latitude: number, longitude: number, address?: string },
 *   confidence: number (0-100),
 *   speed?: number,
 *   speedLimit?: number
 * }
 */
router.post("/violation-detection", violationDetectionWebhook);

export { router as aiWebhookRoutes };
