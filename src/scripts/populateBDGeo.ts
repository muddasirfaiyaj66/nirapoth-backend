/**
 * Script to populate BD Geographical Data
 * Run with: pnpm run populate-bd-geo
 */

import { PrismaClient } from "@prisma/client";
import { populateAllBDGeoData } from "../services/bdGeo.service";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🇧🇩 Bangladesh Geographical Data Population Script\n");
    console.log("This will fetch and store divisions, districts, and upazilas");
    console.log("from bdapi.vercel.app into your database.\n");

    await populateAllBDGeoData();

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
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
