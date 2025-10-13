/*
  Comprehensive Database Migration for Enhanced User System
  
  This migration includes:
  1. Enhanced User model with comprehensive profile fields
  2. DrivingLicense model with validation capabilities
  3. VehicleAssignment model with license enforcement
  4. Police station and management system
  5. Removal of DRIVER role references
  
  Run this migration after backing up your database.
*/

-- Step 1: Add new columns to User table for comprehensive profile
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gender" "Gender",
ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT,
ADD COLUMN IF NOT EXISTS "profileImage" TEXT,

-- Contact Information
ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT,

-- Present Address
ADD COLUMN IF NOT EXISTS "presentAddress" TEXT,
ADD COLUMN IF NOT EXISTS "presentCity" TEXT,
ADD COLUMN IF NOT EXISTS "presentDistrict" TEXT,
ADD COLUMN IF NOT EXISTS "presentDivision" TEXT,
ADD COLUMN IF NOT EXISTS "presentPostalCode" TEXT,

-- Permanent Address
ADD COLUMN IF NOT EXISTS "permanentAddress" TEXT,
ADD COLUMN IF NOT EXISTS "permanentCity" TEXT,
ADD COLUMN IF NOT EXISTS "permanentDistrict" TEXT,
ADD COLUMN IF NOT EXISTS "permanentDivision" TEXT,
ADD COLUMN IF NOT EXISTS "permanentPostalCode" TEXT,

-- Professional Information (for police/fire service)
ADD COLUMN IF NOT EXISTS "designation" TEXT,
ADD COLUMN IF NOT EXISTS "badgeNo" TEXT,
ADD COLUMN IF NOT EXISTS "joiningDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rank" TEXT,
ADD COLUMN IF NOT EXISTS "specialization" TEXT,
ADD COLUMN IF NOT EXISTS "stationId" TEXT;

-- Step 2: Create Gender enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
        CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
    END IF;
END $$;

-- Step 3: Create License Category enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseCategory') THEN
        CREATE TYPE "LicenseCategory" AS ENUM ('MOTORCYCLE', 'CAR', 'HEAVY_VEHICLE', 'PROFESSIONAL', 'LEARNER');
    END IF;
END $$;

-- Step 4: Create License Status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseStatus') THEN
        CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');
    END IF;
END $$;

-- Step 5: Create Assignment Status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssignmentStatus') THEN
        CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED');
    END IF;
END $$;

-- Step 6: Create DrivingLicense table
CREATE TABLE IF NOT EXISTS "DrivingLicense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "category" "LicenseCategory" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "restrictions" TEXT,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "lastViolationDate" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "suspendedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrivingLicense_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create VehicleAssignment table
CREATE TABLE IF NOT EXISTS "VehicleAssignment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "licenseValidated" BOOLEAN NOT NULL DEFAULT false,
    "licenseId" TEXT,
    "gemValidated" BOOLEAN NOT NULL DEFAULT false,
    "restrictions" TEXT,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create PoliceStation table
CREATE TABLE IF NOT EXISTS "PoliceStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "stationType" TEXT DEFAULT 'POLICE_STATION',
    "organizationId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "division" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "emergencyPhone" TEXT,
    "capacity" INTEGER,
    "supervisorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

-- Step 9: Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "DrivingLicense_licenseNo_key" ON "DrivingLicense"("licenseNo");
CREATE INDEX IF NOT EXISTS "DrivingLicense_userId_idx" ON "DrivingLicense"("userId");
CREATE INDEX IF NOT EXISTS "DrivingLicense_category_idx" ON "DrivingLicense"("category");
CREATE INDEX IF NOT EXISTS "DrivingLicense_status_idx" ON "DrivingLicense"("status");
CREATE INDEX IF NOT EXISTS "DrivingLicense_expiryDate_idx" ON "DrivingLicense"("expiryDate");

CREATE INDEX IF NOT EXISTS "VehicleAssignment_vehicleId_idx" ON "VehicleAssignment"("vehicleId");
CREATE INDEX IF NOT EXISTS "VehicleAssignment_driverId_idx" ON "VehicleAssignment"("driverId");
CREATE INDEX IF NOT EXISTS "VehicleAssignment_status_idx" ON "VehicleAssignment"("status");
CREATE INDEX IF NOT EXISTS "VehicleAssignment_startDate_idx" ON "VehicleAssignment"("startDate");

CREATE UNIQUE INDEX IF NOT EXISTS "PoliceStation_code_key" ON "PoliceStation"("code");
CREATE INDEX IF NOT EXISTS "PoliceStation_district_idx" ON "PoliceStation"("district");
CREATE INDEX IF NOT EXISTS "PoliceStation_division_idx" ON "PoliceStation"("division");

