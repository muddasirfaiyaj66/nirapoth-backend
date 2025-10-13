import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Dashboard Controller for providing analytics data
 */
export class DashboardController {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats(req, res) {
        try {
            // Get basic counts from database
            const [totalUsers, totalVehicles, totalViolations, totalIncidents, totalComplaints, totalFines, activeCameras, pendingReports, resolvedReports,] = await Promise.all([
                prisma.user.count({ where: { isDeleted: false } }),
                prisma.vehicle.count({ where: { isDeleted: false } }),
                prisma.violation.count(),
                prisma.incident.count(),
                prisma.complaint.count(),
                prisma.fine.count(),
                prisma.camera.count({ where: { status: "ACTIVE" } }),
                prisma.violation.count({ where: { status: "PENDING" } }),
                prisma.violation.count({ where: { status: "RESOLVED" } }),
            ]);
            // Calculate total revenue from fines
            const revenueResult = await prisma.fine.aggregate({
                _sum: { amount: true },
                where: { status: "PAID" },
            });
            const totalRevenue = revenueResult._sum.amount || 0;
            // Get citizen gems total
            const citizenGemsResult = await prisma.citizenGem.aggregate({
                _sum: { amount: true },
            });
            const totalCitizenGems = citizenGemsResult._sum.amount || 0;
            // Get restricted citizens count (citizens with driving restrictions)
            const restrictedCitizens = await prisma.citizenGem.count({
                where: {
                    isRestricted: true,
                },
            });
            const stats = {
                totalUsers,
                totalVehicles,
                totalViolations,
                totalIncidents,
                totalComplaints,
                totalFines,
                totalRevenue,
                activeCameras,
                pendingReports,
                resolvedReports,
                citizenGems: totalCitizenGems,
                restrictedCitizens,
                pendingAppeals: 0, // TODO: Implement appeals system
                systemUptime: 99.9, // Mock data
            };
            res.json({
                success: true,
                message: "Dashboard stats retrieved successfully",
                data: stats,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Dashboard stats error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get violation data over time
     */
    static async getViolationData(req, res) {
        try {
            // Mock data for now - in real implementation, this would aggregate violations by time
            const violationData = [
                { time: "00:00", violations: 12, incidents: 2, complaints: 5 },
                { time: "04:00", violations: 8, incidents: 1, complaints: 3 },
                { time: "08:00", violations: 25, incidents: 4, complaints: 8 },
                { time: "12:00", violations: 35, incidents: 6, complaints: 12 },
                { time: "16:00", violations: 42, incidents: 8, complaints: 15 },
                { time: "20:00", violations: 28, incidents: 3, complaints: 9 },
            ];
            res.json({
                success: true,
                message: "Violation data retrieved successfully",
                data: violationData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Violation data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get revenue data over time
     */
    static async getRevenueData(req, res) {
        try {
            // Mock data for now
            const revenueData = [
                { month: "Jan", revenue: 45000, fines: 150 },
                { month: "Feb", revenue: 52000, fines: 173 },
                { month: "Mar", revenue: 48000, fines: 160 },
                { month: "Apr", revenue: 61000, fines: 203 },
                { month: "May", revenue: 55000, fines: 183 },
                { month: "Jun", revenue: 67000, fines: 223 },
            ];
            res.json({
                success: true,
                message: "Revenue data retrieved successfully",
                data: revenueData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Revenue data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get road congestion data
     */
    static async getRoadCongestionData(req, res) {
        try {
            // Mock data for now
            const congestionData = [
                {
                    road: "Dhaka-Chittagong Highway",
                    congestion: 85,
                    status: "High",
                    vehicles: 1250,
                },
                {
                    road: "Dhanmondi-Gulshan Road",
                    congestion: 65,
                    status: "Medium",
                    vehicles: 890,
                },
                {
                    road: "Airport Road",
                    congestion: 40,
                    status: "Low",
                    vehicles: 450,
                },
                {
                    road: "Mirpur Road",
                    congestion: 75,
                    status: "High",
                    vehicles: 1100,
                },
                {
                    road: "Uttara-Motijheel",
                    congestion: 55,
                    status: "Medium",
                    vehicles: 720,
                },
            ];
            res.json({
                success: true,
                message: "Road congestion data retrieved successfully",
                data: congestionData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Road congestion data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get police station data
     */
    static async getPoliceStationData(req, res) {
        try {
            const stationData = await prisma.policeStation.findMany({
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            users: true, // Officers assigned
                        },
                    },
                },
            });
            // Transform data and add mock case data
            const policeStationData = stationData.map((station) => ({
                station: station.name,
                cases: Math.floor(Math.random() * 50) + 10, // Mock data
                resolved: Math.floor(Math.random() * 40) + 5, // Mock data
            }));
            res.json({
                success: true,
                message: "Police station data retrieved successfully",
                data: policeStationData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Police station data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user submission data
     */
    static async getUserSubmissionData(req, res) {
        try {
            // Mock data for now
            const submissionData = [
                { day: "Mon", traffic: 45, infrastructure: 12 },
                { day: "Tue", traffic: 52, infrastructure: 8 },
                { day: "Wed", traffic: 38, infrastructure: 15 },
                { day: "Thu", traffic: 61, infrastructure: 10 },
                { day: "Fri", traffic: 55, infrastructure: 18 },
                { day: "Sat", traffic: 43, infrastructure: 7 },
                { day: "Sun", traffic: 29, infrastructure: 5 },
            ];
            res.json({
                success: true,
                message: "User submission data retrieved successfully",
                data: submissionData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("User submission data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user role distribution data
     */
    static async getUserRoleData(req, res) {
        try {
            const roleData = await prisma.user.groupBy({
                by: ["role"],
                _count: {
                    id: true,
                },
                where: {
                    isDeleted: false,
                },
            });
            const userRoleData = roleData.map((item) => ({
                role: item.role,
                count: item._count.id,
                percentage: 0, // Will be calculated on frontend
            }));
            res.json({
                success: true,
                message: "User role data retrieved successfully",
                data: userRoleData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("User role data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get violation type data
     */
    static async getViolationTypeData(req, res) {
        try {
            // Mock data for now - in real implementation, would group by violation type
            const violationTypeData = [
                { type: "Speeding", count: 145, percentage: 35 },
                { type: "Wrong Parking", count: 98, percentage: 24 },
                { type: "Signal Violation", count: 76, percentage: 18 },
                { type: "Wrong Lane", count: 52, percentage: 13 },
                { type: "Others", count: 41, percentage: 10 },
            ];
            res.json({
                success: true,
                message: "Violation type data retrieved successfully",
                data: violationTypeData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Violation type data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get case source data
     */
    static async getCaseSourceData(req, res) {
        try {
            // Mock data for now
            const caseSourceData = [
                { source: "Camera Detection", cases: 234, percentage: 45 },
                { source: "Citizen Reports", cases: 156, percentage: 30 },
                { source: "Police Patrol", cases: 89, percentage: 17 },
                { source: "Emergency Calls", cases: 42, percentage: 8 },
            ];
            res.json({
                success: true,
                message: "Case source data retrieved successfully",
                data: caseSourceData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Case source data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get complaint status data
     */
    static async getComplaintStatusData(req, res) {
        try {
            const statusData = await prisma.complaint.groupBy({
                by: ["status"],
                _count: {
                    id: true,
                },
            });
            const complaintStatusData = statusData.map((item) => ({
                status: item.status,
                count: item._count.id,
                percentage: 0, // Will be calculated on frontend
            }));
            res.json({
                success: true,
                message: "Complaint status data retrieved successfully",
                data: complaintStatusData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Complaint status data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get fine status data
     */
    static async getFineStatusData(req, res) {
        try {
            const statusData = await prisma.fine.groupBy({
                by: ["status"],
                _count: {
                    id: true,
                },
            });
            const fineStatusData = statusData.map((item) => ({
                status: item.status,
                count: item._count.id,
                percentage: 0, // Will be calculated on frontend
            }));
            res.json({
                success: true,
                message: "Fine status data retrieved successfully",
                data: fineStatusData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Fine status data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get emergency response data
     */
    static async getEmergencyResponseData(req, res) {
        try {
            // Mock data for now
            const emergencyData = [
                { type: "Accident", count: 45, avgResponseTime: 8.5 },
                { type: "Fire", count: 23, avgResponseTime: 6.2 },
                { type: "Medical", count: 67, avgResponseTime: 7.8 },
                { type: "Traffic Jam", count: 89, avgResponseTime: 15.3 },
            ];
            res.json({
                success: true,
                message: "Emergency response data retrieved successfully",
                data: emergencyData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Emergency response data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get top citizens data
     */
    static async getTopCitizensData(req, res) {
        try {
            // Get citizens with most reports (mock scoring for now)
            const topCitizens = await prisma.user.findMany({
                where: {
                    role: "CITIZEN",
                    isDeleted: false,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    _count: {
                        select: {
                            complaints: true,
                        },
                    },
                },
                orderBy: {
                    complaints: {
                        _count: "desc",
                    },
                },
                take: 10,
            });
            const topCitizensData = topCitizens.map((citizen, index) => ({
                name: `${citizen.firstName} ${citizen.lastName}`,
                reports: citizen._count.complaints,
                score: Math.floor(Math.random() * 500) + 100, // Mock score
                rank: index + 1,
            }));
            res.json({
                success: true,
                message: "Top citizens data retrieved successfully",
                data: topCitizensData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Top citizens data error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
