-- Migration to add device_price and supplier_id columns to the reports table
-- (Duplicate column errors are caught and ignored by the dbInit.js script)

ALTER TABLE reports ADD COLUMN device_price VARCHAR(50) DEFAULT 0 AFTER amount;
ALTER TABLE reports ADD COLUMN supplier_id INT DEFAULT NULL;
