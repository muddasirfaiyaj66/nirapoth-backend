import { GemPenaltyService } from "../services/gemPenalty.service";
/**
 * Search driver by license number
 * @route GET /api/police/search-driver?license=XXX
 */
export const searchDriverByLicense = async (req, res) => {
    try {
        // Support both 'license' and 'licenseNo' query param names (frontend uses licenseNo)
        const license = (req.query.license || req.query.licenseNo);
        if (!license || typeof license !== "string") {
            res.status(400).json({
                success: false,
                message: "License number is required",
            });
            return;
        }
        const result = await GemPenaltyService.searchByLicense(license);
        if (!result) {
            res.status(404).json({
                success: false,
                message: "Driver not found with the provided license number",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: result,
            message: "Driver found successfully",
        });
    }
    catch (error) {
        console.error("Error searching driver:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to search driver",
        });
    }
};
/**
 * Apply gem penalty to a driver
 * @route POST /api/police/apply-gem-penalty
 */
export const applyGemPenalty = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        const { citizenId, amount, reason, violationType, severity, violationId, licenseNo, notes, } = req.body || {};
        // Coerce amount to number if possible (frontend may send number or string)
        const parsedAmount = typeof amount === "string" ? Number(amount) : amount;
        // Validation: ensure required fields are present and amount is a positive number
        if (!citizenId || parsedAmount == null || !reason || !severity) {
            if (process.env.NODE_ENV === "development") {
                console.error("applyGemPenalty validation failed - request body:", req.body);
            }
            res.status(400).json({
                success: false,
                message: "Citizen ID, amount, reason, and severity are required",
            });
            return;
        }
        if (isNaN(parsedAmount) || Number(parsedAmount) < 1) {
            res.status(400).json({
                success: false,
                message: "Penalty amount must be a number greater than 0",
            });
            return;
        }
        const result = await GemPenaltyService.applyPenalty({
            citizenId,
            amount: Number(parsedAmount),
            reason,
            violationType: violationType,
            severity: severity,
            violationId,
            licenseNo,
            appliedBy: userId,
            notes,
        });
        res.status(201).json({
            success: true,
            data: result,
            message: `Gem penalty of ${amount} gems applied successfully`,
        });
    }
    catch (error) {
        console.error("Error applying gem penalty:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to apply gem penalty",
        });
    }
};
/**
 * Get gem penalty history for a citizen
 * @route GET /api/police/gem-penalty-history/:citizenId
 */
export const getGemPenaltyHistory = async (req, res) => {
    try {
        const { citizenId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        const result = await GemPenaltyService.getPenaltyHistory(citizenId, limit, skip);
        res.status(200).json({
            success: true,
            data: result.penalties,
            total: result.total,
            hasMore: result.hasMore,
        });
    }
    catch (error) {
        console.error("Error fetching gem penalty history:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch gem penalty history",
        });
    }
};
/**
 * Get all gem penalties (admin/police)
 * @route GET /api/police/gem-penalties
 */
export const getAllGemPenalties = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        const filters = {};
        if (req.query.citizenId)
            filters.citizenId = req.query.citizenId;
        if (req.query.appliedBy)
            filters.appliedBy = req.query.appliedBy;
        if (req.query.severity)
            filters.severity = req.query.severity;
        if (req.query.dateFrom)
            filters.dateFrom = new Date(req.query.dateFrom);
        if (req.query.dateTo)
            filters.dateTo = new Date(req.query.dateTo);
        const result = await GemPenaltyService.getAllPenalties(filters, limit, skip);
        res.status(200).json({
            success: true,
            data: result.penalties,
            total: result.total,
            hasMore: result.hasMore,
        });
    }
    catch (error) {
        console.error("Error fetching all gem penalties:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch gem penalties",
        });
    }
};
/**
 * Get gem penalty statistics
 * @route GET /api/police/gem-penalty-stats
 */
export const getGemPenaltyStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const officerId = req.query.myStats === "true" ? userId : undefined;
        const stats = await GemPenaltyService.getStatistics(officerId);
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error("Error fetching gem penalty stats:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch gem penalty statistics",
        });
    }
};
/**
 * Get recommended gem deduction amount
 * @route GET /api/police/recommended-deduction/:severity
 */
export const getRecommendedDeduction = async (req, res) => {
    try {
        const { severity } = req.params;
        const amount = GemPenaltyService.getRecommendedDeduction(severity);
        res.status(200).json({
            success: true,
            data: {
                severity,
                recommendedAmount: amount,
            },
        });
    }
    catch (error) {
        console.error("Error getting recommended deduction:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get recommended deduction",
        });
    }
};
