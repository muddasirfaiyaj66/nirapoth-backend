-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'POLICE', 'FIRE_SERVICE', 'CITIZEN');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('TRAFFIC', 'INFRASTRUCTURE', 'TRAFFIC_VIOLATION');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'BICYCLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'ONLINE');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE', 'STATION', 'SERVICE_CENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('POLICE_STATION', 'FIRE_SERVICE', 'CAMERA', 'INCIDENT', 'COMPLAINT', 'VIOLATION');

-- CreateEnum
CREATE TYPE "PoliceHierarchyLevel" AS ENUM ('HEADQUARTERS', 'RANGE', 'DISTRICT', 'CIRCLE', 'STATION', 'OUTPOST');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'TEMPORARY_CLOSED');

-- CreateEnum
CREATE TYPE "LicenseCategory" AS ENUM ('LIGHT_VEHICLE', 'MOTORCYCLE', 'LIGHT_VEHICLE_MOTORCYCLE', 'HEAVY_VEHICLE', 'PSV', 'GOODS_VEHICLE');

-- CreateEnum
CREATE TYPE "CitizenReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REPORT_SUBMITTED', 'REPORT_APPROVED', 'REPORT_REJECTED', 'APPEAL_SUBMITTED', 'APPEAL_APPROVED', 'APPEAL_REJECTED', 'REWARD_EARNED', 'PENALTY_APPLIED', 'DEBT_CREATED', 'PAYMENT_RECEIVED', 'SYSTEM', 'INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('OVER_SPEEDING', 'WRONG_SIDE_DRIVING', 'SIGNAL_BREAKING', 'NO_HELMET', 'ILLEGAL_PARKING', 'DRIVING_WITHOUT_LICENSE', 'OVERLOADING', 'PHONE_USAGE_WHILE_DRIVING', 'DRUNK_DRIVING', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('REWARD', 'PENALTY', 'BONUS', 'DEDUCTION', 'DEBT_PAYMENT');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('CITIZEN_REPORT', 'VIOLATION', 'FINE_PAYMENT', 'DEBT_PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WithdrawalMethod" AS ENUM ('BANK_TRANSFER', 'MOBILE_BANKING', 'CASH');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OUTSTANDING', 'PAID', 'WAIVED', 'PARTIAL');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "division" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "postalCode" TEXT,
    "type" "LocationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_info" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "emergencyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "PoliceHierarchyLevel" NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "locationId" TEXT,
    "contactId" TEXT,
    "headOfficerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "designation" TEXT,
    "nidNo" TEXT,
    "birthCertificateNo" TEXT,
    "profileImage" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "bloodGroup" TEXT,
    "alternatePhone" TEXT,
    "emergencyContact" TEXT,
    "emergencyContactPhone" TEXT,
    "presentAddress" TEXT,
    "presentCity" TEXT,
    "presentDistrict" TEXT,
    "presentDivision" TEXT,
    "presentPostalCode" TEXT,
    "permanentAddress" TEXT,
    "permanentCity" TEXT,
    "permanentDistrict" TEXT,
    "permanentDivision" TEXT,
    "permanentPostalCode" TEXT,
    "drivingLicenseNo" TEXT,
    "drivingLicenseIssueDate" TIMESTAMP(3),
    "drivingLicenseExpiryDate" TIMESTAMP(3),
    "drivingLicenseCategory" TEXT,
    "isDrivingLicenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "badgeNo" TEXT,
    "joiningDate" TIMESTAMP(3),
    "serviceLength" INTEGER,
    "rank" TEXT,
    "specialization" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blockedAt" TIMESTAMP(3),
    "unblockedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "blockedBy" TEXT,
    "unblockedBy" TEXT,
    "verifiedBy" TEXT,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stationId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "stationType" TEXT,
    "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT,
    "locationId" TEXT,
    "contactId" TEXT,
    "officerInChargeId" TEXT,
    "capacity" INTEGER,
    "currentStrength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "locationId" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "streamUrl" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "status" "CameraStatus" NOT NULL DEFAULT 'ACTIVE',
    "locationId" TEXT,
    "stationId" TEXT,
    "fireServiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "penalty" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "plateNo" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "engineNo" TEXT NOT NULL,
    "chassisNo" TEXT NOT NULL,
    "registrationNo" TEXT,
    "ownerId" TEXT NOT NULL,
    "driverId" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "locationId" TEXT,
    "description" TEXT,
    "status" "ViolationStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "violationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fineId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionId" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "locationId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "metadata" JSONB,
    "reportedById" TEXT,
    "handlingStationId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "type" "ComplaintType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "locationId" TEXT,
    "complainerId" TEXT,
    "handlingStationId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_reports" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "violationType" "ViolationType" NOT NULL,
    "description" TEXT,
    "evidenceUrl" TEXT[],
    "locationId" TEXT NOT NULL,
    "status" "CitizenReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerBadgeNumber" TEXT,
    "reviewerStationId" TEXT,
    "rewardAmount" DOUBLE PRECISION,
    "penaltyAmount" DOUBLE PRECISION,
    "appealSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "appealReason" TEXT,
    "appealStatus" "AppealStatus",
    "appealReviewedBy" TEXT,
    "appealReviewedAt" TIMESTAMP(3),
    "appealNotes" TEXT,
    "additionalPenaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "additionalPenaltyAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_reports_pkey" PRIMARY KEY ("id")
);

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
    "category" "LicenseCategory" NOT NULL,
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

