const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addGemsToLicenseHolders() {
    try {
        console.log("🔧 Adding CitizenGem to all users with driving licenses...\n");

        // Find all users who have a driving license but no CitizenGem
        const usersWithLicenseNoGems = await prisma.user.findMany({
            where: {
                role: "CITIZEN",
                drivingLicenses: {
                    some: {}, // Has at least one driving license
                },
                citizenGem: null, // But no CitizenGem record
            },
            include: {
                drivingLicenses: {
                    select: {
                        licenseNo: true,
                        category: true,
                    },
                },
            },
        });

        if (usersWithLicenseNoGems.length === 0) {
            console.log(
                "✅ All users with driving licenses already have CitizenGem records!"
            );
            return;
        }

        console.log(
            `Found ${usersWithLicenseNoGems.length} users with driving licenses but no gems:`
        );
        usersWithLicenseNoGems.forEach((user) => {
            const license = user.drivingLicenses[0]; // Get first license
            console.log(
                `  - ${user.firstName} ${user.lastName} (${user.email}) - License: ${license?.licenseNo}`
            );
        });

        console.log("\n🎁 Creating CitizenGem records with 10 gems...\n");

        // Create CitizenGem records for all users with licenses
        for (const user of usersWithLicenseNoGems) {
            await prisma.citizenGem.create({
                data: {
                    citizenId: user.id,
                    amount: 10, // Start with 10 gems
                    isRestricted: false,
                },
            });
            console.log(
                `✅ Created CitizenGem (10 gems) for ${user.firstName} ${user.lastName}`
            );
        }

        console.log(
            `\n✅ Done! Created ${usersWithLicenseNoGems.length} CitizenGem records with 10 gems each.`
        );
        console.log(
            "\n🎉 All citizens with driving licenses now have 10 gems!"
        );
    } catch (error) {
        console.error("🔴 Error adding gems to license holders:", error);
    } finally {
        await prisma.$disconnect();
    }
}

addGemsToLicenseHolders();

