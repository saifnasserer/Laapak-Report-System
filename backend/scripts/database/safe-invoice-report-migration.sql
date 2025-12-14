-- Safe migration script for invoice-report linking
-- This script handles foreign key constraints properly

-- 1. First, let's check the current state
SELECT 'Current database state:' as info;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as invoices_with_reportId FROM invoices WHERE reportId IS NOT NULL;
SELECT COUNT(*) as invoices_without_reportId FROM invoices WHERE reportId IS NULL;

-- 2. Add new columns to reports table (these don't have foreign key constraints)
ALTER TABLE `reports` 
ADD COLUMN `invoice_created` BOOLEAN DEFAULT FALSE COMMENT 'Indicates if an invoice has been created for this report',
ADD COLUMN `invoice_id` VARCHAR(255) NULL COMMENT 'Reference to the created invoice ID',
ADD COLUMN `invoice_date` DATETIME NULL COMMENT 'Date when invoice was created';

-- 3. Add new columns to invoices table (these don't affect existing foreign keys)
ALTER TABLE `invoices` 
ADD COLUMN `created_from_report` BOOLEAN DEFAULT TRUE COMMENT 'Indicates if invoice was created from a report',
ADD COLUMN `report_order_number` VARCHAR(20) NULL COMMENT 'Copy of report order number for quick reference';

-- 4. Add indexes for performance
ALTER TABLE `reports` ADD INDEX `idx_invoice_id` (`invoice_id`);
ALTER TABLE `invoices` ADD INDEX `idx_client_id` (`client_id`);
ALTER TABLE `invoices` ADD INDEX `idx_date` (`date`);

-- 5. Show the updated state
SELECT 'After adding new columns:' as info;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as invoices_with_reportId FROM invoices WHERE reportId IS NOT NULL;
SELECT COUNT(*) as invoices_without_reportId FROM invoices WHERE reportId IS NULL;

-- 6. Create a view for easy querying
CREATE OR REPLACE VIEW `invoice_report_summary` AS
SELECT 
    i.id as invoice_id,
    i.reportId,
    i.client_id,
    i.date as invoice_date,
    i.amount,
    i.status as invoice_status,
    r.order_number,
    r.inspection_date,
    r.status as report_status,
    r.invoice_created,
    r.invoice_id as report_invoice_id
FROM invoices i
LEFT JOIN reports r ON i.reportId = r.id
ORDER BY i.date DESC;

-- 7. Show the view
SELECT 'Created invoice_report_summary view' as info;
SELECT COUNT(*) as total_records FROM invoice_report_summary;

-- 8. Final status
SELECT 'Migration completed successfully!' as status; 