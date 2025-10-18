import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestVehicle() {
  try {
    console.log("🚗 Creating test vehicle for AI testing...");

    // Find or create test citizen
    let testUser = await prisma.user.findFirst({
      where: { email: "test.driver@nirapoth.gov.bd" },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "Driver",
          email: "test.driver@nirapoth.gov.bd",
          phone: "+8801712345678",
          password: "$2a$10$dummy.hash.for.testing.only",
          role: "CITIZEN",
          nidNo: "1234567890123",
          verifiedAt: new Date(),
        },
      });
      console.log("✅ Test user created:", testUser.id);
    } else {
      console.log("✅ Test user found:", testUser.id);
    }

    // Check if vehicle already exists
    let vehicle = await prisma.vehicle.findFirst({
      where: { registrationNo: "লক্ষ্মীপুর-ল-১১-৬১২৬" },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          plateNo: "লক্ষ্মীপুর-ল-১১-৬১২৬",
          registrationNo: "লক্ষ্মীপুর-ল-১১-৬১২৬",
          type: "CAR",
          brand: "Toyota",
          model: "Corolla",
          color: "Silver",
          year: 2022,
          engineNo: "TEST-ENGINE-12345678",
          chassisNo: "TEST-CHASSIS-ABCD1234",
          ownerId: testUser.id,
          registrationDate: new Date("2020-01-15"),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("✅ Test vehicle created:", vehicle.id);
      console.log("   Number Plate:", vehicle.plateNo);
      console.log("   Owner:", testUser.firstName, testUser.lastName);
    } else {
      console.log("✅ Test vehicle already exists:", vehicle.id);
      console.log("   Number Plate:", vehicle.plateNo);
    }

    console.log("\n🎉 Test vehicle ready for AI violation detection!");
    console.log(
      "📝 Use this number plate in your AI tests: লক্ষ্মীপুর-ল-১১-৬১২৬"
    );
  } catch (error) {
    console.error("❌ Error creating test vehicle:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestVehicle();
