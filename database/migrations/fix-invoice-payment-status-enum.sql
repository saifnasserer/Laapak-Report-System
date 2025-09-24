-- Fix invoice payment status ENUM to include new status values
-- Run this directly on the server

-- First, let's see current payment statuses
SELECT DISTINCT paymentStatus FROM invoices;

-- Convert any existing statuses to new format
UPDATE invoices SET paymentStatus = 'pending' WHERE paymentStatus = 'unpaid';
UPDATE invoices SET paymentStatus = 'completed' WHERE paymentStatus = 'paid';

-- Create temporary column
ALTER TABLE invoices ADD COLUMN paymentStatus_new VARCHAR(20) DEFAULT 'pending';

-- Copy data to new column
UPDATE invoices SET paymentStatus_new = paymentStatus WHERE paymentStatus IS NOT NULL;

-- Drop old column
ALTER TABLE invoices DROP COLUMN paymentStatus;

-- Rename new column
ALTER TABLE invoices CHANGE paymentStatus_new paymentStatus VARCHAR(20) DEFAULT 'pending';

-- Create new ENUM with all status values
ALTER TABLE invoices MODIFY COLUMN paymentStatus ENUM('pending', 'completed', 'cancelled', 'unpaid', 'partial', 'paid') DEFAULT 'pending';

-- Verify the changes
SELECT DISTINCT paymentStatus FROM invoices;
SHOW COLUMNS FROM invoices LIKE 'paymentStatus'; 