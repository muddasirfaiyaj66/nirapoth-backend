-- AlterTable
ALTER TABLE "driving_licenses" ADD COLUMN     "blacklistPenaltyPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blacklistReason" TEXT,
ADD COLUMN     "blacklistedAt" TIMESTAMP(3),
ADD COLUMN     "gems" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "isBlacklisted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "driving_licenses_isBlacklisted_idx" ON "driving_licenses"("isBlacklisted");

-- CreateIndex
CREATE INDEX "driving_licenses_gems_idx" ON "driving_licenses"("gems");
