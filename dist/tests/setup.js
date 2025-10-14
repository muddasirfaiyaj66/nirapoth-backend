import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
export const setupTestDatabase = async () => {
    // Clean up test data
    await prisma.vehicle.deleteMany({
        where: {
            owner: {
                email: {
                    contains: "test@example.com",
                },
            },
        },
    });
    await prisma.user.deleteMany({
        where: {
            email: {
                contains: "test@example.com",
            },
        },
    });
    // Create test users with different roles
    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUsers = await Promise.all([
        prisma.user.create({
            data: {
                email: "citizen@test.com",
                password: hashedPassword,
                firstName: "Test",
                lastName: "Citizen",
                role: "CITIZEN",
                isActive: true,
                isEmailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "police@test.com",
                password: hashedPassword,
                firstName: "Test",
                lastName: "Police",
                role: "POLICE",
                isActive: true,
                isEmailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "admin@test.com",
                password: hashedPassword,
                firstName: "Test",
                lastName: "Admin",
                role: "ADMIN",
                isActive: true,
                isEmailVerified: true,
            },
        }),
    ]);
    return testUsers;
};
export const cleanupTestDatabase = async () => {
    // Clean up all test data
    await prisma.vehicle.deleteMany({
        where: {
            owner: {
                email: {
                    contains: "test@example.com",
                },
            },
        },
    });
    await prisma.user.deleteMany({
        where: {
            email: {
                contains: "test@example.com",
            },
        },
    });
    await prisma.$disconnect();
};
export const createTestVehicle = async (ownerId) => {
    return await prisma.vehicle.create({
        data: {
            plateNo: `TEST-${Date.now()}`,
            engineNo: `ENG${Date.now()}`,
            chassisNo: `CHS${Date.now()}`,
            brand: "Test Brand",
            model: "Test Model",
            year: 2020,
            type: "CAR",
            ownerId,
        },
    });
};
export const createTestViolation = async (vehicleId, userId) => {
    return await prisma.violation.create({
        data: {
            vehicleId,
            ruleId: "TEST_RULE_001",
            description: "Test violation",
            location: "Test Location",
            fineAmount: 1000,
            status: "PENDING",
            reportedBy: userId,
        },
    });
};
export const createTestComplaint = async (userId) => {
    return await prisma.complaint.create({
        data: {
            type: "TRAFFIC_VIOLATION",
            title: "Test Complaint",
            description: "Test complaint description",
            location: "Test Location",
            priority: "MEDIUM",
            status: "PENDING",
            submittedBy: userId,
        },
    });
};
