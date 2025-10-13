import { JWTService } from "../services/jwt.service";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
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
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Access token is required",
                statusCode: 401,
            });
            return;
        }
        // Verify the token
        const decoded = JWTService.verifyAccessToken(token);
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
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found or token is invalid",
                statusCode: 401,
            });
            return;
        }
        // Attach user information to request object
        req.user = user; // Type assertion since we're selecting specific fields
        req.userId = user.id;
        req.userRole = user.role;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Authentication failed";
        res.status(401).json({
            success: false,
            message,
            statusCode: 401,
        });
    }
};
/**
 * Optional authentication middleware - doesn't fail if no token is provided
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
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
            const decoded = JWTService.verifyAccessToken(token);
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
/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 */
export const authorizeRoles = (allowedRoles) => {
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
/**
 * Admin only middleware
 */
export const adminOnly = authorizeRoles(["ADMIN"]);
/**
 * Police or Admin middleware
 */
export const policeOrAdmin = authorizeRoles(["ADMIN", "POLICE"]);
/**
 * Driver or Admin middleware
 */
export const driverOrAdmin = authorizeRoles(["ADMIN", "DRIVER"]);
/**
 * Fire Service or Admin middleware
 */
export const fireServiceOrAdmin = authorizeRoles(["ADMIN", "FIRE_SERVICE"]);
