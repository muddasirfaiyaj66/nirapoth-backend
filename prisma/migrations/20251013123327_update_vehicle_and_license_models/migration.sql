/*
  Warnings:

  - You are about to drop the column `make` on the `vehicles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[engineNo]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chassisNo]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNo]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `driving_licenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `chassisNo` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engineNo` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LicenseCategory" AS ENUM ('LIGHT_VEHICLE', 'MOTORCYCLE', 'LIGHT_VEHICLE_MOTORCYCLE', 'HEAVY_VEHICLE', 'PSV', 'GOODS_VEHICLE');

-- AlterTable
ALTER TABLE "driving_licenses" DROP COLUMN "category",
ADD COLUMN     "category" "LicenseCategory" NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "make",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "chassisNo" TEXT NOT NULL,
ADD COLUMN     "engineNo" TEXT NOT NULL,
ADD COLUMN     "registrationNo" TEXT;

-- CreateIndex
CREATE INDEX "driving_licenses_category_idx" ON "driving_licenses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engineNo_key" ON "vehicles"("engineNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassisNo_key" ON "vehicles"("chassisNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNo_key" ON "vehicles"("registrationNo");

-- CreateIndex
CREATE INDEX "vehicles_engineNo_idx" ON "vehicles"("engineNo");

-- CreateIndex
CREATE INDEX "vehicles_chassisNo_idx" ON "vehicles"("chassisNo");
