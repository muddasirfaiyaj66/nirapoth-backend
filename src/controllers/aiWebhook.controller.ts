import { Request, Response } from "express";
import { AIWebhookService } from "../services/aiWebhook.service";

/**
 * @route POST /api/ai-webhook/fire-detection
 * @desc AI webhook for fire detection
 * @access Public (AI System)
 */
export const fireDetectionWebhook = async (req: Request, res: Response) => {
  try {
    console.log("🔥 Fire Detection Webhook Called:", req.body);

    const { imageUrl, location, severity, confidence } = req.body;

    // Validate required fields
    if (!imageUrl || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: imageUrl, location (latitude, longitude)",
      });
    }

    // Process fire detection
    const incident = await AIWebhookService.handleFireDetection({
      imageUrl,
      location,
      severity: severity || "HIGH",
      confidence: confidence || 95,
    });

    // Emit Socket.IO event for real-time notification
    const io = (req.app as any).get("io");
    if (io) {
      io.to("fire-service").emit("fireEmergency", {
        incident,
        message: `🚨 AI DETECTED FIRE: ${location.address || "Unknown location"}`,
        severity: severity || "HIGH",
        isAIDetected: true,
        imageUrl,
      });
    }

    res.status(200).json({
      success: true,
      message: "Fire detection processed successfully",
      incidentId: incident.id,
      notificationsSent: true,
    });
  } catch (error: any) {
    console.error("❌ Fire Detection Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process fire detection",
    });
  }
};

/**
 * @route POST /api/ai-webhook/accident-detection
 * @desc AI webhook for accident detection
 * @access Public (AI System)
 */
export const accidentDetectionWebhook = async (req: Request, res: Response) => {
  try {
    console.log("🚗 Accident Detection Webhook Called:", req.body);

    const { imageUrl, location, severity, confidence, vehiclesInvolved } = req.body;

    // Validate required fields
    if (!imageUrl || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: imageUrl, location (latitude, longitude)",
      });
    }

    // Process accident detection
    const incident = await AIWebhookService.handleAccidentDetection({
      imageUrl,
      location,
      severity: severity || "MODERATE",
      confidence: confidence || 90,
      vehiclesInvolved,
    });

    // Emit Socket.IO event for police
    const io = (req.app as any).get("io");
    if (io) {
      io.to("police").emit("accidentAlert", {
        incident,
        message: `🚨 AI DETECTED ACCIDENT: ${location.address || "Unknown location"}`,
        severity: severity || "MODERATE",
        isAIDetected: true,
        imageUrl,
      });
    }

    res.status(200).json({
      success: true,
      message: "Accident detection processed successfully",
      incidentId: incident.id,
      notificationsSent: true,
    });
  } catch (error: any) {
    console.error("❌ Accident Detection Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process accident detection",
    });
  }
};

/**
 * @route POST /api/ai-webhook/violation-detection
 * @desc AI webhook for traffic violation detection
 * @access Public (AI System)
 */
export const violationDetectionWebhook = async (req: Request, res: Response) => {
  try {
    console.log("⚠️ Violation Detection Webhook Called:", req.body);

    const { imageUrl, numberPlate, violationType, location, confidence, speed, speedLimit } = req.body;

    // Validate required fields
    if (!imageUrl || !numberPlate || !violationType || !location) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: imageUrl, numberPlate, violationType, location",
      });
    }

    // Process violation detection
    const result = await AIWebhookService.handleViolationDetection({
      imageUrl,
      numberPlate,
      violationType,
      location,
      confidence: confidence || 85,
      speed,
      speedLimit,
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        numberPlate: result.numberPlate,
      });
    }

    res.status(200).json({
      success: true,
      message: "Violation detected and fine applied successfully",
      violation: result.violation,
      fine: result.fine,
      owner: {
        id: result.owner.id,
        name: `${result.owner.firstName} ${result.owner.lastName}`,
        email: result.owner.email,
      },
    });
  } catch (error: any) {
    console.error("❌ Violation Detection Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process violation detection",
    });
  }
};

/**
 * @route GET /api/ai-webhook/health
 * @desc Health check for AI webhook system
 * @access Public
 */
export const webhookHealthCheck = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AI Webhook system is operational",
    endpoints: {
      fireDetection: "/api/ai-webhook/fire-detection",
      accidentDetection: "/api/ai-webhook/accident-detection",
      violationDetection: "/api/ai-webhook/violation-detection",
    },
    timestamp: new Date().toISOString(),
  });
};

