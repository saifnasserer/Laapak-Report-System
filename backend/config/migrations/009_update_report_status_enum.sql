-- Migration to update report status ENUM values
-- Add new status values to the ENUM

-- First, create a temporary column with the new ENUM
ALTER TABLE reports ADD COLUMN status_new ENUM('pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') DEFAULT 'pending';

-- Copy data from old column to new column
UPDATE reports SET status_new = status WHERE status IS NOT NULL;

-- Drop the old column
ALTER TABLE reports DROP COLUMN status;

-- Rename the new column to status
ALTER TABLE reports CHANGE status_new status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') DEFAULT 'pending'; 