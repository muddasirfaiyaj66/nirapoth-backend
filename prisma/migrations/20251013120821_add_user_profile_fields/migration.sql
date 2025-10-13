/*
  Warnings:

  - The values [DRIVER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `driver_gems` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[drivingLicenseNo]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[badgeNo]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'POLICE', 'FIRE_SERVICE', 'CITIZEN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CITIZEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."driver_gems" DROP CONSTRAINT "driver_gems_driverId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "badgeNo" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "drivingLicenseCategory" TEXT,
ADD COLUMN     "drivingLicenseExpiryDate" TIMESTAMP(3),
ADD COLUMN     "drivingLicenseIssueDate" TIMESTAMP(3),
ADD COLUMN     "drivingLicenseNo" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isDrivingLicenseVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joiningDate" TIMESTAMP(3),
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "permanentCity" TEXT,
ADD COLUMN     "permanentDistrict" TEXT,
ADD COLUMN     "permanentDivision" TEXT,
ADD COLUMN     "permanentPostalCode" TEXT,
ADD COLUMN     "presentAddress" TEXT,
ADD COLUMN     "presentCity" TEXT,
ADD COLUMN     "presentDistrict" TEXT,
ADD COLUMN     "presentDivision" TEXT,
ADD COLUMN     "presentPostalCode" TEXT,
ADD COLUMN     "rank" TEXT,
ADD COLUMN     "serviceLength" INTEGER,
ADD COLUMN     "specialization" TEXT;

-- DropTable
DROP TABLE "public"."driver_gems";

-- CreateTable
CREATE TABLE "citizen_gems" (
    "citizenId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_gems_pkey" PRIMARY KEY ("citizenId")
);

-- CreateTable
CREATE TABLE "driving_licenses" (
    "id" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "restrictions" TEXT,
    "endorsements" TEXT,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "lastViolationAt" TIMESTAMP(3),
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driving_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "drivingLicenseId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driving_licenses_licenseNo_key" ON "driving_licenses"("licenseNo");

-- CreateIndex
CREATE INDEX "driving_licenses_licenseNo_idx" ON "driving_licenses"("licenseNo");

-- CreateIndex
CREATE INDEX "driving_licenses_citizenId_idx" ON "driving_licenses"("citizenId");

-- CreateIndex
CREATE INDEX "driving_licenses_category_idx" ON "driving_licenses"("category");

-- CreateIndex
CREATE INDEX "driving_licenses_isActive_idx" ON "driving_licenses"("isActive");

-- CreateIndex
CREATE INDEX "driving_licenses_isVerified_idx" ON "driving_licenses"("isVerified");

-- CreateIndex
CREATE INDEX "driving_licenses_expiryDate_idx" ON "driving_licenses"("expiryDate");

-- CreateIndex
CREATE INDEX "vehicle_assignments_vehicleId_idx" ON "vehicle_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_assignments_citizenId_idx" ON "vehicle_assignments"("citizenId");

-- CreateIndex
CREATE INDEX "vehicle_assignments_isActive_idx" ON "vehicle_assignments"("isActive");

-- CreateIndex
CREATE INDEX "vehicle_assignments_validFrom_validUntil_idx" ON "vehicle_assignments"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "users_drivingLicenseNo_key" ON "users"("drivingLicenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_badgeNo_key" ON "users"("badgeNo");

-- AddForeignKey
ALTER TABLE "citizen_gems" ADD CONSTRAINT "citizen_gems_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driving_licenses" ADD CONSTRAINT "driving_licenses_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_drivingLicenseId_fkey" FOREIGN KEY ("drivingLicenseId") REFERENCES "driving_licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
