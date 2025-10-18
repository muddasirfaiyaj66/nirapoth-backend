"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
const hashPassword = async (password) => {
    try {
        const saltRounds = 12;
        return await bcrypt_1.default.hash(password, saltRounds);
    }
    catch (error) {
        throw new Error("Failed to hash password");
    }
};
exports.hashPassword = hashPassword;
/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if passwords match, false otherwise
 */
const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt_1.default.compare(password, hashedPassword);
    }
    catch (error) {
        throw new Error("Failed to compare passwords");
    }
};
exports.comparePassword = comparePassword;
/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Password must be at least ${minLength} characters long`,
        };
    }
    if (!hasUpperCase) {
        return {
            isValid: false,
            message: "Password must contain at least one uppercase letter",
        };
    }
    if (!hasLowerCase) {
        return {
            isValid: false,
            message: "Password must contain at least one lowercase letter",
        };
    }
    if (!hasNumbers) {
        return {
            isValid: false,
            message: "Password must contain at least one number",
        };
    }
    if (!hasSpecialChar) {
        return {
            isValid: false,
            message: "Password must contain at least one special character (@$!%*?&)",
        };
    }
    return {
        isValid: true,
        message: "Password is valid",
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
