import dotenv from "dotenv";
// Load environment variables
dotenv.config();
export const config = {
    // Server Configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    // Database Configuration
    databaseUrl: process.env.DATABASE_URL ||
        "postgresql://username:password@localhost:5432/nirapoth_db",
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET ||
            "your-super-secret-jwt-key-change-this-in-production",
        refreshSecret: process.env.JWT_REFRESH_SECRET ||
            "your-super-secret-refresh-key-change-this-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    },
    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "600"),
    },
    // Email Configuration
    email: {
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: parseInt(process.env.SMTP_PORT || "587"),
        smtpSecure: process.env.SMTP_SECURE === "true",
        smtpUser: process.env.EMAIL_SEND_USER_EMAIL || process.env.SMTP_USER || "",
        smtpPass: process.env.EMAIL_SEND_USER_PASS || process.env.SMTP_PASS || "",
        fromEmail: process.env.FROM_EMAIL ||
            process.env.EMAIL_SEND_USER_EMAIL ||
            "noreply@nirapoth.com",
        fromName: process.env.FROM_NAME || "Nirapoth",
        baseUrl: process.env.BASE_URL || "http://localhost:3000",
    },
    // Super Admin Configuration
    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL || "muddasirfaiyaj66@gmail.com",
        password: process.env.SUPER_ADMIN_PASSWORD || "admin@#",
        firstName: process.env.SUPER_ADMIN_FIRST_NAME || "Muddasir",
        lastName: process.env.SUPER_ADMIN_LAST_NAME || "Faiyaj",
        phone: process.env.SUPER_ADMIN_PHONE || "01780367604",
    },
};
// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const recommendedEnvVars = [
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "SUPER_ADMIN_FIRST_NAME",
    "SUPER_ADMIN_LAST_NAME",
    "SUPER_ADMIN_PHONE",
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.warn(`Warning: ${envVar} is not set. Using default value.`);
    }
}
for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
        console.info(`Info: ${envVar} is not set. Using default value for super admin.`);
    }
}
export default config;
