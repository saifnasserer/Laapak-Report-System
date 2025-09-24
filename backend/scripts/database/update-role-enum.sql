-- Update the role ENUM values in the admins table
-- This script changes the role column from the old values to the new ones

-- First, let's see the current ENUM values
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'laapak_report_system' 
AND TABLE_NAME = 'admins' 
AND COLUMN_NAME = 'role';

-- Update the ENUM values
ALTER TABLE `admins` 
MODIFY COLUMN `role` ENUM('admin', 'superadmin') NOT NULL DEFAULT 'admin';

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'laapak_report_system' 
AND TABLE_NAME = 'admins' 
AND COLUMN_NAME = 'role'; 