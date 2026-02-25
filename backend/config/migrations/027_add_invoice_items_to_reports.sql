-- Migration 027: Add invoice_items to reports
-- Adds a JSON column to store multiple line items for a report, which later syncs to the invoice

ALTER TABLE `reports` ADD COLUMN `invoice_items` JSON DEFAULT NULL COMMENT 'JSON array of additional report invoice items';
