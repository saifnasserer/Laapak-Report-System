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

-- Create index for better performance on status queries
-- Note: MySQL doesn't support IF NOT EXISTS for CREATE INDEX, so we'll create it directly
-- If the index already exists, this will fail silently or show a warning
CREATE INDEX idx_reports_status ON reports(status);

-- Create index for invoice payment status queries
-- Note: MySQL doesn't support IF NOT EXISTS for CREATE INDEX, so we'll create it directly
-- If the index already exists, this will fail silently or show a warning
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- Add comment to document the migration
-- Migration completed: Updated report status enum to include Arabic status values 