import DrivingLicenseService from "../services/drivingLicense.service";
class DrivingLicenseController {
    /**
     * Create a new driving license (Citizen only)
     * POST /api/driving-licenses
     */
    async createLicense(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const { licenseNo, category, issueDate, expiryDate, issuingAuthority, restrictions, endorsements, } = req.body;
            // Validation
            if (!licenseNo ||
                !category ||
                !issueDate ||
                !expiryDate ||
                !issuingAuthority) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
                return;
            }
            const license = await DrivingLicenseService.createLicense({
                licenseNo,
                citizenId: userId,
                category: category,
                issueDate: new Date(issueDate),
                expiryDate: new Date(expiryDate),
                issuingAuthority,
                restrictions,
                endorsements,
            });
            res.status(201).json({
                success: true,
                message: "Driving license created successfully. You received 10 gems!",
                data: license,
            });
        }
        catch (error) {
            console.error("❌ Error creating driving license:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to create driving license",
            });
        }
    }
    /**
     * Get current user's driving license
     * GET /api/driving-licenses/my-license
     */
    async getMyLicense(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const license = await DrivingLicenseService.getLicenseByUserId(userId);
            if (!license) {
                res.status(404).json({
                    success: false,
                    message: "No driving license found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: license,
            });
        }
        catch (error) {
            console.error("❌ Error fetching driving license:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch driving license",
            });
        }
    }
    /**
     * Get license by ID (Admin/Police)
     * GET /api/driving-licenses/:id
     */
    async getLicenseById(req, res) {
        try {
            const { id } = req.params;
            const license = await DrivingLicenseService.getLicenseById(id);
            if (!license) {
                res.status(404).json({
                    success: false,
                    message: "License not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: license,
            });
        }
        catch (error) {
            console.error("❌ Error fetching license:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch license",
            });
        }
    }
    /**
     * Get license by license number (Admin/Police)
     * GET /api/driving-licenses/by-license-no/:licenseNo
     */
    async getLicenseByLicenseNo(req, res) {
        try {
            const { licenseNo } = req.params;
            const license = await DrivingLicenseService.getLicenseByLicenseNo(licenseNo);
            if (!license) {
                res.status(404).json({
                    success: false,
                    message: "License not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: license,
            });
        }
        catch (error) {
            console.error("❌ Error fetching license:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch license",
            });
        }
    }
    /**
     * Update driving license (Citizen only - own license)
     * PATCH /api/driving-licenses/:id
     */
    async updateLicense(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            // Verify ownership
            const existingLicense = await DrivingLicenseService.getLicenseById(id);
            if (!existingLicense || existingLicense.citizenId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this license",
                });
                return;
            }
            const { category, expiryDate, restrictions, endorsements, isActive } = req.body;
            const updatedLicense = await DrivingLicenseService.updateLicense(id, {
                category,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                restrictions,
                endorsements,
                isActive,
            });
            res.status(200).json({
                success: true,
                message: "License updated successfully",
                data: updatedLicense,
            });
        }
        catch (error) {
            console.error("❌ Error updating license:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to update license",
            });
        }
    }
    /**
     * Deduct gems from license (Police only)
     * POST /api/driving-licenses/:id/deduct-gems
     */
    async deductGems(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const { id } = req.params;
            const { gemsToDeduct, reason } = req.body;
            if (!userId || userRole !== "POLICE") {
                res.status(403).json({
                    success: false,
                    message: "Only police officers can deduct gems",
                });
                return;
            }
            if (!gemsToDeduct || !reason) {
                res.status(400).json({
                    success: false,
                    message: "Gems to deduct and reason are required",
                });
                return;
            }
            const result = await DrivingLicenseService.deductGems({
                licenseId: id,
                gemsToDeduct: parseInt(gemsToDeduct),
                reason,
                deductedBy: userId,
            });
            let message = `${gemsToDeduct} gem(s) deducted successfully. Remaining: ${result.remainingGems}`;
            if (result.blacklisted) {
                message = `License blacklisted! All gems depleted. Driver must pay ৳5000 penalty and reapply for driving test.`;
            }
            res.status(200).json({
                success: true,
                message,
                data: {
                    license: result.license,
                    blacklisted: result.blacklisted,
                    remainingGems: result.remainingGems,
                },
            });
        }
        catch (error) {
            console.error("❌ Error deducting gems:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to deduct gems",
            });
        }
    }
    /**
     * Check if license is valid
     * GET /api/driving-licenses/:id/validity
     */
    async checkValidity(req, res) {
        try {
            const { id } = req.params;
            const validity = await DrivingLicenseService.isLicenseValid(id);
            res.status(200).json({
                success: true,
                data: validity,
            });
        }
        catch (error) {
            console.error("❌ Error checking license validity:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to check license validity",
            });
        }
    }
    /**
     * Get all blacklisted licenses (Admin/Police)
     * GET /api/driving-licenses/blacklisted
     */
    async getBlacklistedLicenses(req, res) {
        try {
            const userRole = req.user?.role;
            if (userRole !== "POLICE" &&
                userRole !== "ADMIN" &&
                userRole !== "SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const blacklistedLicenses = await DrivingLicenseService.getBlacklistedLicenses();
            res.status(200).json({
                success: true,
                data: blacklistedLicenses,
            });
        }
        catch (error) {
            console.error("❌ Error fetching blacklisted licenses:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch blacklisted licenses",
            });
        }
    }
    /**
     * Pay blacklist penalty
     * POST /api/driving-licenses/:id/pay-blacklist-penalty
     */
    async payBlacklistPenalty(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            // Verify ownership
            const license = await DrivingLicenseService.getLicenseById(id);
            if (!license || license.citizenId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to pay for this license",
                });
                return;
            }
            await DrivingLicenseService.payBlacklistPenalty(id);
            res.status(200).json({
                success: true,
                message: "Blacklist penalty paid successfully. You may now reapply for your driving test.",
            });
        }
        catch (error) {
            console.error("❌ Error paying blacklist penalty:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to pay blacklist penalty",
            });
        }
    }
}
export default new DrivingLicenseController();
