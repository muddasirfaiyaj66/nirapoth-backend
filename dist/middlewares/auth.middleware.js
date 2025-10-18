"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.fireServiceOrAdmin = exports.policeOrAdmin = exports.adminOnly = exports.authorizeRoles = exports.optionalAuth = exports.authenticateToken = void 0;
const jwt_service_1 = require("../services/jwt.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookies
        let token;
        // Check Authorization header first (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        // If no token in header, check cookies
        if (!token && req.cookies) {
            token = req.cookies.accessToken;
        }
        // Debug logging - always log in development to diagnose issue
        if (process.env.NODE_ENV === "development") {
            console.log("🔍 Auth Debug:", {
                path: req.path,
                method: req.method,
                hasAuthHeader: !!authHeader,
                authHeaderValue: authHeader
                    ? authHeader.substring(0, 20) + "..."
                    : "none",
                hasCookies: !!req.cookies,
                cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
                accessTokenPresent: req.cookies?.accessToken ? "YES" : "NO",
                refreshTokenPresent: req.cookies?.refreshToken ? "YES" : "NO",
                tokenFound: !!token,
            });
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Access token is required",
                statusCode: 401,
            });
            return;
        }
        // Verify the token
        let decoded;
        try {
            decoded = jwt_service_1.JWTService.verifyAccessToken(token);
            if (process.env.NODE_ENV === "development") {
                console.log("🔍 Token verified successfully for userId:", decoded.userId);
            }
        }
        catch (error) {
            if (process.env.NODE_ENV === "development") {
                console.log("🔍 Token verification failed:", error.message);
            }
            res.status(401).json({
                success: false,
                message: "Unauthorized",
                statusCode: 401,
            });
            return;
        }
        // Fetch user from database to ensure they still exist
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                stationId: true,
                nidNo: true,
                birthCertificateNo: true,
                profileImage: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (process.env.NODE_ENV === "development") {
            console.log("🔍 User lookup result:", user ? "FOUND" : "NOT FOUND");
        }
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found or token is invalid",
                statusCode: 401,
            });
            return;
        }
        // Attach user information to request object
        req.user = {
            ...user,
            userId: user.id, // Add userId alias for backward compatibility
        };
        req.userId = user.id;
        req.userRole = user.role;
        if (process.env.NODE_ENV === "development") {
            console.log("🔍 Auth successful, calling next()");
        }
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Authentication failed";
        if (process.env.NODE_ENV === "development") {
            console.log("🔍 Auth middleware error:", {
                error: message,
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
        res.status(401).json({
            success: false,
            message,
            statusCode: 401,
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Optional authentication middleware - doesn't fail if no token is provided
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookies
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        if (!token && req.cookies) {
            token = req.cookies.accessToken;
        }
        if (token) {
            // Try to verify the token
            const decoded = jwt_service_1.JWTService.verifyAccessToken(token);
            // Fetch user from database
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    stationId: true,
                    nidNo: true,
                    birthCertificateNo: true,
                    profileImage: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true,
                    isBlocked: true,
                },
            });
            if (user) {
                req.user = user;
                req.userId = user.id;
                req.userRole = user.role;
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                statusCode: 401,
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Insufficient permissions",
                statusCode: 403,
            });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Admin only middleware
 */
exports.adminOnly = (0, exports.authorizeRoles)(["ADMIN"]);
/**
 * Police or Admin middleware
 */
exports.policeOrAdmin = (0, exports.authorizeRoles)(["ADMIN", "POLICE"]);
/**
 * Fire Service or Admin middleware
 */
exports.fireServiceOrAdmin = (0, exports.authorizeRoles)(["ADMIN", "FIRE_SERVICE"]);
/**
 * Alias for authenticateToken for backward compatibility
 */
exports.authenticate = exports.authenticateToken;
