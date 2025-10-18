-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('MINOR', 'MODERATE', 'SERIOUS', 'SEVERE', 'CRITICAL');

-- CreateTable
CREATE TABLE "gem_penalties" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "violationType" "ViolationType",
    "severity" "ViolationSeverity" NOT NULL DEFAULT 'MODERATE',
    "violationId" TEXT,
    "licenseNo" TEXT,
    "appliedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gem_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gem_penalties_citizenId_idx" ON "gem_penalties"("citizenId");

-- CreateIndex
CREATE INDEX "gem_penalties_appliedBy_idx" ON "gem_penalties"("appliedBy");

-- CreateIndex
CREATE INDEX "gem_penalties_violationId_idx" ON "gem_penalties"("violationId");

-- CreateIndex
CREATE INDEX "gem_penalties_licenseNo_idx" ON "gem_penalties"("licenseNo");

-- CreateIndex
CREATE INDEX "gem_penalties_createdAt_idx" ON "gem_penalties"("createdAt");

-- AddForeignKey
ALTER TABLE "gem_penalties" ADD CONSTRAINT "gem_penalties_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_penalties" ADD CONSTRAINT "gem_penalties_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "violations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_penalties" ADD CONSTRAINT "gem_penalties_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
