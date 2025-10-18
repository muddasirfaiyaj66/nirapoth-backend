/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `assignedBy` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenId` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `drivingLicenseId` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `requiresApproval` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `vehicle_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `vehicle_assignments` table. All the data in the column will be lost.
  - Added the required column `driverId` to the `vehicle_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `vehicle_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `vehicle_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VehicleAssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ChatRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "public"."vehicle_assignments" DROP CONSTRAINT "vehicle_assignments_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_assignments" DROP CONSTRAINT "vehicle_assignments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle_assignments" DROP CONSTRAINT "vehicle_assignments_drivingLicenseId_fkey";

-- DropIndex
DROP INDEX "public"."vehicle_assignments_citizenId_idx";

-- DropIndex
DROP INDEX "public"."vehicle_assignments_isActive_idx";

-- DropIndex
DROP INDEX "public"."vehicle_assignments_validFrom_validUntil_idx";

-- AlterTable
ALTER TABLE "vehicle_assignments" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "assignedAt",
DROP COLUMN "assignedBy",
DROP COLUMN "citizenId",
DROP COLUMN "drivingLicenseId",
DROP COLUMN "isActive",
DROP COLUMN "isApproved",
DROP COLUMN "requiresApproval",
DROP COLUMN "validFrom",
DROP COLUMN "validUntil",
ADD COLUMN     "driverId" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "salary" INTEGER NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "VehicleAssignmentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drivingLicenseId" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "expectedSalary" INTEGER NOT NULL,
    "preferredLocations" TEXT[],
    "availability" TEXT NOT NULL,
    "bio" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "ChatRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_drivingLicenseId_key" ON "driver_profiles"("drivingLicenseId");

-- CreateIndex
CREATE INDEX "driver_profiles_userId_idx" ON "driver_profiles"("userId");

-- CreateIndex
CREATE INDEX "driver_profiles_status_idx" ON "driver_profiles"("status");

-- CreateIndex
CREATE INDEX "driver_profiles_experienceYears_idx" ON "driver_profiles"("experienceYears");

-- CreateIndex
CREATE INDEX "driver_profiles_expectedSalary_idx" ON "driver_profiles"("expectedSalary");

-- CreateIndex
CREATE INDEX "chat_rooms_citizenId_idx" ON "chat_rooms"("citizenId");

-- CreateIndex
CREATE INDEX "chat_rooms_driverId_idx" ON "chat_rooms"("driverId");

-- CreateIndex
CREATE INDEX "chat_rooms_status_idx" ON "chat_rooms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_citizenId_driverId_key" ON "chat_rooms"("citizenId", "driverId");

-- CreateIndex
CREATE INDEX "chat_messages_chatRoomId_idx" ON "chat_messages"("chatRoomId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "vehicle_assignments_driverId_idx" ON "vehicle_assignments"("driverId");

-- CreateIndex
CREATE INDEX "vehicle_assignments_ownerId_idx" ON "vehicle_assignments"("ownerId");

-- CreateIndex
CREATE INDEX "vehicle_assignments_status_idx" ON "vehicle_assignments"("status");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_drivingLicenseId_fkey" FOREIGN KEY ("drivingLicenseId") REFERENCES "driving_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
