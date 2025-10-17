-- Remove CASH from PaymentMethod enum
-- This migration removes the CASH payment option from the system

-- First, update any existing payments that use CASH to ONLINE
UPDATE payments 
SET "paymentMethod" = 'ONLINE' 
WHERE "paymentMethod" = 'CASH';

-- Drop and recreate the enum without CASH
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'ONLINE');

-- Update the payments table to use the new enum
ALTER TABLE payments 
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" 
  USING "paymentMethod"::text::"PaymentMethod";

-- Drop the old enum
DROP TYPE "PaymentMethod_old";

-- Update debt_payments table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'debt_payments' 
    AND column_name = 'paymentMethod'
  ) THEN
    -- Update CASH payments to ONLINE in debt_payments
    UPDATE debt_payments 
    SET "paymentMethod" = 'ONLINE' 
    WHERE "paymentMethod" = 'CASH';
    
    -- Alter the column type
    ALTER TABLE debt_payments 
      ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" 
      USING "paymentMethod"::text::"PaymentMethod";
  END IF;
END $$;
