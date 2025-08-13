-- Fix report status ENUM to include Arabic values
-- Run this directly on the server

-- First, let's see current statuses
SELECT DISTINCT status FROM reports;

-- Convert any existing English statuses to Arabic
UPDATE reports SET status = 'مكتمل' WHERE status = 'completed';
UPDATE reports SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE reports SET status = 'ملغى' WHERE status = 'cancelled';
UPDATE reports SET status = 'قيد الانتظار' WHERE status = 'active';

-- Create temporary column
ALTER TABLE reports ADD COLUMN status_new VARCHAR(20) DEFAULT 'قيد الانتظار';

-- Copy data to new column
UPDATE reports SET status_new = status WHERE status IS NOT NULL;

-- Drop old column
ALTER TABLE reports DROP COLUMN status;

-- Rename new column
ALTER TABLE reports CHANGE status_new status VARCHAR(20) DEFAULT 'قيد الانتظار';

-- Create new ENUM with Arabic values
ALTER TABLE reports MODIFY COLUMN status ENUM('قيد الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغى', 'pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') DEFAULT 'قيد الانتظار';

-- Verify the changes
SELECT DISTINCT status FROM reports;
SHOW COLUMNS FROM reports LIKE 'status'; 