-- CreateTable
CREATE TABLE "reward_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "description" TEXT NOT NULL,
    "relatedReportId" TEXT,
    "relatedViolationId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "WithdrawalMethod" NOT NULL,
    "accountDetails" JSONB NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outstanding_debts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "lateFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lastPenaltyDate" TIMESTAMP(3),
    "weeksPastDue" INTEGER NOT NULL DEFAULT 0,
    "status" "DebtStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "relatedTransactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outstanding_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "police_organizations_code_key" ON "police_organizations"("code");

-- CreateIndex
CREATE INDEX "police_organizations_level_idx" ON "police_organizations"("level");

-- CreateIndex
CREATE INDEX "police_organizations_parentId_idx" ON "police_organizations"("parentId");

-- CreateIndex
CREATE INDEX "police_organizations_code_idx" ON "police_organizations"("code");

-- CreateIndex
CREATE INDEX "police_organizations_isActive_idx" ON "police_organizations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nidNo_key" ON "users"("nidNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_birthCertificateNo_key" ON "users"("birthCertificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_drivingLicenseNo_key" ON "users"("drivingLicenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_badgeNo_key" ON "users"("badgeNo");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nidNo_idx" ON "users"("nidNo");

-- CreateIndex
CREATE INDEX "users_birthCertificateNo_idx" ON "users"("birthCertificateNo");

-- CreateIndex
CREATE INDEX "users_isEmailVerified_idx" ON "users"("isEmailVerified");

-- CreateIndex
CREATE UNIQUE INDEX "police_stations_code_key" ON "police_stations"("code");

-- CreateIndex
CREATE INDEX "police_stations_code_idx" ON "police_stations"("code");

-- CreateIndex
CREATE INDEX "police_stations_organizationId_idx" ON "police_stations"("organizationId");

-- CreateIndex
CREATE INDEX "police_stations_status_idx" ON "police_stations"("status");

-- CreateIndex
CREATE INDEX "police_stations_stationType_idx" ON "police_stations"("stationType");

-- CreateIndex
CREATE UNIQUE INDEX "fire_services_code_key" ON "fire_services"("code");

-- CreateIndex
CREATE INDEX "fire_services_code_idx" ON "fire_services"("code");

-- CreateIndex
CREATE INDEX "cameras_status_idx" ON "cameras"("status");

-- CreateIndex
CREATE INDEX "cameras_installedAt_idx" ON "cameras"("installedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rules_code_key" ON "rules"("code");

-- CreateIndex
CREATE INDEX "rules_code_idx" ON "rules"("code");

-- CreateIndex
CREATE INDEX "rules_isActive_idx" ON "rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNo_key" ON "vehicles"("plateNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engineNo_key" ON "vehicles"("engineNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassisNo_key" ON "vehicles"("chassisNo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNo_key" ON "vehicles"("registrationNo");

-- CreateIndex
CREATE INDEX "vehicles_plateNo_idx" ON "vehicles"("plateNo");

-- CreateIndex
CREATE INDEX "vehicles_engineNo_idx" ON "vehicles"("engineNo");

-- CreateIndex
CREATE INDEX "vehicles_chassisNo_idx" ON "vehicles"("chassisNo");

-- CreateIndex
CREATE INDEX "vehicles_ownerId_idx" ON "vehicles"("ownerId");

-- CreateIndex
CREATE INDEX "vehicles_driverId_idx" ON "vehicles"("driverId");

-- CreateIndex
CREATE INDEX "vehicles_isActive_idx" ON "vehicles"("isActive");

-- CreateIndex
CREATE INDEX "violations_vehicleId_idx" ON "violations"("vehicleId");

-- CreateIndex
CREATE INDEX "violations_ruleId_idx" ON "violations"("ruleId");

-- CreateIndex
CREATE INDEX "violations_status_idx" ON "violations"("status");

-- CreateIndex
CREATE INDEX "violations_createdAt_idx" ON "violations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fines_violationId_key" ON "fines"("violationId");

-- CreateIndex
CREATE INDEX "fines_status_idx" ON "fines"("status");

-- CreateIndex
CREATE INDEX "fines_dueDate_idx" ON "fines"("dueDate");

-- CreateIndex
CREATE INDEX "fines_issuedAt_idx" ON "fines"("issuedAt");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_fineId_idx" ON "payments"("fineId");

-- CreateIndex
CREATE INDEX "payments_paymentStatus_idx" ON "payments"("paymentStatus");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_externalId_key" ON "incidents"("externalId");

-- CreateIndex
CREATE INDEX "incidents_type_idx" ON "incidents"("type");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_priority_idx" ON "incidents"("priority");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_reportedAt_idx" ON "incidents"("reportedAt");

-- CreateIndex
CREATE INDEX "incidents_createdAt_idx" ON "incidents"("createdAt");

-- CreateIndex
CREATE INDEX "incidents_externalId_idx" ON "incidents"("externalId");

-- CreateIndex
CREATE INDEX "complaints_type_idx" ON "complaints"("type");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_priority_idx" ON "complaints"("priority");

-- CreateIndex
CREATE INDEX "complaints_createdAt_idx" ON "complaints"("createdAt");

-- CreateIndex
CREATE INDEX "citizen_reports_citizenId_idx" ON "citizen_reports"("citizenId");

-- CreateIndex
CREATE INDEX "citizen_reports_vehiclePlate_idx" ON "citizen_reports"("vehiclePlate");

-- CreateIndex
CREATE INDEX "citizen_reports_status_idx" ON "citizen_reports"("status");

-- CreateIndex
CREATE INDEX "citizen_reports_violationType_idx" ON "citizen_reports"("violationType");

-- CreateIndex
CREATE INDEX "citizen_reports_createdAt_idx" ON "citizen_reports"("createdAt");

-- CreateIndex
CREATE INDEX "citizen_reports_appealSubmitted_idx" ON "citizen_reports"("appealSubmitted");

-- CreateIndex
CREATE INDEX "citizen_reports_appealStatus_idx" ON "citizen_reports"("appealStatus");

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
CREATE INDEX "reward_transactions_userId_idx" ON "reward_transactions"("userId");

-- CreateIndex
CREATE INDEX "reward_transactions_type_idx" ON "reward_transactions"("type");

-- CreateIndex
CREATE INDEX "reward_transactions_source_idx" ON "reward_transactions"("source");

-- CreateIndex
CREATE INDEX "reward_transactions_status_idx" ON "reward_transactions"("status");

-- CreateIndex
CREATE INDEX "reward_transactions_createdAt_idx" ON "reward_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "reward_transactions_relatedReportId_idx" ON "reward_transactions"("relatedReportId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_userId_idx" ON "withdrawal_requests"("userId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_requestedAt_idx" ON "withdrawal_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "withdrawal_requests_processedBy_idx" ON "withdrawal_requests"("processedBy");

-- CreateIndex
CREATE INDEX "outstanding_debts_userId_idx" ON "outstanding_debts"("userId");

-- CreateIndex
CREATE INDEX "outstanding_debts_status_idx" ON "outstanding_debts"("status");

-- CreateIndex
CREATE INDEX "outstanding_debts_dueDate_idx" ON "outstanding_debts"("dueDate");

-- CreateIndex
CREATE INDEX "outstanding_debts_createdAt_idx" ON "outstanding_debts"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "police_organizations" ADD CONSTRAINT "police_organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "police_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_organizations" ADD CONSTRAINT "police_organizations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_organizations" ADD CONSTRAINT "police_organizations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_organizations" ADD CONSTRAINT "police_organizations_headOfficerId_fkey" FOREIGN KEY ("headOfficerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_stations" ADD CONSTRAINT "police_stations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "police_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_stations" ADD CONSTRAINT "police_stations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_stations" ADD CONSTRAINT "police_stations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "police_stations" ADD CONSTRAINT "police_stations_officerInChargeId_fkey" FOREIGN KEY ("officerInChargeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_services" ADD CONSTRAINT "fire_services_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_services" ADD CONSTRAINT "fire_services_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_fireServiceId_fkey" FOREIGN KEY ("fireServiceId") REFERENCES "fire_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "violations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_fineId_fkey" FOREIGN KEY ("fineId") REFERENCES "fines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_handlingStationId_fkey" FOREIGN KEY ("handlingStationId") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_complainerId_fkey" FOREIGN KEY ("complainerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_handlingStationId_fkey" FOREIGN KEY ("handlingStationId") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_appealReviewedBy_fkey" FOREIGN KEY ("appealReviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_relatedReportId_fkey" FOREIGN KEY ("relatedReportId") REFERENCES "citizen_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outstanding_debts" ADD CONSTRAINT "outstanding_debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outstanding_debts" ADD CONSTRAINT "outstanding_debts_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "reward_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
