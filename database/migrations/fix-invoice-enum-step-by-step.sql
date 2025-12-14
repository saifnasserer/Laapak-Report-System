-- Step 1: Create temporary column
ALTER TABLE invoices ADD COLUMN paymentStatus_temp VARCHAR(20) DEFAULT 'pending';

-- Step 2: Convert existing values to new format
UPDATE invoices SET paymentStatus_temp = 'pending' WHERE paymentStatus = 'unpaid';
UPDATE invoices SET paymentStatus_temp = 'completed' WHERE paymentStatus = 'paid';
UPDATE invoices SET paymentStatus_temp = 'pending' WHERE paymentStatus = 'partial';

-- Step 3: Drop the old column
ALTER TABLE invoices DROP COLUMN paymentStatus;

-- Step 4: Rename temp column to paymentStatus
ALTER TABLE invoices CHANGE paymentStatus_temp paymentStatus VARCHAR(20) DEFAULT 'pending';

-- Step 5: Create new ENUM
ALTER TABLE invoices MODIFY COLUMN paymentStatus ENUM('pending', 'completed', 'cancelled', 'unpaid', 'partial', 'paid') DEFAULT 'pending';

-- Step 6: Verify the changes
SELECT DISTINCT paymentStatus FROM invoices;
SHOW COLUMNS FROM invoices LIKE 'paymentStatus'; 