CREATE UNIQUE INDEX IF NOT EXISTS "User_badgeNo_key" ON "User"("badgeNo") WHERE "badgeNo" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "User_stationId_idx" ON "User"("stationId") WHERE "stationId" IS NOT NULL;

-- Step 10: Add foreign key constraints
ALTER TABLE "DrivingLicense" ADD CONSTRAINT "DrivingLicense_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey" 
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_driverId_fkey" 
FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_assignedBy_fkey" 
FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_licenseId_fkey" 
FOREIGN KEY ("licenseId") REFERENCES "DrivingLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_approvedBy_fkey" 
FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_stationId_fkey" 
FOREIGN KEY ("stationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_supervisorId_fkey" 
FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 11: Update existing user data (migrate existing users to enhanced schema)
-- Split name into firstName and lastName if available
UPDATE "User" 
SET "firstName" = SPLIT_PART("name", ' ', 1),
    "lastName" = CASE 
        WHEN POSITION(' ' IN "name") > 0 
        THEN SUBSTR("name", POSITION(' ' IN "name") + 1)
        ELSE ''
    END
WHERE "firstName" IS NULL AND "name" IS NOT NULL;

-- Step 12: Remove DRIVER role references and update to CITIZEN
-- Note: This assumes you want to convert existing DRIVER users to CITIZEN
UPDATE "User" SET "role" = 'CITIZEN' WHERE "role" = 'DRIVER';

-- Step 13: Update Role enum to remove DRIVER (if it exists)
-- This will be handled by Prisma when you deploy the new schema

-- Step 14: Create default driving licenses for existing users who need them
-- This is optional - you might want to require users to add their licenses manually

-- Step 15: Add sample police stations (optional)
INSERT INTO "PoliceStation" ("id", "name", "code", "address", "city", "district", "division", "phone") 
VALUES 
  (gen_random_uuid()::text, 'Dhaka Metropolitan Police Headquarters', 'DMP-HQ', 'Ramna, Dhaka', 'Dhaka', 'Dhaka', 'Dhaka', '+880-2-8322740'),
  (gen_random_uuid()::text, 'Wari Police Station', 'DMP-WARI', 'Wari, Dhaka', 'Dhaka', 'Dhaka', 'Dhaka', '+880-2-7316668'),
  (gen_random_uuid()::text, 'Dhanmondi Police Station', 'DMP-DHN', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhaka', 'Dhaka', '+880-2-9661551')
ON CONFLICT ("code") DO NOTHING;

-- Step 16: Create stored procedures for common operations
CREATE OR REPLACE FUNCTION check_license_validity(p_license_id TEXT, p_vehicle_category TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    license_valid BOOLEAN := FALSE;
BEGIN
    SELECT 
        CASE 
            WHEN dl.status = 'ACTIVE' 
            AND dl.expiryDate > CURRENT_TIMESTAMP
            AND (
                (p_vehicle_category = 'MOTORCYCLE' AND dl.category IN ('MOTORCYCLE', 'CAR', 'HEAVY_VEHICLE', 'PROFESSIONAL'))
                OR (p_vehicle_category = 'CAR' AND dl.category IN ('CAR', 'HEAVY_VEHICLE', 'PROFESSIONAL'))
                OR (p_vehicle_category = 'HEAVY_VEHICLE' AND dl.category IN ('HEAVY_VEHICLE', 'PROFESSIONAL'))
                OR dl.category = 'PROFESSIONAL'
            )
            THEN TRUE
            ELSE FALSE
        END
    INTO license_valid
    FROM "DrivingLicense" dl
    WHERE dl.id = p_license_id;
    
    RETURN COALESCE(license_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Step 17: Add trigger to auto-update assignment status based on license expiry
CREATE OR REPLACE FUNCTION update_assignment_on_license_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- If a license is suspended or expired, update related assignments
    IF NEW.status IN ('EXPIRED', 'SUSPENDED', 'REVOKED') AND OLD.status = 'ACTIVE' THEN
        UPDATE "VehicleAssignment" 
        SET status = 'EXPIRED',
            endDate = CURRENT_TIMESTAMP,
            notes = COALESCE(notes, '') || ' - License ' || NEW.status || ' on ' || CURRENT_TIMESTAMP
        WHERE licenseId = NEW.id 
        AND status = 'ACTIVE';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER license_status_change_trigger
    AFTER UPDATE ON "DrivingLicense"
    FOR EACH ROW
    WHEN (OLD.status != NEW.status)
    EXECUTE FUNCTION update_assignment_on_license_expiry();

-- Migration completed successfully!
-- Remember to:
-- 1. Update your Prisma schema file to match these changes
-- 2. Generate new Prisma client: npx prisma generate
-- 3. Test all functionality thoroughly
-- 4. Update your application code to use the new fields