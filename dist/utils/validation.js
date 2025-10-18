"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTokenSchema = exports.emailVerificationSchema = exports.updateProfileSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// User registration validation schema
exports.registerSchema = zod_1.z
    .object({
    firstName: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: zod_1.z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: zod_1.z
        .string()
        .email("Please provide a valid email address")
        .max(100, "Email must not exceed 100 characters"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must not exceed 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    phone: zod_1.z
        .string()
        .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
        .min(10, "Phone number must be at least 10 characters")
        .max(20, "Phone number must not exceed 20 characters"),
    nidNo: zod_1.z
        .string()
        .regex(/^\d{10}$|^\d{17}$/, "NID must be either 10 or 17 digits")
        .optional()
        .or(zod_1.z.literal("")), // Allow empty string from frontend
    birthCertificateNo: zod_1.z
        .string()
        .regex(/^\d{17}$/, "Birth Certificate Number must be 17 digits")
        .optional()
        .or(zod_1.z.literal("")), // Allow empty string from frontend
    role: zod_1.z.nativeEnum(client_1.UserRole).optional().default(client_1.UserRole.CITIZEN),
})
    .strip() // Strip unknown fields like confirmPassword from frontend
    .refine((data) => {
    // Check if at least one valid ID is provided
    const nidValid = data.nidNo && /^\d{10}$|^\d{17}$/.test(data.nidNo);
    const bcnValid = data.birthCertificateNo && /^\d{17}$/.test(data.birthCertificateNo);
    return nidValid || bcnValid;
}, {
    message: "Either a valid NID (10 or 17 digits) or Birth Certificate Number (17 digits) is required",
    path: ["nidNo"],
});
// User login validation schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Please provide a valid email address")
        .max(100, "Email must not exceed 100 characters"),
    password: zod_1.z
        .string()
        .min(1, "Password is required")
        .max(128, "Password must not exceed 128 characters"),
});
// Password reset request validation schema
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Please provide a valid email address")
        .max(100, "Email must not exceed 100 characters"),
});
// Password reset validation schema
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must not exceed 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});
// Change password validation schema
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z
        .string()
        .min(8, "New password must be at least 8 characters long")
        .max(128, "New password must not exceed 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});
// Update user profile validation schema
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
        .optional(),
    phone: zod_1.z
        .string()
        .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
        .min(10, "Phone number must be at least 10 characters")
        .max(20, "Phone number must not exceed 20 characters")
        .optional(),
    dateOfBirth: zod_1.z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    bloodGroup: zod_1.z.string().optional(),
    // Contact Information
    alternatePhone: zod_1.z
        .string()
        .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
        .min(10, "Phone number must be at least 10 characters")
        .max(20, "Phone number must not exceed 20 characters")
        .or(zod_1.z.literal(""))
        .optional(),
    emergencyContact: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z
        .string()
        .regex(/^[0-9+\-\s()]+$/, "Please provide a valid phone number")
        .min(10, "Phone number must be at least 10 characters")
        .max(20, "Phone number must not exceed 20 characters")
        .or(zod_1.z.literal(""))
        .optional(),
    // Present Address
    presentAddress: zod_1.z.string().optional(),
    presentCity: zod_1.z.string().optional(),
    presentDistrict: zod_1.z.string().optional(),
    presentDivision: zod_1.z.string().optional(),
    presentUpazila: zod_1.z.string().optional(),
    presentPostalCode: zod_1.z.string().optional(),
    // Permanent Address
    permanentAddress: zod_1.z.string().optional(),
    permanentCity: zod_1.z.string().optional(),
    permanentDistrict: zod_1.z.string().optional(),
    permanentDivision: zod_1.z.string().optional(),
    permanentUpazila: zod_1.z.string().optional(),
    permanentPostalCode: zod_1.z.string().optional(),
    // Professional Information (for police/fire service)
    designation: zod_1.z.string().optional(),
    badgeNo: zod_1.z.string().optional(),
    joiningDate: zod_1.z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    rank: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
    // Additional Info
    bio: zod_1.z.string().optional(),
    nidNo: zod_1.z
        .string()
        .regex(/^\d{10}$|^\d{17}$/, "NID must be either 10 or 17 digits")
        .optional(),
    birthCertificateNo: zod_1.z
        .string()
        .regex(/^\d{17}$/, "Birth Certificate Number must be 17 digits")
        .optional(),
    profileImage: zod_1.z.string().url("Profile image must be a valid URL").optional(),
});
// Email verification validation schema
exports.emailVerificationSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Verification token is required"),
});
// Password reset token validation schema
exports.passwordResetTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
});
