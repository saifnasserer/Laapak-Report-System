-- Step 1: Create temporary column
ALTER TABLE reports ADD COLUMN status_temp VARCHAR(20) DEFAULT 'قيد الانتظار';

-- Step 2: Convert existing values to the new format
UPDATE reports SET status_temp = 'مكتمل' WHERE status = 'مكتمل';
UPDATE reports SET status_temp = 'قيد الانتظار' WHERE status = 'في المخزن';
UPDATE reports SET status_temp = 'ملغي' WHERE status = 'ملغي';
UPDATE reports SET status_temp = 'قيد الانتظار' WHERE status = 'active';
UPDATE reports SET status_temp = 'ملغي' WHERE status = 'cancelled';

-- Step 3: Drop the old column
ALTER TABLE reports DROP COLUMN status;

-- Step 4: Rename temp column to status
ALTER TABLE reports CHANGE status_temp status VARCHAR(20) DEFAULT 'قيد الانتظار';

-- Step 5: Create new ENUM
ALTER TABLE reports MODIFY COLUMN status ENUM('قيد الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغي', 'pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active') DEFAULT 'قيد الانتظار';

-- Step 6: Verify
SELECT DISTINCT status FROM reports; 