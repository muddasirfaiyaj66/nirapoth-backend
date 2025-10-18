"use strict";
/**
 * Script to populate BD Geographical Data
 * Run with: pnpm run populate-bd-geo
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bdGeo_service_1 = require("../services/bdGeo.service");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log("🇧🇩 Bangladesh Geographical Data Population Script\n");
        console.log("This will fetch and store divisions, districts, and upazilas");
        console.log("from bdapi.vercel.app into your database.\n");
        await (0, bdGeo_service_1.populateAllBDGeoData)();
        // Show statistics
        const [divisionCount, districtCount, upazilaCount] = await Promise.all([
            prisma.division.count(),
            prisma.district.count(),
            prisma.upazila.count(),
        ]);
        console.log("\n📊 Database Statistics:");
        console.log(`   Divisions: ${divisionCount}`);
        console.log(`   Districts: ${districtCount}`);
        console.log(`   Upazilas: ${upazilaCount}`);
        console.log("\n✨ All done! Your database is ready.\n");
        process.exit(0);
    }
    catch (error) {
        console.error("\n❌ Error:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
