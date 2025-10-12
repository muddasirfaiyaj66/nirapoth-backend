import crypto from "crypto";

/**
 * Token Service for generating and validating various types of tokens
 */
export class TokenService {
  /**
   * Generate a random token
   * @param length - Length of the token (default: 32)
   * @returns Random token string
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate email verification token
   * @returns Email verification token
   */
  static generateEmailVerificationToken(): string {
    return this.generateToken(32);
  }

  /**
   * Generate password reset token
   * @returns Password reset token
   */
  static generatePasswordResetToken(): string {
    return this.generateToken(32);
  }

  /**
   * Hash a token for storage
   * @param token - Token to hash
   * @returns Hashed token
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Verify a token against its hash
   * @param token - Token to verify
   * @param hash - Stored hash
   * @returns True if token matches hash
   */
  static verifyToken(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
  }

  /**
   * Check if token is expired
   * @param expiresAt - Expiration date
   * @returns True if token is expired
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Get expiration date for email verification token (24 hours)
   * @returns Expiration date
   */
  static getEmailVerificationExpiration(): Date {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now;
  }

  /**
   * Get expiration date for password reset token (1 hour)
   * @returns Expiration date
   */
  static getPasswordResetExpiration(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now;
  }
}
