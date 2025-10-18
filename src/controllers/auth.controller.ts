import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { JWTService } from "../services/jwt.service";
import { EmailService } from "../services/email.service";
import { TokenService } from "../services/token.service";
import { hashPassword, comparePassword } from "../utils/password";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailVerificationSchema,
  RegisterUserInput,
  LoginUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  EmailVerificationInput,
} from "../utils/validation";
import { AuthResponse, SuccessResponse } from "../types/auth";

const prisma = new PrismaClient();

/**
 * User Registration Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData: RegisterUserInput = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
        statusCode: 409,
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Check if in development mode without email config
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasEmailConfig =
      process.env.EMAIL_SEND_USER_EMAIL && process.env.EMAIL_SEND_USER_PASS;
    const autoVerifyInDev = isDevelopment && !hasEmailConfig;

    // Generate email verification token
    const verificationToken = TokenService.generateEmailVerificationToken();
    const hashedToken = TokenService.hashToken(verificationToken);
    const tokenExpires = TokenService.getEmailVerificationExpiration();

    // Create user (always as CITIZEN - role can only be changed by admin)
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        role: "CITIZEN", // Force CITIZEN role for all new registrations
        nidNo:
          validatedData.nidNo && validatedData.nidNo.trim() !== ""
            ? validatedData.nidNo
            : null,
        birthCertificateNo:
          validatedData.birthCertificateNo &&
          validatedData.birthCertificateNo.trim() !== ""
            ? validatedData.birthCertificateNo
            : null,
        emailVerificationToken: autoVerifyInDev ? null : hashedToken,
        emailVerificationExpires: autoVerifyInDev ? null : tokenExpires,
        isEmailVerified: autoVerifyInDev, // Auto-verify in dev mode without email config
      },
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

    // NOTE: CitizenGem is NOT created here
    // It will be created automatically when user adds their driving license

    // Send verification email (skip in dev mode without email config)
    if (!autoVerifyInDev) {
      try {
        const emailService = new EmailService();
        await emailService.sendVerificationEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          verificationToken,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail registration if email fails
      }
    } else {
      console.warn(
        `⚠️  Email verification auto-bypassed for ${user.email} (development mode without email config)`
      );
    }

    const response: SuccessResponse = {
      success: true,
      message: autoVerifyInDev
        ? "User registered successfully. Email verification bypassed in development mode."
        : "User registered successfully. Please check your email for verification link.",
      data: { user },
      statusCode: 201,
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Registration validation error:", error.issues);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * User Login Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData: LoginUserInput = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        password: true,
        role: true,
        designation: true,
        nidNo: true,
        birthCertificateNo: true,
        profileImage: true,
        isEmailVerified: true,
        emailVerificationToken: true,
        emailVerificationExpires: true,
        passwordResetToken: true,
        passwordResetExpires: true,
        isDeleted: true,
        isBlocked: true,
        blockReason: true,
        isActive: true,
        blockedAt: true,
        unblockedAt: true,
        verifiedAt: true,
        blockedBy: true,
        unblockedBy: true,
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
        stationId: true,
        // Additional profile fields
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        alternatePhone: true,
        emergencyContact: true,
        emergencyContactPhone: true,
        presentAddress: true,
        presentCity: true,
        presentDistrict: true,
        presentDivision: true,
        presentUpazila: true,
        presentPostalCode: true,
        permanentAddress: true,
        permanentCity: true,
        permanentDistrict: true,
        permanentDivision: true,
        permanentUpazila: true,
        permanentPostalCode: true,
        drivingLicenseNo: true,
        drivingLicenseIssueDate: true,
        drivingLicenseExpiryDate: true,
        drivingLicenseCategory: true,
        isDrivingLicenseVerified: true,
        badgeNo: true,
        joiningDate: true,
        serviceLength: true,
        rank: true,
        specialization: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      });
      return;
    }

    // Check if user is deleted
    if (user.isDeleted) {
      res.status(403).json({
        success: false,
        message: "Account has been deactivated",
        statusCode: 403,
      });
      return;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: "Account has been blocked. Please contact support",
        statusCode: 403,
      });
      return;
    }

    // Check if email is verified (skip in development if email not configured)
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasEmailConfig =
      process.env.EMAIL_SEND_USER_EMAIL && process.env.EMAIL_SEND_USER_PASS;

    if (!user.isEmailVerified && !(isDevelopment && !hasEmailConfig)) {
      res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in",
        statusCode: 403,
      });
      return;
    }

    // Log bypass warning in development
    if (!user.isEmailVerified && isDevelopment && !hasEmailConfig) {
      console.warn(
        `⚠️  Email verification bypassed for ${user.email} (development mode without email config)`
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens(
      user.id,
      user.email,
      user.role
    );

    // Set HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // Add default values for new fields if they don't exist
    const userResponse = {
      ...userWithoutPassword,
      isOnline: (user as any).isOnline ?? false,
      lastSeenAt: (user as any).lastSeenAt ?? null,
      lastActivityAt: (user as any).lastActivityAt ?? null,
    };

    const response: SuccessResponse<AuthResponse> = {
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * User Logout Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Mark user as offline if authenticated
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          isOnline: false,
          lastSeenAt: new Date(),
        },
      }).catch((err) => {
        console.error("Failed to mark user offline:", err);
        // Don't fail logout if this fails
      });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    const response: SuccessResponse = {
      success: true,
      message: "Logout successful",
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Refresh Token Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token not provided",
        statusCode: 401,
      });
      return;
    }

    // Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        stationId: true,
        nidNo: true,
        birthCertificateNo: true,
        profileImage: true,
        isEmailVerified: true,
        emailVerificationToken: true,
        emailVerificationExpires: true,
        passwordResetToken: true,
        passwordResetExpires: true,
        isDeleted: true,
        isBlocked: true,
        blockReason: true,
        isActive: true,
        blockedAt: true,
        unblockedAt: true,
        verifiedAt: true,
        blockedBy: true,
        unblockedBy: true,
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
        // Additional profile fields
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        alternatePhone: true,
        emergencyContact: true,
        emergencyContactPhone: true,
        presentAddress: true,
        presentCity: true,
        presentDistrict: true,
        presentDivision: true,
        presentUpazila: true,
        presentPostalCode: true,
        permanentAddress: true,
        permanentCity: true,
        permanentDistrict: true,
        permanentDivision: true,
        permanentUpazila: true,
        permanentPostalCode: true,
        drivingLicenseNo: true,
        drivingLicenseIssueDate: true,
        drivingLicenseExpiryDate: true,
        drivingLicenseCategory: true,
        isDrivingLicenseVerified: true,
        badgeNo: true,
        joiningDate: true,
        serviceLength: true,
        rank: true,
        specialization: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
        statusCode: 401,
      });
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      JWTService.generateTokens(user.id, user.email, user.role);

    // Set new cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Add default values for new fields if they don't exist
    const userResponse = {
      ...user,
      isOnline: (user as any).isOnline ?? false,
      lastSeenAt: (user as any).lastSeenAt ?? null,
      lastActivityAt: (user as any).lastActivityAt ?? null,
    };

    const response: SuccessResponse<AuthResponse> = {
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        user: userResponse,
        accessToken,
        refreshToken: newRefreshToken,
      },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      statusCode: 401,
    });
  }
};

/**
 * Get Current User Controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // User is already attached by auth middleware
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const response: SuccessResponse = {
      success: true,
      message: "User retrieved successfully",
      data: { user },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Verify Email Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).json({
        success: false,
        message: "Verification token is required",
        statusCode: 400,
      });
      return;
    }

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: TokenService.hashToken(token),
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
        statusCode: 400,
      });
      return;
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
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

    // Send welcome email
    try {
      const emailService = new EmailService();
      await emailService.sendWelcomeEmail(
        updatedUser.email,
        updatedUser.firstName,
        updatedUser.lastName
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    const response: SuccessResponse = {
      success: true,
      message: "Email verified successfully! Welcome to Nirapoth!",
      data: { user: updatedUser },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Forgot Password Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: ForgotPasswordInput = forgotPasswordSchema.parse(
      req.body
    );

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, we have sent a password reset link.",
        statusCode: 200,
      });
      return;
    }

    // Generate password reset token
    const resetToken = TokenService.generatePasswordResetToken();
    const hashedToken = TokenService.hashToken(resetToken);
    const tokenExpires = TokenService.getPasswordResetExpiration();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: tokenExpires,
        updatedAt: new Date(),
      },
    });

    // Send password reset email
    try {
      const emailService = new EmailService();
      await emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        resetToken,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
        statusCode: 500,
      });
      return;
    }

    const response: SuccessResponse = {
      success: true,
      message:
        "If an account with that email exists, we have sent a password reset link.",
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Reset Password Controller
 * @param req - Express request object
 * @param res - Express response object
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: ResetPasswordInput = resetPasswordSchema.parse(
      req.body
    );

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: TokenService.hashToken(validatedData.token),
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        statusCode: 400,
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password);

    // Update user password and clear reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      },
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

    const response: SuccessResponse = {
      success: true,
      message: "Password reset successfully",
      data: { user: updatedUser },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
