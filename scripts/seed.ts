#!/usr/bin/env node

/**
 * Standalone seeding script for Nirapoth Backend
 * This can be run manually: npm run seed
 */

import { SeedService } from "../src/services/seed.service";

async function runSeed() {
  console.log("🌱 Running Nirapoth Database Seeding...");
  console.log("=".repeat(50));

  try {
    await SeedService.initializeDatabase();
    console.log("=".repeat(50));
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
