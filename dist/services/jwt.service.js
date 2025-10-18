"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * JWT Service for handling token generation and verification
 */
class JWTService {
    /**
     * Generate access token
     * @param payload - JWT payload containing user information
     * @returns Access token string
     */
    static generateAccessToken(payload) {
        try {
            const options = {
                expiresIn: env_1.config.jwt.expiresIn,
                issuer: "nirapoth-backend",
                audience: "nirapoth-client",
            };
            return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, options);
        }
        catch (error) {
            throw new Error("Failed to generate access token");
        }
    }
    /**
     * Generate refresh token
     * @param payload - JWT payload containing user information
     * @returns Refresh token string
     */
    static generateRefreshToken(payload) {
        try {
            const options = {
                expiresIn: env_1.config.jwt.refreshExpiresIn,
                issuer: "nirapoth-backend",
                audience: "nirapoth-client",
            };
            return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.refreshSecret, options);
        }
        catch (error) {
            throw new Error("Failed to generate refresh token");
        }
    }
    /**
     * Verify access token
     * @param token - Access token to verify
     * @returns Decoded JWT payload
     */
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret, {
                issuer: "nirapoth-backend",
                audience: "nirapoth-client",
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Access token has expired");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("Invalid access token");
            }
            else {
                throw new Error("Failed to verify access token");
            }
        }
    }
    /**
     * Verify refresh token
     * @param token - Refresh token to verify
     * @returns Decoded JWT payload
     */
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.config.jwt.refreshSecret, {
                issuer: "nirapoth-backend",
                audience: "nirapoth-client",
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Refresh token has expired");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("Invalid refresh token");
            }
            else {
                throw new Error("Failed to verify refresh token");
            }
        }
    }
    /**
     * Generate both access and refresh tokens
     * @param userId - User ID
     * @param email - User email
     * @param role - User role
     * @returns Object containing both tokens
     */
    static generateTokens(userId, email, role) {
        const payload = {
            userId,
            email,
            role,
        };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return {
            accessToken,
            refreshToken,
        };
    }
    /**
     * Decode token without verification (for debugging purposes)
     * @param token - Token to decode
     * @returns Decoded token payload
     */
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if token is expired
     * @param token - Token to check
     * @returns True if token is expired, false otherwise
     */
    static isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
}
exports.JWTService = JWTService;
