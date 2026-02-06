-- Migration: Add extra fields to Reports Table
-- This migration adds missing columns to the reports table: warranty_alerts_log, is_confirmed, and selected_accessories
-- Note: The migration runner will handle "Duplicate column name" errors gracefully

ALTER TABLE reports
ADD COLUMN warranty_alerts_log JSON DEFAULT NULL COMMENT 'Log of sent warranty alerts (6-month, annual)';

ALTER TABLE reports
ADD COLUMN is_confirmed BOOLEAN DEFAULT 0 COMMENT 'Indicates if the user has confirmed the order via WhatsApp';

ALTER TABLE reports
ADD COLUMN selected_accessories JSON DEFAULT NULL COMMENT 'List of accessories selected by the client';
