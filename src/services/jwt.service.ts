import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";
import { JWTPayload } from "../types/auth";
import { UserRole } from "@prisma/client";

/**
 * JWT Service for handling token generation and verification
 */
export class JWTService {
  /**
   * Generate access token
   * @param payload - JWT payload containing user information
   * @returns Access token string
   */
  static generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    try {
      const options = {
        expiresIn: config.jwt.expiresIn,
        issuer: "nirapoth-backend",
        audience: "nirapoth-client",
      } as SignOptions;
      return jwt.sign(payload, config.jwt.secret, options);
    } catch (error) {
      throw new Error("Failed to generate access token");
    }
  }

  /**
   * Generate refresh token
   * @param payload - JWT payload containing user information
   * @returns Refresh token string
   */
  static generateRefreshToken(
    payload: Omit<JWTPayload, "iat" | "exp">
  ): string {
    try {
      const options = {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: "nirapoth-backend",
        audience: "nirapoth-client",
      } as SignOptions;
      return jwt.sign(payload, config.jwt.refreshSecret, options);
    } catch (error) {
      throw new Error("Failed to generate refresh token");
    }
  }

  /**
   * Verify access token
   * @param token - Access token to verify
   * @returns Decoded JWT payload
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: "nirapoth-backend",
        audience: "nirapoth-client",
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token");
      } else {
        throw new Error("Failed to verify access token");
      }
    }
  }

  /**
   * Verify refresh token
   * @param token - Refresh token to verify
   * @returns Decoded JWT payload
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: "nirapoth-backend",
        audience: "nirapoth-client",
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      } else {
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
  static generateTokens(
    userId: string,
    email: string,
    role: UserRole
  ): { accessToken: string; refreshToken: string } {
    const payload: Omit<JWTPayload, "iat" | "exp"> = {
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
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param token - Token to check
   * @returns True if token is expired, false otherwise
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}
