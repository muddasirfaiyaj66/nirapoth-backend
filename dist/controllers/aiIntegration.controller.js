import { AIIntegrationService } from "../services/aiIntegration.service";
import { logger } from "../utils/logger";
import { z } from "zod";
// Validation schemas
const accidentAlertSchema = z.object({
    type: z.enum(["accident", "fire", "traffic_violation"]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
    }),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    vehiclesInvolved: z.array(z.string()).optional(),
});
const reportAccidentSchema = z.object({
    location: z.array(z.number()).length(2),
    confidence: z.number().min(0).max(1),
    vehicles_involved: z.array(z.string()),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
});
const mediaDetectionSchema = z.object({
    mediaUrl: z.string().url(),
    mediaType: z.enum(["image", "video"]),
    location: z
        .object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
    })
        .optional(),
});
export class AIIntegrationController {
    /**
     * Send accident alert to AI service
     */
    static async sendAccidentAlert(req, res) {
        try {
            const validationResult = accidentAlertSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request data",
                    errors: validationResult.error.issues,
                });
                return;
            }
            const alertData = {
                ...validationResult.data,
                timestamp: new Date().toISOString(),
            };
            const result = await AIIntegrationService.processAccidentAlert(alertData);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "Accident alert sent successfully",
                    data: result.data,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message || "Failed to send accident alert",
                });
            }
        }
        catch (error) {
            logger.error(`Error in sendAccidentAlert: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Get accident data from AI service
     */
    static async getAccidentData(req, res) {
        try {
            const result = await AIIntegrationService.getAccidentData();
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "Accident data retrieved successfully",
                    data: result.data,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message || "Failed to get accident data",
                });
            }
        }
        catch (error) {
            logger.error(`Error in getAccidentData: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Get specific accident by ID from AI service
     */
    static async getAccidentById(req, res) {
        try {
            const { accidentId } = req.params;
            if (!accidentId) {
                res.status(400).json({
                    success: false,
                    message: "Accident ID is required",
                });
                return;
            }
            const result = await AIIntegrationService.getAccidentById(accidentId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "Accident data retrieved successfully",
                    data: result.data,
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: result.message || "Accident not found",
                });
            }
        }
        catch (error) {
            logger.error(`Error in getAccidentById: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Process media link for detection
     */
    static async processMediaForDetection(req, res) {
        try {
            const validationResult = mediaDetectionSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request data",
                    errors: validationResult.error.issues,
                });
                return;
            }
            const { mediaUrl, mediaType, location } = validationResult.data;
            const result = await AIIntegrationService.processMediaForDetection(mediaUrl, mediaType, location);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "Media detection completed successfully",
                    data: {
                        detections: result.detections,
                        mediaUrl,
                        mediaType,
                        location,
                    },
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message || "Failed to process media for detection",
                });
            }
        }
        catch (error) {
            logger.error(`Error in processMediaForDetection: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Report accident to AI service
     */
    static async reportAccident(req, res) {
        try {
            const validationResult = reportAccidentSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request data",
                    errors: validationResult.error.issues,
                });
                return;
            }
            const result = await AIIntegrationService.reportAccident(validationResult.data);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: "Accident reported successfully",
                    data: result.data,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message || "Failed to report accident",
                });
            }
        }
        catch (error) {
            logger.error(`Error in reportAccident: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Sync accident data with database
     */
    static async syncAccidentData(req, res) {
        try {
            const result = await AIIntegrationService.syncAccidentData();
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: `Successfully synced ${result.synced} accidents`,
                    data: {
                        synced: result.synced,
                    },
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message || "Failed to sync accident data",
                });
            }
        }
        catch (error) {
            logger.error(`Error in syncAccidentData: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Check AI service health
     */
    static async checkHealth(req, res) {
        try {
            const result = await AIIntegrationService.checkHealth();
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message || "AI service is healthy",
                    data: {
                        status: "healthy",
                        timestamp: new Date().toISOString(),
                    },
                });
            }
            else {
                res.status(503).json({
                    success: false,
                    message: result.message || "AI service is not available",
                    data: {
                        status: "unhealthy",
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            logger.error(`Error in checkHealth: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Get AI service statistics
     */
    static async getAIStats(req, res) {
        try {
            const [accidentData, healthCheck] = await Promise.all([
                AIIntegrationService.getAccidentData(),
                AIIntegrationService.checkHealth(),
            ]);
            const stats = {
                aiServiceStatus: healthCheck.success ? "healthy" : "unhealthy",
                totalAccidents: accidentData.success
                    ? accidentData.data?.length || 0
                    : 0,
                lastSync: new Date().toISOString(),
                serviceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
            };
            res.status(200).json({
                success: true,
                message: "AI service statistics retrieved successfully",
                data: stats,
            });
        }
        catch (error) {
            logger.error(`Error in getAIStats: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
