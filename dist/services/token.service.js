"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Token Service for generating and validating various types of tokens
 */
class TokenService {
    /**
     * Generate a random token
     * @param length - Length of the token (default: 32)
     * @returns Random token string
     */
    static generateToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString("hex");
    }
    /**
     * Generate email verification token
     * @returns Email verification token
     */
    static generateEmailVerificationToken() {
        return this.generateToken(32);
    }
    /**
     * Generate password reset token
     * @returns Password reset token
     */
    static generatePasswordResetToken() {
        return this.generateToken(32);
    }
    /**
     * Hash a token for storage
     * @param token - Token to hash
     * @returns Hashed token
     */
    static hashToken(token) {
        return crypto_1.default.createHash("sha256").update(token).digest("hex");
    }
    /**
     * Verify a token against its hash
     * @param token - Token to verify
     * @param hash - Stored hash
     * @returns True if token matches hash
     */
    static verifyToken(token, hash) {
        const tokenHash = this.hashToken(token);
        return crypto_1.default.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
    }
    /**
     * Check if token is expired
     * @param expiresAt - Expiration date
     * @returns True if token is expired
     */
    static isTokenExpired(expiresAt) {
        return new Date() > expiresAt;
    }
    /**
     * Get expiration date for email verification token (24 hours)
     * @returns Expiration date
     */
    static getEmailVerificationExpiration() {
        const now = new Date();
        now.setHours(now.getHours() + 24);
        return now;
    }
    /**
     * Get expiration date for password reset token (1 hour)
     * @returns Expiration date
     */
    static getPasswordResetExpiration() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 60);
        return now;
    }
}
exports.TokenService = TokenService;
