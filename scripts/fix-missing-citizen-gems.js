const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixMissingCitizenGems() {
  try {
    console.log("🔧 Fixing missing CitizenGem records...");

    // Find all CITIZEN users who don't have a CitizenGem record
    const usersWithoutGems = await prisma.user.findMany({
      where: {
        role: "CITIZEN",
        citizenGem: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (usersWithoutGems.length === 0) {
      console.log("✅ All citizens already have CitizenGem records!");
      return;
    }

    console.log(
      `Found ${usersWithoutGems.length} citizens without CitizenGem records:`
    );
    usersWithoutGems.forEach((user) => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
    });

    console.log("\nCreating CitizenGem records...");

    // Create CitizenGem records for all users without one
    for (const user of usersWithoutGems) {
      await prisma.citizenGem.create({
        data: {
          citizenId: user.id,
          amount: 10, // Default starting gems
        },
      });
      console.log(
        `✅ Created CitizenGem for ${user.firstName} ${user.lastName}`
      );
    }

    console.log(
      `\n✅ Done! Created ${usersWithoutGems.length} CitizenGem records.`
    );
  } catch (error) {
    console.error("🔴 Error fixing missing CitizenGem records:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingCitizenGems();

