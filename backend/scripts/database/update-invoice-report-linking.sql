-- Migration script to improve invoice-report linking
-- Run this script to update your database schema

-- 1. Update invoices table to make reportId required and add new fields
ALTER TABLE `invoices` 
MODIFY COLUMN `reportId` VARCHAR(50) NOT NULL,
ADD COLUMN `created_from_report` BOOLEAN DEFAULT TRUE COMMENT 'Indicates if invoice was created from a report',
ADD COLUMN `report_order_number` VARCHAR(20) NULL COMMENT 'Copy of report order number for quick reference',
ADD INDEX `idx_reportId` (`reportId`),
ADD INDEX `idx_client_id` (`client_id`),
ADD INDEX `idx_date` (`date`);

-- 2. Update reports table to add invoice tracking fields
ALTER TABLE `reports` 
ADD COLUMN `invoice_created` BOOLEAN DEFAULT FALSE COMMENT 'Indicates if an invoice has been created for this report',
ADD COLUMN `invoice_id` VARCHAR(255) NULL COMMENT 'Reference to the created invoice ID',
ADD COLUMN `invoice_date` DATETIME NULL COMMENT 'Date when invoice was created',
ADD INDEX `idx_invoice_id` (`invoice_id`);

-- 3. Update existing invoices to link them with reports (if not already linked)
-- This will link invoices that have matching client_id and order_number
UPDATE invoices i 
JOIN reports r ON i.client_id = r.client_id 
SET i.reportId = r.id,
    i.report_order_number = r.order_number
WHERE i.reportId IS NULL 
AND i.client_id = r.client_id;

-- 4. Update reports to mark them as having invoices created
UPDATE reports r 
JOIN invoices i ON r.id = i.reportId 
SET r.invoice_created = TRUE,
    r.invoice_id = i.id,
    r.invoice_date = i.created_at
WHERE r.invoice_created = FALSE;

-- 5. Create a view for easy invoice-report relationship querying
CREATE OR REPLACE VIEW invoice_report_summary AS
SELECT 
    r.id as report_id,
    r.order_number,
    r.device_model,
    r.client_name,
    r.inspection_date,
    r.billing_enabled,
    r.amount as report_amount,
    r.invoice_created,
    r.invoice_id,
    r.invoice_date,
    i.id as invoice_id,
    i.total as invoice_total,
    i.paymentStatus,
    i.date as invoice_date,
    i.created_at as invoice_created_at
FROM reports r
LEFT JOIN invoices i ON r.id = i.reportId
ORDER BY r.inspection_date DESC;

-- 6. Create a stored procedure to create invoice for a report
DELIMITER //
CREATE PROCEDURE CreateInvoiceForReport(
    IN p_report_id VARCHAR(50),
    IN p_amount DECIMAL(10,2),
    IN p_tax_rate DECIMAL(5,2),
    IN p_discount DECIMAL(10,2)
)
BEGIN
    DECLARE v_invoice_id VARCHAR(255);
    DECLARE v_client_id INT;
    DECLARE v_order_number VARCHAR(20);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_tax DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_report_exists BOOLEAN DEFAULT FALSE;
    
    -- Check if report exists and doesn't already have an invoice
    SELECT COUNT(*) INTO v_report_exists 
    FROM reports 
    WHERE id = p_report_id AND invoice_created = FALSE;
    
    IF v_report_exists > 0 THEN
        -- Get report details
        SELECT client_id, order_number, amount 
        INTO v_client_id, v_order_number, v_subtotal
        FROM reports 
        WHERE id = p_report_id;
        
        -- Calculate amounts
        SET v_subtotal = COALESCE(p_amount, v_subtotal);
        SET v_tax = (v_subtotal - COALESCE(p_discount, 0)) * (COALESCE(p_tax_rate, 14) / 100);
        SET v_total = v_subtotal - COALESCE(p_discount, 0) + v_tax;
        
        -- Generate invoice ID
        SET v_invoice_id = CONCAT('INV', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
        
        -- Create invoice
        INSERT INTO invoices (
            id, reportId, client_id, date, subtotal, discount, taxRate, tax, total, 
            paymentStatus, created_from_report, report_order_number, created_at, updated_at
        ) VALUES (
            v_invoice_id, p_report_id, v_client_id, NOW(), v_subtotal, 
            COALESCE(p_discount, 0), COALESCE(p_tax_rate, 14), v_tax, v_total,
            'pending', TRUE, v_order_number, NOW(), NOW()
        );
        
        -- Update report to mark invoice as created
        UPDATE reports 
        SET invoice_created = TRUE,
            invoice_id = v_invoice_id,
            invoice_date = NOW(),
            updated_at = NOW()
        WHERE id = p_report_id;
        
        SELECT v_invoice_id as invoice_id, 'Invoice created successfully' as message;
    ELSE
        SELECT NULL as invoice_id, 'Report not found or already has invoice' as message;
    END IF;
END //
DELIMITER ;

-- 7. Create a trigger to maintain data consistency
DELIMITER //
CREATE TRIGGER after_invoice_delete
AFTER DELETE ON invoices
FOR EACH ROW
BEGIN
    -- Update report to remove invoice reference
    UPDATE reports 
    SET invoice_created = FALSE,
        invoice_id = NULL,
        invoice_date = NULL,
        updated_at = NOW()
    WHERE id = OLD.reportId;
END //
DELIMITER ;

-- 8. Create a trigger to update report when invoice is updated
DELIMITER //
CREATE TRIGGER after_invoice_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
    -- Update report invoice date if payment status changes
    IF OLD.paymentStatus != NEW.paymentStatus THEN
        UPDATE reports 
        SET invoice_date = CASE 
            WHEN NEW.paymentStatus = 'paid' THEN NOW()
            ELSE invoice_date
        END,
        updated_at = NOW()
        WHERE id = NEW.reportId;
    END IF;
END //
DELIMITER ;

-- Show summary of changes
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_reports FROM reports;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as linked_invoices FROM invoices WHERE reportId IS NOT NULL;
SELECT COUNT(*) as reports_with_invoices FROM reports WHERE invoice_created = TRUE; 