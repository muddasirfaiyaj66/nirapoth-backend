-- Migration: Remove DRIVER role and convert to Citizen-based system
-- Run this AFTER stopping all application servers

BEGIN;

-- Step 1: Create the new CitizenGem table
CREATE TABLE IF NOT EXISTS citizen_gems (
    citizen_id TEXT NOT NULL PRIMARY KEY,
    amount INTEGER NOT NULL DEFAULT 0,
    is_restricted BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Create the VehicleAssignment table
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id TEXT NOT NULL PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    citizen_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP(3),
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Migrate data from driver_gems to citizen_gems
INSERT INTO citizen_gems (citizen_id, amount, is_restricted, last_updated, created_at, updated_at)
SELECT driver_id, amount, is_restricted, last_updated, created_at, updated_at 
FROM driver_gems 
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = driver_gems.driver_id);

-- Step 4: Update all DRIVER users to CITIZEN role
UPDATE users 
SET role = 'CITIZEN', updated_at = CURRENT_TIMESTAMP 
WHERE role = 'DRIVER';

-- Step 5: Create vehicle assignments for existing driver assignments
INSERT INTO vehicle_assignments (id, vehicle_id, citizen_id, assigned_by, assigned_at, is_active, notes)
SELECT 
    gen_random_uuid() AS id,
    v.id AS vehicle_id,
    v.driver_id AS citizen_id,
    v.owner_id AS assigned_by,
    v.created_at AS assigned_at,
    true AS is_active,
    'Migrated from driver assignment' AS notes
FROM vehicles v 
WHERE v.driver_id IS NOT NULL
AND EXISTS (SELECT 1 FROM users WHERE users.id = v.driver_id);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_citizen_gems_citizen_id ON citizen_gems(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_gems_is_restricted ON citizen_gems(is_restricted);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle_id ON vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_citizen_id ON vehicle_assignments(citizen_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_is_active ON vehicle_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_valid_dates ON vehicle_assignments(valid_from, valid_until);

-- Step 7: Drop the old driver_gems table (be careful!)
-- DROP TABLE IF EXISTS driver_gems;

COMMIT;

-- Note: The DROP TABLE statement is commented out for safety
-- Uncomment it only after verifying the migration was successful
-- and you have a backup of your data