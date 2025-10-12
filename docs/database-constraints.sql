-- Database Constraint Documentation
-- This file documents the business logic constraints that should be maintained

-- Constraint: Driver Restriction Rule
-- When a driver's gem count is <= 0, the isRestricted field must be true
-- This is enforced at the application level in DriverGemService

-- Example SQL to check constraint compliance:
/*
SELECT 
  dg.driverId,
  dg.amount,
  dg.isRestricted,
  CASE 
    WHEN dg.amount <= 0 AND dg.isRestricted = false THEN 'VIOLATION: Should be restricted'
    WHEN dg.amount > 0 AND dg.isRestricted = true THEN 'WARNING: Could be unrestricted'
    ELSE 'OK'
  END as constraint_status
FROM driver_gems dg;
*/

-- To manually fix constraint violations (if any):
/*
UPDATE driver_gems 
SET isRestricted = true 
WHERE amount <= 0 AND isRestricted = false;
*/