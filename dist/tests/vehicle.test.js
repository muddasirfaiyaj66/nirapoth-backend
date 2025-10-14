import request from "supertest";
import { app } from "../index";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
describe("Vehicle API", () => {
    let testUser;
    let authToken;
    let testVehicle;
    beforeAll(async () => {
        // Create a test user
        testUser = await prisma.user.create({
            data: {
                email: "vehicle-test@example.com",
                password: "hashedpassword",
                firstName: "Vehicle",
                lastName: "Test",
                role: "CITIZEN",
                isActive: true,
                isEmailVerified: true,
            },
        });
        // Login to get auth token
        const loginResponse = await request(app).post("/api/auth/login").send({
            email: "vehicle-test@example.com",
            password: "password123",
        });
        authToken = loginResponse.body.data.tokens.accessToken;
    });
    afterAll(async () => {
        // Clean up test data
        if (testVehicle) {
            await prisma.vehicle.delete({
                where: { id: testVehicle.id },
            });
        }
        if (testUser) {
            await prisma.user.delete({
                where: { id: testUser.id },
            });
        }
        await prisma.$disconnect();
    });
    describe("POST /api/vehicles", () => {
        it("should create a new vehicle successfully", async () => {
            const vehicleData = {
                plateNo: "DHA-1234",
                registrationNo: "REG-123456",
                engineNo: "ENG123456",
                chassisNo: "CHS123456",
                brand: "Toyota",
                model: "Corolla",
                year: 2020,
                color: "White",
                type: "CAR",
                expiresAt: "2025-12-31",
            };
            const response = await request(app)
                .post("/api/vehicles")
                .set("Authorization", `Bearer ${authToken}`)
                .send(vehicleData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.plateNo).toBe(vehicleData.plateNo);
            expect(response.body.data.brand).toBe(vehicleData.brand);
            expect(response.body.data.model).toBe(vehicleData.model);
            expect(response.body.data.ownerId).toBe(testUser.id);
            testVehicle = response.body.data;
        });
        it("should fail to create vehicle with duplicate plate number", async () => {
            const vehicleData = {
                plateNo: "DHA-1234",
                registrationNo: "REG-789012",
                engineNo: "ENG789012",
                chassisNo: "CHS789012",
                brand: "Honda",
                model: "Civic",
                year: 2021,
                color: "Black",
                type: "CAR",
            };
            const response = await request(app)
                .post("/api/vehicles")
                .set("Authorization", `Bearer ${authToken}`)
                .send(vehicleData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("already exists");
        });
        it("should fail to create vehicle without required fields", async () => {
            const vehicleData = {
                plateNo: "DHA-5678",
                // Missing required fields
            };
            const response = await request(app)
                .post("/api/vehicles")
                .set("Authorization", `Bearer ${authToken}`)
                .send(vehicleData)
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe("GET /api/vehicles/my-vehicles", () => {
        it("should get user vehicles successfully", async () => {
            const response = await request(app)
                .get("/api/vehicles/my-vehicles")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].ownerId).toBe(testUser.id);
        });
        it("should fail without authentication", async () => {
            const response = await request(app)
                .get("/api/vehicles/my-vehicles")
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Access token required");
        });
    });
    describe("GET /api/vehicles/:vehicleId", () => {
        it("should get vehicle by ID successfully", async () => {
            const response = await request(app)
                .get(`/api/vehicles/${testVehicle.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testVehicle.id);
            expect(response.body.data.plateNo).toBe(testVehicle.plateNo);
        });
        it("should fail to get non-existent vehicle", async () => {
            const response = await request(app)
                .get("/api/vehicles/non-existent-id")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("not found");
        });
    });
    describe("PUT /api/vehicles/:vehicleId", () => {
        it("should update vehicle successfully", async () => {
            const updateData = {
                brand: "Updated Toyota",
                model: "Updated Corolla",
                color: "Red",
            };
            const response = await request(app)
                .put(`/api/vehicles/${testVehicle.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.brand).toBe(updateData.brand);
            expect(response.body.data.model).toBe(updateData.model);
            expect(response.body.data.color).toBe(updateData.color);
        });
        it("should fail to update vehicle with invalid data", async () => {
            const updateData = {
                year: "invalid-year",
            };
            const response = await request(app)
                .put(`/api/vehicles/${testVehicle.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe("DELETE /api/vehicles/:vehicleId", () => {
        it("should soft delete vehicle successfully", async () => {
            const response = await request(app)
                .delete(`/api/vehicles/${testVehicle.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("deleted successfully");
            // Verify vehicle is soft deleted
            const getResponse = await request(app)
                .get(`/api/vehicles/${testVehicle.id}`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);
            expect(getResponse.body.success).toBe(false);
        });
    });
});
