-- Migration: Update report status enum to include Arabic status values
-- This migration updates the reports table status column to include new Arabic status values

-- First, check if the column exists and get its current definition
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'reports' 
  AND COLUMN_NAME = 'status';

-- Update the status enum to include new Arabic values
ALTER TABLE reports 
MODIFY COLUMN status ENUM('completed', 'active', 'cancelled', 'مكتمل', 'في المخزن', 'ملغي') 
DEFAULT 'active';

-- Add comment to document the status values
ALTER TABLE reports 
MODIFY COLUMN status ENUM('completed', 'active', 'cancelled', 'مكتمل', 'في المخزن', 'ملغي') 
DEFAULT 'active' 
COMMENT 'Report status: completed/مكتمل (completed), active/في المخزن (in storage), cancelled/ملغي (cancelled)';

-- Create indexes only if they don't exist (using stored procedures to handle gracefully)
-- Note: The indexes may already exist, so we'll use a more robust approach

-- Check if reports status index exists and create if not
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'reports' 
       AND INDEX_NAME = 'idx_reports_status') = 0,
    'CREATE INDEX idx_reports_status ON reports(status)',
    'SELECT "Index idx_reports_status already exists" AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if invoices payment status index exists and create if not
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'invoices' 
       AND INDEX_NAME = 'idx_invoices_payment_status') = 0,
    'CREATE INDEX idx_invoices_payment_status ON invoices(paymentStatus)',
    'SELECT "Index idx_invoices_payment_status already exists" AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add comment to document the migration
-- Migration completed: Updated report status enum to include Arabic status values 