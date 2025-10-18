"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const env_1 = require("../config/env");
const bdGeo_service_1 = require("./bdGeo.service");
const prisma = new client_1.PrismaClient();
// Track if seeding has been attempted in this instance
let seedingAttempted = false;
let seedingPromise = null;
/**
 * Seed service to initialize default data
 */
class SeedService {
    /**
     * Creates the super admin user if it doesn't exist
     */
    static async createSuperAdmin() {
        try {
            const { email, password, firstName, lastName, phone } = env_1.config.superAdmin;
            // Check if super admin already exists
            const existingSuperAdmin = await prisma.user.findUnique({
                where: { email },
            });
            if (existingSuperAdmin) {
                console.log("✅ Super admin already exists:", email);
                return;
            }
            // Hash the password
            const hashedPassword = await (0, password_1.hashPassword)(password);
            // Create super admin user
            const superAdmin = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    password: hashedPassword,
                    role: "SUPER_ADMIN",
                    designation: "System Administrator",
                    isEmailVerified: true, // Super admin should be pre-verified
                    isDeleted: false,
                    isBlocked: false,
                },
            });
            console.log("🎉 Super admin created successfully!");
            console.log(`📧 Email: ${superAdmin.email}`);
            console.log(`👤 Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
            console.log(`📱 Phone: ${superAdmin.phone}`);
            console.log(`🔑 Role: ${superAdmin.role}`);
            console.log(`🆔 ID: ${superAdmin.id}`);
        }
        catch (error) {
            console.error("❌ Error creating super admin:", error);
            throw error;
        }
    }
    /**
     * Seeds default police organizational hierarchy
     */
    static async seedPoliceHierarchy() {
        try {
            const hierarchyCount = await prisma.policeOrganization.count();
            if (hierarchyCount > 0) {
                console.log("✅ Police hierarchy already exists");
                return;
            }
            // Create Bangladesh Police Headquarters
            const headquarters = await prisma.policeOrganization.create({
                data: {
                    name: "Bangladesh Police",
                    code: "BP",
                    level: "HEADQUARTERS",
                    description: "National Police Headquarters",
                },
            });
            // Create Metropolitan Police units
            const dmp = await prisma.policeOrganization.create({
                data: {
                    name: "Dhaka Metropolitan Police",
                    code: "DMP",
                    level: "RANGE",
                    parentId: headquarters.id,
                    description: "Metropolitan Police for Dhaka City",
                },
            });
            const cmp = await prisma.policeOrganization.create({
                data: {
                    name: "Chattogram Metropolitan Police",
                    code: "CMP",
                    level: "RANGE",
                    parentId: headquarters.id,
                    description: "Metropolitan Police for Chattogram City",
                },
            });
            // Create sample districts under DMP
            const ramnaDiv = await prisma.policeOrganization.create({
                data: {
                    name: "Ramna Division",
                    code: "DMP-RAM-DIV",
                    level: "DISTRICT",
                    parentId: dmp.id,
                    description: "Ramna Police Division",
                },
            });
            const wariDiv = await prisma.policeOrganization.create({
                data: {
                    name: "Wari Division",
                    code: "DMP-WARI-DIV",
                    level: "DISTRICT",
                    parentId: dmp.id,
                    description: "Wari Police Division",
                },
            });
            console.log(`🎉 Created police organizational hierarchy with ${await prisma.policeOrganization.count()} units`);
            console.log(`📋 Structure: Bangladesh Police → Metropolitan Units → Divisions`);
        }
        catch (error) {
            console.error("❌ Error seeding police hierarchy:", error);
            throw error;
        }
    }
    /**
     * Seeds default system rules if they don't exist
     */
    static async seedDefaultRules() {
        try {
            const rulesCount = await prisma.rule.count();
            if (rulesCount > 0) {
                console.log("✅ Default rules already exist");
                return;
            }
            const defaultRules = [
                {
                    code: "SPEED_001",
                    title: "Speed Limit Violation",
                    description: "Exceeding the posted speed limit",
                    penalty: 5000,
                    isActive: true,
                },
                {
                    code: "SIGNAL_001",
                    title: "Traffic Signal Violation",
                    description: "Running a red light or ignoring traffic signals",
                    penalty: 3000,
                    isActive: true,
                },
                {
                    code: "PARKING_001",
                    title: "Illegal Parking",
                    description: "Parking in prohibited areas or blocking traffic",
                    penalty: 2000,
                    isActive: true,
                },
                {
                    code: "LICENSE_001",
                    title: "Driving Without License",
                    description: "Operating a vehicle without a valid driving license",
                    penalty: 10000,
                    isActive: true,
                },
                {
                    code: "HELMET_001",
                    title: "No Helmet Violation",
                    description: "Motorcycle riders not wearing helmets",
                    penalty: 1000,
                    isActive: true,
                },
            ];
            const createdRules = await prisma.rule.createMany({
                data: defaultRules,
            });
            console.log(`🎉 Created ${createdRules.count} default traffic rules`);
        }
        catch (error) {
            console.error("❌ Error seeding default rules:", error);
            throw error;
        }
    }
    /**
     * Initializes all default data
     */
    static async initializeDatabase() {
        console.log("🌱 Starting database initialization...");
        try {
            // Create super admin
            await this.createSuperAdmin();
            // Seed police organizational hierarchy
            await this.seedPoliceHierarchy();
            // Seed default rules
            await this.seedDefaultRules();
            // Populate Bangladesh geographical data (divisions, districts, upazilas)
            await this.populateBDGeoData();
            console.log("✅ Database initialization completed successfully!");
        }
        catch (error) {
            console.error("❌ Database initialization failed:", error);
            throw error;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    /**
     * Populate Bangladesh geographical data
     */
    static async populateBDGeoData() {
        try {
            // Check if data already exists
            const divisionCount = await prisma.division.count();
            if (divisionCount > 0) {
                console.log("✅ Bangladesh geographical data already exists");
                return;
            }
            console.log("🗺️  Populating Bangladesh geographical data...");
            await (0, bdGeo_service_1.populateAllBDGeoData)();
            console.log("✅ Bangladesh geographical data populated successfully");
        }
        catch (error) {
            console.error("❌ Error populating BD geo data:", error);
            throw error;
        }
    }
    /**
     * Checks database connection and runs initialization
     * This version is optimized for serverless environments (Vercel)
     * It ensures seeding only runs once per function instance
     */
    static async runStartupSeeding() {
        // If seeding is already in progress, wait for it
        if (seedingPromise) {
            return seedingPromise;
        }
        // If seeding was already attempted in this instance, skip
        if (seedingAttempted) {
            return;
        }
        // Create a promise to track seeding
        seedingPromise = (async () => {
            try {
                seedingAttempted = true;
                console.log("🔄 Checking database connection...");
                // Test database connection
                await prisma.$connect();
                console.log("✅ Database connection established");
                // Run initialization without disconnecting
                console.log("🌱 Starting database initialization...");
                try {
                    // Create super admin
                    await this.createSuperAdmin();
                    // Seed police organizational hierarchy
                    await this.seedPoliceHierarchy();
                    // Seed default rules
                    await this.seedDefaultRules();
                    // Populate Bangladesh geographical data (divisions, districts, upazilas)
                    await this.populateBDGeoData();
                    console.log("✅ Database initialization completed successfully!");
                }
                catch (error) {
                    console.error("❌ Database initialization failed:", error);
                    // Don't throw - allow server to continue
                }
                // NOTE: We do NOT disconnect Prisma here because the server needs to continue using it
            }
            catch (error) {
                console.error("❌ Startup seeding failed:", error);
                console.error("🚨 Server will continue but some features may not work properly");
                // Don't crash the server, just log the error
                // The server should still start even if seeding fails
            }
            finally {
                seedingPromise = null;
            }
        })();
        return seedingPromise;
    }
    /**
     * Lightweight check to ensure critical data exists
     * Used for serverless cold starts to minimize latency
     */
    static async ensureCriticalDataExists() {
        try {
            // Only check for superadmin existence - fastest check
            const superAdminCount = await prisma.user.count({
                where: { role: "SUPER_ADMIN" },
            });
            if (superAdminCount === 0) {
                console.log("⚠️  No superadmin found, running full seeding...");
                await this.runStartupSeeding();
            }
        }
        catch (error) {
            console.error("❌ Critical data check failed:", error);
            // Don't crash, let the request proceed
        }
    }
}
exports.SeedService = SeedService;
