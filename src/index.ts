import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { config } from "./config/env";
import { SeedService } from "./services/seed.service";

// Import middleware
import {
  corsMiddleware,
  securityMiddleware,
  requestLogger,
  requestSizeLimiter,
  responseTimeHeader,
} from "./middlewares/security.middleware";
import { rateLimiter } from "./middlewares/rateLimit.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";

const app = express();
const prisma = new PrismaClient();
const PORT = config.port;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Security middleware (must be first)
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(responseTimeHeader);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request size limiting
app.use(requestSizeLimiter);

// Request logging (in development)
if (config.nodeEnv === "development") {
  app.use(requestLogger);
}

// Rate limiting for all routes
app.use(rateLimiter);

// Health check route
app.get("/health", (req: Request, res: Response) => {
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

// Test route to check if server is running (legacy)
app.get("/", (req: Request, res: Response) => {
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
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

app.listen(PORT, async () => {
  console.log(`🚀 Nirapoth Backend Server is running!`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);

  // Run database initialization and seeding
  console.log("\n" + "=".repeat(50));
  await SeedService.runStartupSeeding();
  console.log("=".repeat(50) + "\n");
});
