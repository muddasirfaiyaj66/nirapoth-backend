"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiWebhookRoutes = void 0;
const express_1 = require("express");
const aiWebhook_controller_1 = require("../controllers/aiWebhook.controller");
const router = (0, express_1.Router)();
exports.aiWebhookRoutes = router;
/**
 * @route GET /api/ai-webhook/health
 * @desc Health check for AI webhook system
 * @access Public
 */
router.get("/health", aiWebhook_controller_1.webhookHealthCheck);
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
router.post("/fire-detection", aiWebhook_controller_1.fireDetectionWebhook);
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
router.post("/accident-detection", aiWebhook_controller_1.accidentDetectionWebhook);
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
router.post("/violation-detection", aiWebhook_controller_1.violationDetectionWebhook);
