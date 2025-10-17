import { z } from "zod";
import { UserRole } from "@prisma/client";

// User registration validation schema
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long")
      .max(50, "First name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),

    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters long")
      .max(50, "Last name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),

    email: z
      .string()
      .email("Please provide a valid email address")
      .max(100, "Email must not exceed 100 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    phone: z
      .string()
      .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
      .min(10, "Phone number must be at least 10 characters")
      .max(20, "Phone number must not exceed 20 characters"),

    nidNo: z
      .string()
      .regex(/^\d{10}$|^\d{17}$/, "NID must be either 10 or 17 digits")
      .optional()
      .or(z.literal("")), // Allow empty string from frontend

    birthCertificateNo: z
      .string()
      .regex(/^\d{17}$/, "Birth Certificate Number must be 17 digits")
      .optional()
      .or(z.literal("")), // Allow empty string from frontend

    role: z.nativeEnum(UserRole).optional().default(UserRole.CITIZEN),
  })
  .strip() // Strip unknown fields like confirmPassword from frontend
  .refine(
    (data) => {
      // Check if at least one valid ID is provided
      const nidValid = data.nidNo && /^\d{10}$|^\d{17}$/.test(data.nidNo);
      const bcnValid =
        data.birthCertificateNo && /^\d{17}$/.test(data.birthCertificateNo);
      return nidValid || bcnValid;
    },
    {
      message:
        "Either a valid NID (10 or 17 digits) or Birth Certificate Number (17 digits) is required",
      path: ["nidNo"],
    }
  );

// User login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .max(100, "Email must not exceed 100 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

// Password reset request validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .max(100, "Email must not exceed 100 characters"),
});

// Password reset validation schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(128, "New password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Update user profile validation schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
    .optional(),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
    .optional(),

  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),

  dateOfBirth: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  bloodGroup: z.string().optional(),

  // Contact Information
  alternatePhone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .or(z.literal(""))
    .optional(),

  emergencyContact: z.string().optional(),

  emergencyContactPhone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .or(z.literal(""))
    .optional(),

  // Present Address
  presentAddress: z.string().optional(),
  presentCity: z.string().optional(),
  presentDistrict: z.string().optional(),
  presentDivision: z.string().optional(),
  presentUpazila: z.string().optional(),
  presentPostalCode: z.string().optional(),

  // Permanent Address
  permanentAddress: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentDistrict: z.string().optional(),
  permanentDivision: z.string().optional(),
  permanentUpazila: z.string().optional(),
  permanentPostalCode: z.string().optional(),

  // Professional Information (for police/fire service)
  designation: z.string().optional(),
  badgeNo: z.string().optional(),
  joiningDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  rank: z.string().optional(),
  specialization: z.string().optional(),

  // Additional Info
  bio: z.string().optional(),

  nidNo: z
    .string()
    .regex(/^\d{10}$|^\d{17}$/, "NID must be either 10 or 17 digits")
    .optional(),

  birthCertificateNo: z
    .string()
    .regex(/^\d{17}$/, "Birth Certificate Number must be 17 digits")
    .optional(),

  profileImage: z.string().url("Profile image must be a valid URL").optional(),
});

// Email verification validation schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Password reset token validation schema
export const passwordResetTokenSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
});

// Type inference for the schemas
export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type PasswordResetTokenInput = z.infer<typeof passwordResetTokenSchema>;
