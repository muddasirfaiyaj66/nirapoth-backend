"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIIntegrationController = void 0;
const aiIntegration_service_1 = require("../services/aiIntegration.service");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
// Validation schemas
const accidentAlertSchema = zod_1.z.object({
    type: zod_1.z.enum(["accident", "fire", "traffic_violation"]),
    severity: zod_1.z.enum(["low", "medium", "high", "critical"]),
    location: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        address: zod_1.z.string().optional(),
    }),
    description: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    imageUrl: zod_1.z.string().url().optional(),
    videoUrl: zod_1.z.string().url().optional(),
    vehiclesInvolved: zod_1.z.array(zod_1.z.string()).optional(),
});
const reportAccidentSchema = zod_1.z.object({
    location: zod_1.z.array(zod_1.z.number()).length(2),
    confidence: zod_1.z.number().min(0).max(1),
    vehicles_involved: zod_1.z.array(zod_1.z.string()),
    imageUrl: zod_1.z.string().url().optional(),
    videoUrl: zod_1.z.string().url().optional(),
});
const mediaDetectionSchema = zod_1.z.object({
    mediaUrl: zod_1.z.string().url(),
    mediaType: zod_1.z.enum(["image", "video"]),
    location: zod_1.z
        .object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        address: zod_1.z.string().optional(),
    })
        .optional(),
});
class AIIntegrationController {
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
            const result = await aiIntegration_service_1.AIIntegrationService.processAccidentAlert(alertData);
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
            logger_1.logger.error(`Error in sendAccidentAlert: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.getAccidentData();
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
            logger_1.logger.error(`Error in getAccidentData: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.getAccidentById(accidentId);
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
            logger_1.logger.error(`Error in getAccidentById: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.processMediaForDetection(mediaUrl, mediaType, location);
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
            logger_1.logger.error(`Error in processMediaForDetection: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.reportAccident(validationResult.data);
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
            logger_1.logger.error(`Error in reportAccident: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.syncAccidentData();
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
            logger_1.logger.error(`Error in syncAccidentData: ${error.message}`);
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
            const result = await aiIntegration_service_1.AIIntegrationService.checkHealth();
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
            logger_1.logger.error(`Error in checkHealth: ${error.message}`);
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
                aiIntegration_service_1.AIIntegrationService.getAccidentData(),
                aiIntegration_service_1.AIIntegrationService.checkHealth(),
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
            logger_1.logger.error(`Error in getAIStats: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
exports.AIIntegrationController = AIIntegrationController;
