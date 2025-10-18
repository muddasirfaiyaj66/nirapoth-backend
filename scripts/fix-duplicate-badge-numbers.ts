const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixDuplicateBadgeNumbers() {
  try {
    console.log("🔧 Starting to fix duplicate badge numbers...");

    // Find all users with empty badge numbers
    const usersWithEmptyBadge = await prisma.user.findMany({
      where: {
        badgeNo: "",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        badgeNo: true,
      },
    });

    console.log(
      `Found ${usersWithEmptyBadge.length} users with empty badge numbers`
    );

    if (usersWithEmptyBadge.length > 0) {
      // Update all users with empty badge numbers to have null instead
      const result = await prisma.user.updateMany({
        where: {
          badgeNo: "",
        },
        data: {
          badgeNo: null,
        },
      });

      console.log(`✅ Updated ${result.count} users - set badgeNo to null`);
    }

    // Also fix any empty nidNo
    const usersWithEmptyNid = await prisma.user.count({
      where: {
        nidNo: "",
      },
    });

    if (usersWithEmptyNid > 0) {
      const nidResult = await prisma.user.updateMany({
        where: {
          nidNo: "",
        },
        data: {
          nidNo: null,
        },
      });
      console.log(`✅ Fixed ${nidResult.count} empty NID numbers`);
    }

    // Fix empty birth certificate numbers
    const usersWithEmptyBirthCert = await prisma.user.count({
      where: {
        birthCertificateNo: "",
      },
    });

    if (usersWithEmptyBirthCert > 0) {
      const birthCertResult = await prisma.user.updateMany({
        where: {
          birthCertificateNo: "",
        },
        data: {
          birthCertificateNo: null,
        },
      });
      console.log(
        `✅ Fixed ${birthCertResult.count} empty birth certificate numbers`
      );
    }

    console.log("✅ Done! All duplicate empty values have been cleaned up.");
  } catch (error) {
    console.error("❌ Error fixing duplicate badge numbers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateBadgeNumbers();
