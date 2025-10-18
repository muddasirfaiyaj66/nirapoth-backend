/**
 * Script to manually mark a user as online
 * Run this to test online status feature
 * 
 * Usage: node scripts/mark-user-online.js <email>
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function markUserOnline() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Please provide user email");
        console.log("Usage: node scripts/mark-user-online.js <email>");
        process.exit(1);
    }

    try {
        console.log(`🔍 Finding user: ${email}...`);

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isOnline: true,
                lastActivityAt: true,
                lastSeenAt: true,
            },
        });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`\n📋 Current Status:`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Online: ${user.isOnline ? "🟢 YES" : "⚫ NO"}`);
        console.log(`   Last Activity: ${user.lastActivityAt || "Never"}`);
        console.log(`   Last Seen: ${user.lastSeenAt || "Never"}`);

        console.log(`\n✅ Marking user as online...`);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isOnline: true,
                lastActivityAt: new Date(),
            },
        });

        console.log(`\n🎉 Success! ${user.firstName} is now online!`);
        console.log(`\n📋 New Status:`);
        console.log(`   Online: 🟢 YES`);
        console.log(`   Last Activity: ${new Date().toISOString()}`);
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

markUserOnline();

