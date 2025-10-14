import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
const prisma = new PrismaClient();
export class AIIntegrationService {
    /**
     * Process accident alert received from AI service
     */
    static async processAccidentAlert(alertData) {
        try {
            // Store the alert in the database
            const incident = await prisma.incident.create({
                data: {
                    type: this.mapAlertTypeToIncidentType(alertData.type),
                    title: `${alertData.type.charAt(0).toUpperCase() + alertData.type.slice(1)} Alert`,
                    description: alertData.description,
                    latitude: alertData.location.latitude,
                    longitude: alertData.location.longitude,
                    address: alertData.location.address || "Unknown Location",
                    status: "REPORTED",
                    severity: this.mapAlertSeverityToIncidentSeverity(alertData.severity),
                    reportedAt: new Date(alertData.timestamp),
                    metadata: {
                        confidence: alertData.confidence,
                        vehiclesInvolved: alertData.vehiclesInvolved || [],
                        imageUrl: alertData.imageUrl,
                        videoUrl: alertData.videoUrl,
                        aiDetected: true,
                    },
                },
            });
            logger.info(`Accident alert processed successfully: ${alertData.type}`);
            return {
                success: true,
                message: "Alert processed successfully",
                data: incident,
            };
        }
        catch (error) {
            logger.error(`Error processing accident alert: ${error.message}`);
            return {
                success: false,
                message: error.message || "Failed to process alert",
            };
        }
    }
    /**
     * Get accident data from database
     */
    static async getAccidentData() {
        try {
            const incidents = await prisma.incident.findMany({
                where: {
                    metadata: {
                        path: ["aiDetected"],
                        equals: true,
                    },
                },
                orderBy: {
                    reportedAt: "desc",
                },
            });
            return {
                success: true,
                data: incidents,
            };
        }
        catch (error) {
            logger.error(`Error getting accident data: ${error.message}`);
            return {
                success: false,
                message: error.message || "Failed to get accident data",
            };
        }
    }
    /**
     * Get specific accident by ID from database
     */
    static async getAccidentById(accidentId) {
        try {
            const incident = await prisma.incident.findFirst({
                where: {
                    OR: [{ id: accidentId }, { externalId: accidentId }],
                    metadata: {
                        path: ["aiDetected"],
                        equals: true,
                    },
                },
            });
            if (incident) {
                return {
                    success: true,
                    data: incident,
                };
            }
            else {
                return {
                    success: false,
                    message: "Accident not found",
                };
            }
        }
        catch (error) {
            logger.error(`Error getting accident by ID: ${error.message}`);
            return {
                success: false,
                message: error.message || "Failed to get accident data",
            };
        }
    }
    /**
     * Process media for detection (placeholder - AI service handles this)
     */
    static async processMediaForDetection(mediaUrl, mediaType, location) {
        try {
            // This method is now handled by the AI service
            // The AI service will send POST requests to the backend when incidents are detected
            logger.info(`Media detection request received: ${mediaType} - ${mediaUrl}`);
            return {
                success: true,
                detections: [],
                message: "Detection request forwarded to AI service",
            };
        }
        catch (error) {
            logger.error(`Error processing media for detection: ${error.message}`);
            return {
                success: false,
                message: error.message || "Failed to process media for detection",
            };
        }
    }
    /**
     * Report accident (store in database)
     */
    static async reportAccident(accidentData) {
        try {
            const incident = await prisma.incident.create({
                data: {
                    type: "ACCIDENT",
                    title: "User Reported Accident",
                    description: "Accident reported by user",
                    latitude: accidentData.location[0],
                    longitude: accidentData.location[1],
                    address: "User Reported Location",
                    status: "REPORTED",
                    severity: accidentData.confidence > 0.8 ? "HIGH" : "MEDIUM",
                    reportedAt: new Date(),
                    metadata: {
                        confidence: accidentData.confidence,
                        vehiclesInvolved: accidentData.vehicles_involved,
                        imageUrl: accidentData.imageUrl,
                        videoUrl: accidentData.videoUrl,
                        userReported: true,
                    },
                },
            });
            return {
                success: true,
                data: incident,
            };
        }
        catch (error) {
            logger.error(`Error reporting accident: ${error.message}`);
            return {
                success: false,
                message: error.message || "Failed to report accident",
            };
        }
    }
    /**
     * Sync accident data with database
     */
    static async syncAccidentData() {
        try {
            // Get all AI-detected incidents
            const incidents = await prisma.incident.findMany({
                where: {
                    metadata: {
                        path: ["aiDetected"],
                        equals: true,
                    },
                },
            });
            logger.info(`Found ${incidents.length} AI-detected incidents`);
            return {
                success: true,
                synced: incidents.length,
            };
        }
        catch (error) {
            logger.error(`Error syncing accident data: ${error.message}`);
            return {
                success: false,
                synced: 0,
                message: error.message || "Failed to sync accident data",
            };
        }
    }
    /**
     * Check AI service health (placeholder)
     */
    static async checkHealth() {
        try {
            // Since we're not making HTTP requests to AI service anymore,
            // we'll just return a success status
            return {
                success: true,
                message: "AI integration service is healthy",
            };
        }
        catch (error) {
            logger.error(`AI service health check failed: ${error.message}`);
            return {
                success: false,
                message: `AI integration service is not available: ${error.message}`,
            };
        }
    }
    /**
     * Map alert type to incident type
     */
    static mapAlertTypeToIncidentType(alertType) {
        const typeMap = {
            accident: "ACCIDENT",
            fire: "FIRE",
            traffic_violation: "TRAFFIC_VIOLATION",
        };
        return typeMap[alertType] || "OTHER";
    }
    /**
     * Map alert severity to incident severity
     */
    static mapAlertSeverityToIncidentSeverity(alertSeverity) {
        const severityMap = {
            low: "LOW",
            medium: "MEDIUM",
            high: "HIGH",
            critical: "CRITICAL",
        };
        return severityMap[alertSeverity] || "MEDIUM";
    }
}
