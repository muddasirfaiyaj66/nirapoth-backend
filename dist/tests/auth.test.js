import request from "supertest";
import { app } from "../index";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
describe("Authentication API", () => {
    let testUser;
    let authToken;
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: "test@example.com",
                },
            },
        });
    });
    afterAll(async () => {
        // Clean up test data
        if (testUser) {
            await prisma.user.delete({
                where: { id: testUser.id },
            });
        }
        await prisma.$disconnect();
    });
    describe("POST /api/auth/register", () => {
        it("should register a new user successfully", async () => {
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "Test",
                lastName: "User",
                role: "CITIZEN",
            };
            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.firstName).toBe(userData.firstName);
            expect(response.body.data.user.lastName).toBe(userData.lastName);
            expect(response.body.data.user.role).toBe(userData.role);
            expect(response.body.data.tokens).toBeDefined();
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
            testUser = response.body.data.user;
            authToken = response.body.data.tokens.accessToken;
        });
        it("should fail to register with invalid email", async () => {
            const userData = {
                email: "invalid-email",
                password: "password123",
                firstName: "Test",
                lastName: "User",
                role: "CITIZEN",
            };
            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid email");
        });
        it("should fail to register with weak password", async () => {
            const userData = {
                email: "test2@example.com",
                password: "123",
                firstName: "Test",
                lastName: "User",
                role: "CITIZEN",
            };
            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Password");
        });
        it("should fail to register with duplicate email", async () => {
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "Test",
                lastName: "User",
                role: "CITIZEN",
            };
            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("already exists");
        });
    });
    describe("POST /api/auth/login", () => {
        it("should login with valid credentials", async () => {
            const loginData = {
                email: "test@example.com",
                password: "password123",
            };
            const response = await request(app)
                .post("/api/auth/login")
                .send(loginData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.tokens).toBeDefined();
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
            authToken = response.body.data.tokens.accessToken;
        });
        it("should fail to login with invalid email", async () => {
            const loginData = {
                email: "nonexistent@example.com",
                password: "password123",
            };
            const response = await request(app)
                .post("/api/auth/login")
                .send(loginData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid credentials");
        });
        it("should fail to login with invalid password", async () => {
            const loginData = {
                email: "test@example.com",
                password: "wrongpassword",
            };
            const response = await request(app)
                .post("/api/auth/login")
                .send(loginData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid credentials");
        });
    });
    describe("POST /api/auth/refresh", () => {
        it("should refresh token successfully", async () => {
            const response = await request(app).post("/api/auth/refresh").expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tokens).toBeDefined();
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
        });
    });
    describe("GET /api/auth/me", () => {
        it("should get current user with valid token", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe("test@example.com");
            expect(response.body.data.user.firstName).toBe("Test");
            expect(response.body.data.user.lastName).toBe("User");
        });
        it("should fail to get current user without token", async () => {
            const response = await request(app).get("/api/auth/me").expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Access token required");
        });
        it("should fail to get current user with invalid token", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", "Bearer invalid-token")
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid token");
        });
    });
    describe("POST /api/auth/logout", () => {
        it("should logout successfully", async () => {
            const response = await request(app)
                .post("/api/auth/logout")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("Logged out successfully");
        });
    });
});
