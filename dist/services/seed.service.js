import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { config } from "../config/env";
const prisma = new PrismaClient();
/**
 * Seed service to initialize default data
 */
export class SeedService {
    /**
     * Creates the super admin user if it doesn't exist
     */
    static async createSuperAdmin() {
        try {
            const { email, password, firstName, lastName, phone } = config.superAdmin;
            // Check if super admin already exists
            const existingSuperAdmin = await prisma.user.findUnique({
                where: { email },
            });
            if (existingSuperAdmin) {
                console.log("✅ Super admin already exists:", email);
                return;
            }
            // Hash the password
            const hashedPassword = await hashPassword(password);
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
     * Checks database connection and runs initialization
     */
    static async runStartupSeeding() {
        try {
            console.log("🔄 Checking database connection...");
            // Test database connection
            await prisma.$connect();
            console.log("✅ Database connection established");
            // Run initialization
            await this.initializeDatabase();
        }
        catch (error) {
            console.error("❌ Startup seeding failed:", error);
            console.error("🚨 Server will continue but some features may not work properly");
            // Don't crash the server, just log the error
            // The server should still start even if seeding fails
        }
    }
}
