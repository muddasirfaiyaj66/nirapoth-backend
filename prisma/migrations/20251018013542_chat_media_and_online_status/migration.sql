-- CreateEnum
CREATE TYPE "FireIncidentType" AS ENUM ('BUILDING_FIRE', 'VEHICLE_FIRE', 'FOREST_FIRE', 'INDUSTRIAL_FIRE', 'ELECTRICAL_FIRE', 'GAS_EXPLOSION', 'CHEMICAL_FIRE', 'RESCUE_OPERATION', 'MEDICAL_EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "FireIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FireIncidentStatus" AS ENUM ('REPORTED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FireTeamStatus" AS ENUM ('AVAILABLE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'TRAINING');

-- CreateEnum
CREATE TYPE "FireEquipmentStatus" AS ENUM ('OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DEPLOYED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'EMOJI');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FIRE_INCIDENT_REPORTED';
ALTER TYPE "NotificationType" ADD VALUE 'FIRE_INCIDENT_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'FIRE_INCIDENT_RESOLVED';

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "fire_incidents" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "type" "FireIncidentType" NOT NULL,
    "severity" "FireIncidentSeverity" NOT NULL,
    "status" "FireIncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "description" TEXT NOT NULL,
    "locationId" TEXT,
    "address" TEXT,
    "coordinates" TEXT,
    "fireServiceId" TEXT,
    "reportedBy" TEXT,
    "reporterPhone" TEXT,
    "reporterUserId" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "responseTime" INTEGER,
    "casualties" INTEGER NOT NULL DEFAULT 0,
    "injuries" INTEGER NOT NULL DEFAULT 0,
    "propertyDamage" TEXT,
    "notes" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_team_members" (
    "id" TEXT NOT NULL,
    "fireServiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "rank" TEXT,
    "status" "FireTeamStatus" NOT NULL DEFAULT 'AVAILABLE',
    "specialization" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_incident_assignments" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT,

    CONSTRAINT "fire_incident_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_equipment" (
    "id" TEXT NOT NULL,
    "fireServiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "status" "FireEquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "capacity" TEXT,
    "specifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_equipment_deployments" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "fire_equipment_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fire_incidents_incidentNumber_key" ON "fire_incidents"("incidentNumber");

-- CreateIndex
CREATE INDEX "fire_incidents_status_idx" ON "fire_incidents"("status");

-- CreateIndex
CREATE INDEX "fire_incidents_severity_idx" ON "fire_incidents"("severity");

-- CreateIndex
CREATE INDEX "fire_incidents_type_idx" ON "fire_incidents"("type");

-- CreateIndex
CREATE INDEX "fire_incidents_fireServiceId_idx" ON "fire_incidents"("fireServiceId");

-- CreateIndex
CREATE INDEX "fire_incidents_createdAt_idx" ON "fire_incidents"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fire_team_members_userId_key" ON "fire_team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fire_team_members_employeeId_key" ON "fire_team_members"("employeeId");

-- CreateIndex
CREATE INDEX "fire_team_members_fireServiceId_idx" ON "fire_team_members"("fireServiceId");

-- CreateIndex
CREATE INDEX "fire_team_members_userId_idx" ON "fire_team_members"("userId");

-- CreateIndex
CREATE INDEX "fire_team_members_status_idx" ON "fire_team_members"("status");

-- CreateIndex
CREATE INDEX "fire_incident_assignments_incidentId_idx" ON "fire_incident_assignments"("incidentId");

-- CreateIndex
CREATE INDEX "fire_incident_assignments_teamMemberId_idx" ON "fire_incident_assignments"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "fire_incident_assignments_incidentId_teamMemberId_key" ON "fire_incident_assignments"("incidentId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "fire_equipment_registrationNo_key" ON "fire_equipment"("registrationNo");

-- CreateIndex
CREATE INDEX "fire_equipment_fireServiceId_idx" ON "fire_equipment"("fireServiceId");

-- CreateIndex
CREATE INDEX "fire_equipment_status_idx" ON "fire_equipment"("status");

-- CreateIndex
CREATE INDEX "fire_equipment_type_idx" ON "fire_equipment"("type");

-- CreateIndex
CREATE INDEX "fire_equipment_deployments_incidentId_idx" ON "fire_equipment_deployments"("incidentId");

-- CreateIndex
CREATE INDEX "fire_equipment_deployments_equipmentId_idx" ON "fire_equipment_deployments"("equipmentId");

-- AddForeignKey
ALTER TABLE "fire_incidents" ADD CONSTRAINT "fire_incidents_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_incidents" ADD CONSTRAINT "fire_incidents_fireServiceId_fkey" FOREIGN KEY ("fireServiceId") REFERENCES "fire_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_incidents" ADD CONSTRAINT "fire_incidents_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_team_members" ADD CONSTRAINT "fire_team_members_fireServiceId_fkey" FOREIGN KEY ("fireServiceId") REFERENCES "fire_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_team_members" ADD CONSTRAINT "fire_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_incident_assignments" ADD CONSTRAINT "fire_incident_assignments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "fire_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_incident_assignments" ADD CONSTRAINT "fire_incident_assignments_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "fire_team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_equipment" ADD CONSTRAINT "fire_equipment_fireServiceId_fkey" FOREIGN KEY ("fireServiceId") REFERENCES "fire_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_equipment_deployments" ADD CONSTRAINT "fire_equipment_deployments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "fire_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_equipment_deployments" ADD CONSTRAINT "fire_equipment_deployments_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "fire_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
