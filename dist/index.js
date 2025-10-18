"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const client_1 = require("@prisma/client");
const http_1 = require("http");
const env_1 = require("./config/env");
const seed_service_1 = require("./services/seed.service");
const socket_1 = require("./config/socket");
// Import middleware
const security_middleware_1 = require("./middlewares/security.middleware");
const rateLimit_middleware_1 = require("./middlewares/rateLimit.middleware");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const userActivity_middleware_1 = require("./middleware/userActivity.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const drivingLicense_routes_1 = __importDefault(require("./routes/drivingLicense.routes"));
// import vehicleAssignmentRoutes from "./routes/vehicleAssignment.routes"; // DEPRECATED: Using driverAssignment instead
const userProfile_routes_1 = __importDefault(require("./routes/userProfile.routes"));
const policeManagement_routes_1 = __importDefault(require("./routes/policeManagement.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const violation_routes_1 = require("./routes/violation.routes");
const complaint_routes_1 = require("./routes/complaint.routes");
const payment_routes_1 = require("./routes/payment.routes");
const fine_routes_1 = require("./routes/fine.routes");
const aiIntegration_routes_1 = require("./routes/aiIntegration.routes");
const citizen_routes_1 = require("./routes/citizen.routes");
const police_routes_1 = require("./routes/police.routes");
const fireService_routes_1 = require("./routes/fireService.routes");
const aiWebhook_routes_1 = require("./routes/aiWebhook.routes");
const camera_routes_1 = __importDefault(require("./routes/camera.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const citizenReports_routes_1 = __importDefault(require("./routes/citizenReports.routes"));
const rewards_routes_1 = __importDefault(require("./routes/rewards.routes"));
const bdGeo_routes_1 = __importDefault(require("./routes/bdGeo.routes"));
const driverProfile_routes_1 = __importDefault(require("./routes/driverProfile.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const officialChat_routes_1 = __importDefault(require("./routes/officialChat.routes"));
const driverAssignment_routes_1 = __importDefault(require("./routes/driverAssignment.routes"));
exports.app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(exports.app);
const prisma = new client_1.PrismaClient();
const PORT = env_1.config.port;
// Trust proxy for accurate IP addresses (important for rate limiting)
exports.app.set("trust proxy", 1);
// Security middleware (must be first)
exports.app.use(security_middleware_1.securityMiddleware);
exports.app.use(security_middleware_1.corsMiddleware);
exports.app.use(security_middleware_1.responseTimeHeader);
// Body parsing middleware
// Increased limit to 150mb to handle base64-encoded files (temporary until Cloudinary is set up)
// Base64 encoding increases file size by ~33% (100MB video → ~133MB)
exports.app.use(express_1.default.json({ limit: "150mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "150mb" }));
exports.app.use((0, cookie_parser_1.default)());
// Request size limiting
exports.app.use(security_middleware_1.requestSizeLimiter);
// Request logging (in development)
if (env_1.config.nodeEnv === "development") {
    exports.app.use(security_middleware_1.requestLogger);
}
// Rate limiting for all routes
exports.app.use(rateLimit_middleware_1.rateLimiter);
// User activity tracking (updates online status)
exports.app.use(userActivity_middleware_1.updateUserActivity);
// Health check route
exports.app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Nirapoth Backend is running!",
        timestamp: new Date().toISOString(),
        environment: env_1.config.nodeEnv,
        statusCode: 200,
    });
});
// API routes
exports.app.use("/api/auth", auth_routes_1.default);
exports.app.use("/api/profile", profile_routes_1.default);
exports.app.use("/api/dashboard", dashboard_routes_1.default);
exports.app.use("/api/admin", admin_routes_1.default);
// Enhanced User System Routes
exports.app.use("/api/driving-licenses", drivingLicense_routes_1.default);
// app.use("/api/vehicle-assignment", vehicleAssignmentRoutes); // DEPRECATED: Using driver-assignments instead
exports.app.use("/api/user-profile", userProfile_routes_1.default);
exports.app.use("/api/police", policeManagement_routes_1.default);
exports.app.use("/api/vehicles", vehicle_routes_1.default);
exports.app.use("/api/violations", violation_routes_1.violationRoutes);
exports.app.use("/api/complaints", complaint_routes_1.complaintRoutes);
exports.app.use("/api/payments", payment_routes_1.paymentRoutes);
exports.app.use("/api/fines", fine_routes_1.fineRoutes);
exports.app.use("/api/ai", aiIntegration_routes_1.aiIntegrationRoutes);
exports.app.use("/api/citizen", citizen_routes_1.citizenRoutes);
exports.app.use("/api/police", police_routes_1.policeRoutes);
exports.app.use("/api/fire-service", fireService_routes_1.fireServiceRoutes);
exports.app.use("/api/ai-webhook", aiWebhook_routes_1.aiWebhookRoutes); // AI Detection System
exports.app.use("/api/cameras", camera_routes_1.default);
exports.app.use("/api/notifications", notification_routes_1.default);
exports.app.use("/api/citizen-reports", citizenReports_routes_1.default);
exports.app.use("/api/rewards", rewards_routes_1.default);
exports.app.use("/api/bd-geo", bdGeo_routes_1.default);
// Driver Marketplace Routes
exports.app.use("/api/driver-profiles", driverProfile_routes_1.default);
exports.app.use("/api/chat", chat_routes_1.default);
exports.app.use("/api/official-chat", officialChat_routes_1.default);
exports.app.use("/api/driver-assignments", driverAssignment_routes_1.default);
// Test route to check if server is running (legacy)
exports.app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Nirapoth Backend is running!",
        timestamp: new Date().toISOString(),
        environment: env_1.config.nodeEnv,
        statusCode: 200,
    });
});
// 404 handler for undefined routes
exports.app.use(errorHandler_middleware_1.notFoundHandler);
// Global error handler (must be last)
exports.app.use(errorHandler_middleware_1.errorHandler);
// Gracefully disconnect Prisma when the app shuts down
process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    process.exit(1);
});
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});
// Initialize Socket.IO
// Works on traditional servers (Render, Railway, Heroku, VPS)
// Does NOT work on Vercel serverless
(0, socket_1.initializeSocket)(httpServer);
// Start cron job to mark inactive users as offline (every 5 minutes)
setInterval(async () => {
    await (0, userActivity_middleware_1.markInactiveUsersOffline)();
}, 5 * 60 * 1000); // 5 minutes
// Start HTTP server
httpServer.listen(PORT, async () => {
    console.log(`🚀 Nirapoth Backend Server is running!`);
    console.log(`📍 Environment: ${env_1.config.nodeEnv}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO: Ready for real-time connections`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    console.log(`⚙️  Admin API: http://localhost:${PORT}/api/admin`);
    // Run database initialization and seeding
    if (env_1.config.nodeEnv === "production") {
        console.log("\n" + "=".repeat(50));
        await seed_service_1.SeedService.runStartupSeeding();
        console.log("=".repeat(50) + "\n");
    }
});
// Also export as default for ES modules
exports.default = exports.app;
