-- Migration: Add CPU, GPU, RAM, Storage fields to Reports Table
-- This migration adds device specification columns to the reports table
-- Note: The migration runner will handle "Duplicate column name" errors gracefully

ALTER TABLE reports
ADD COLUMN cpu VARCHAR(255) DEFAULT NULL COMMENT 'CPU specification';

ALTER TABLE reports
ADD COLUMN gpu VARCHAR(255) DEFAULT NULL COMMENT 'GPU specification';

ALTER TABLE reports
ADD COLUMN ram VARCHAR(255) DEFAULT NULL COMMENT 'RAM specification';

ALTER TABLE reports
ADD COLUMN storage VARCHAR(255) DEFAULT NULL COMMENT 'Storage specification';

