-- Update Report Status Enum Values
-- This script updates the reports table to use the new status values

-- First, update any existing status values to match the new enum
UPDATE reports SET status = 'completed' WHERE status = 'pending';
UPDATE reports SET status = 'active' WHERE status = 'in-progress';

-- Modify the enum to include the new values
ALTER TABLE reports MODIFY COLUMN status ENUM('completed', 'active', 'cancelled') DEFAULT 'active';

-- Update any existing records to use the new default
UPDATE reports SET status = 'active' WHERE status IS NULL OR status = '';

-- Verify the changes
SELECT DISTINCT status FROM reports; 