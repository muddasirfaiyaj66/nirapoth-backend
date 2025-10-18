import express from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { config } from "./config/env";
import { SeedService } from "./services/seed.service";
import { initializeSocket } from "./config/socket";
// Import middleware
import { corsMiddleware, securityMiddleware, requestLogger, requestSizeLimiter, responseTimeHeader, } from "./middlewares/security.middleware";
import { rateLimiter } from "./middlewares/rateLimit.middleware";
import { errorHandler, notFoundHandler, } from "./middlewares/errorHandler.middleware";
import { updateUserActivity, markInactiveUsersOffline, } from "./middleware/userActivity.middleware";
// Import routes
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
import drivingLicenseRoutes from "./routes/drivingLicense.routes";
// import vehicleAssignmentRoutes from "./routes/vehicleAssignment.routes"; // DEPRECATED: Using driverAssignment instead
import userProfileRoutes from "./routes/userProfile.routes";
import policeManagementRoutes from "./routes/policeManagement.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import { violationRoutes } from "./routes/violation.routes";
import { complaintRoutes } from "./routes/complaint.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { fineRoutes } from "./routes/fine.routes";
import { aiIntegrationRoutes } from "./routes/aiIntegration.routes";
import { citizenRoutes } from "./routes/citizen.routes";
import { policeRoutes } from "./routes/police.routes";
import { fireServiceRoutes } from "./routes/fireService.routes";
import { aiWebhookRoutes } from "./routes/aiWebhook.routes";
import cameraRoutes from "./routes/camera.routes";
import notificationRoutes from "./routes/notification.routes";
import citizenReportsRoutes from "./routes/citizenReports.routes";
import rewardsRoutes from "./routes/rewards.routes";
import bdGeoRoutes from "./routes/bdGeo.routes";
import driverProfileRoutes from "./routes/driverProfile.routes";
import chatRoutes from "./routes/chat.routes";
import officialChatRoutes from "./routes/officialChat.routes";
import driverAssignmentRoutes from "./routes/driverAssignment.routes";
export const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = config.port;
// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);
// Security middleware (must be first)
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(responseTimeHeader);
// Body parsing middleware
// Increased limit to 150mb to handle base64-encoded files (temporary until Cloudinary is set up)
// Base64 encoding increases file size by ~33% (100MB video → ~133MB)
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));
app.use(cookieParser());
// Request size limiting
app.use(requestSizeLimiter);
// Request logging (in development)
if (config.nodeEnv === "development") {
    app.use(requestLogger);
}
// Rate limiting for all routes
app.use(rateLimiter);
// User activity tracking (updates online status)
app.use(updateUserActivity);
// Health check route
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Nirapoth Backend is running!",
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        statusCode: 200,
    });
});
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
// Enhanced User System Routes
app.use("/api/driving-licenses", drivingLicenseRoutes);
// app.use("/api/vehicle-assignment", vehicleAssignmentRoutes); // DEPRECATED: Using driver-assignments instead
app.use("/api/user-profile", userProfileRoutes);
app.use("/api/police", policeManagementRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/ai", aiIntegrationRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/fire-service", fireServiceRoutes);
app.use("/api/ai-webhook", aiWebhookRoutes); // AI Detection System
app.use("/api/cameras", cameraRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/citizen-reports", citizenReportsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/bd-geo", bdGeoRoutes);
// Driver Marketplace Routes
app.use("/api/driver-profiles", driverProfileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/official-chat", officialChatRoutes);
app.use("/api/driver-assignments", driverAssignmentRoutes);
// Test route to check if server is running (legacy)
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Nirapoth Backend is running!",
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        statusCode: 200,
    });
});
// 404 handler for undefined routes
app.use(notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler);
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
initializeSocket(httpServer);
// Start cron job to mark inactive users as offline (every 5 minutes)
setInterval(async () => {
    await markInactiveUsersOffline();
}, 5 * 60 * 1000); // 5 minutes
httpServer.listen(PORT, async () => {
    console.log(`🚀 Nirapoth Backend Server is running!`);
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO: Ready for real-time connections`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    console.log(`⚙️  Admin API: http://localhost:${PORT}/api/admin`);
    // Run database initialization and seeding
    console.log("\n" + "=".repeat(50));
    await SeedService.runStartupSeeding();
    console.log("=".repeat(50) + "\n");
});
