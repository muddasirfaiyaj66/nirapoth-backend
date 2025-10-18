"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageTargetUser = exports.adminOnly = exports.canAssignRole = exports.canManageUser = exports.responseTimeHeader = exports.requestSizeLimiter = exports.requestLogger = exports.securityMiddleware = exports.helmetOptions = exports.corsMiddleware = exports.corsOptions = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../config/env");
/**
 * CORS configuration
 */
exports.corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // Some gateways/browsers send literal "null" as Origin
        if (origin === "null") {
            return callback(null, true);
        }
        const allowedOrigins = [
            env_1.config.cors.origin,
            process.env.FRONTEND_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:5173", // Vite default
            "http://localhost:4173", // Vite preview
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            // SSLCommerz callback origins
            "https://sandbox.sslcommerz.com",
            "https://securepay.sslcommerz.com",
            // Vercel preview deployments
            "https://nirapoth.vercel.app",
            "https://nirapoth-web.vercel.app",
        ].filter(Boolean);
        // Allow exact matches, Vercel preview URLs, or SSLCommerz origins
        if (allowedOrigins.includes(origin) ||
            origin.includes("sslcommerz.com") ||
            (origin.includes("nirapoth") && origin.includes("vercel.app"))) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "Pragma",
        "X-Auth-Token",
    ],
    exposedHeaders: [
        "Authorization",
        "X-Auth-Token",
        "X-Response-Time",
        "Set-Cookie",
    ],
};
/**
 * CORS middleware
 */
exports.corsMiddleware = (0, cors_1.default)(exports.corsOptions);
/**
 * Helmet configuration for security headers
 */
exports.helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
};
/**
 * Security middleware using Helmet
 */
exports.securityMiddleware = (0, helmet_1.default)(exports.helmetOptions);
/**
 * Request logging middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            timestamp: new Date().toISOString(),
        };
        console.log("Request:", logData);
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Request size limiter middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const requestSizeLimiter = (req, res, next) => {
    const contentLength = parseInt(req.get("content-length") || "0", 10);
    // Increased to 150MB to handle base64-encoded files (temporary until Cloudinary is set up)
    // Base64 encoding increases file size by ~33% (100MB video → ~133MB)
    const maxSize = 150 * 1024 * 1024; // 150MB
    if (contentLength > maxSize) {
        res.status(413).json({
            success: false,
            message: "Request entity too large",
            statusCode: 413,
        });
        return;
    }
    next();
};
exports.requestSizeLimiter = requestSizeLimiter;
/**
 * Response time header middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const responseTimeHeader = (req, res, next) => {
    const start = Date.now();
    // Override the end method to set header before sending response
    const originalEnd = res.end.bind(res);
    res.end = function (chunk, encoding, cb) {
        const duration = Date.now() - start;
        res.setHeader("X-Response-Time", `${duration}ms`);
        return originalEnd(chunk, encoding, cb);
    };
    next();
};
exports.responseTimeHeader = responseTimeHeader;
// Define role hierarchy (higher number = higher privilege)
const ROLE_HIERARCHY = {
    SUPER_ADMIN: 100,
    ADMIN: 80,
    POLICE: 60,
    FIRE_SERVICE: 50,
    CITIZEN: 20,
};
/**
 * Check if a user can manage another user based on role hierarchy
 */
const canManageUser = (managerRole, targetRole) => {
    const managerLevel = ROLE_HIERARCHY[managerRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];
    // Only SUPER_ADMIN can manage other SUPER_ADMINs
    if (targetRole === "SUPER_ADMIN") {
        return managerRole === "SUPER_ADMIN";
    }
    return managerLevel >= targetLevel;
};
exports.canManageUser = canManageUser;
/**
 * Check if a user can assign a specific role to another user
 */
const canAssignRole = (managerRole, roleToAssign) => {
    const managerLevel = ROLE_HIERARCHY[managerRole];
    const roleLevel = ROLE_HIERARCHY[roleToAssign];
    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (roleToAssign === "SUPER_ADMIN") {
        return managerRole === "SUPER_ADMIN";
    }
    // Manager can assign roles at their level or below
    return managerLevel > roleLevel;
};
exports.canAssignRole = canAssignRole;
/**
 * Admin-only access middleware
 * Ensures only users with ADMIN or SUPER_ADMIN role can access the route
 */
const adminOnly = (req, res, next) => {
    const userRole = req.userRole;
    if (!userRole) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
            statusCode: 401,
        });
        return;
    }
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        res.status(403).json({
            success: false,
            message: "Admin access required",
            statusCode: 403,
        });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
/**
 * Middleware to check if user can manage target user
 * Used for user management operations (block, delete, update)
 */
const canManageTargetUser = (req, res, next) => {
    const userRole = req.userRole;
    const targetUserRole = req.body.targetRole || req.params.targetRole;
    if (!userRole) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
            statusCode: 401,
        });
        return;
    }
    if (!targetUserRole) {
        res.status(400).json({
            success: false,
            message: "Target user role not specified",
            statusCode: 400,
        });
        return;
    }
    if (!(0, exports.canManageUser)(userRole, targetUserRole)) {
        res.status(403).json({
            success: false,
            message: "You don't have permission to manage this user",
            statusCode: 403,
        });
        return;
    }
    next();
};
exports.canManageTargetUser = canManageTargetUser;
