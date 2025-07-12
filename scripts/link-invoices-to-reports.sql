-- Script to link existing invoices to their corresponding reports
-- This script matches invoices to reports based on client_id and amount

-- First, let's see what matches we have
SELECT 
    i.id as invoice_id, 
    i.client_id, 
    i.total, 
    r.id as report_id, 
    r.client_id as report_client_id, 
    r.amount as report_amount 
FROM invoices i 
JOIN reports r ON i.client_id = r.client_id AND i.total = r.amount 
WHERE r.billing_enabled = 1;

-- Insert links into invoice_reports junction table
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT 
    i.id as invoice_id, 
    r.id as report_id,
    NOW() as created_at,
    NOW() as updated_at
FROM invoices i 
JOIN reports r ON i.client_id = r.client_id AND i.total = r.amount 
WHERE r.billing_enabled = 1
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Update the direct reportId field in invoices table for backward compatibility
UPDATE invoices i
JOIN reports r ON i.client_id = r.client_id AND i.total = r.amount 
SET i.reportId = r.id, i.updated_at = NOW()
WHERE r.billing_enabled = 1;

-- Show the results
SELECT 
    ir.invoice_id,
    ir.report_id,
    i.total as invoice_total,
    r.amount as report_amount,
    c.name as client_name
FROM invoice_reports ir
JOIN invoices i ON ir.invoice_id = i.id
JOIN reports r ON ir.report_id = r.id
JOIN clients c ON i.client_id = c.id
ORDER BY ir.invoice_id; 