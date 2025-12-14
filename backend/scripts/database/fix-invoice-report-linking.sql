-- Comprehensive SQL script to fix invoice-report linking
-- This script creates links in the invoice_reports junction table using multiple strategies

-- ============================================
-- STRATEGY 1: Link through invoice items (report_id field)
-- ============================================
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT DISTINCT ii.invoiceId, ii.report_id, NOW(), NOW()
FROM invoice_items ii
WHERE ii.report_id IS NOT NULL
  AND ii.report_id != ''
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = ii.invoiceId 
      AND ir.report_id = ii.report_id
  )
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- STRATEGY 2: Link through legacy reportId field in invoices
-- ============================================
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT DISTINCT i.id, i.reportId, NOW(), NOW()
FROM invoices i
WHERE i.reportId IS NOT NULL
  AND i.reportId != ''
  AND EXISTS (SELECT 1 FROM reports r WHERE r.id = i.reportId)
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = i.id 
      AND ir.report_id = i.reportId
  )
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- STRATEGY 3: Link through invoice_id field in reports
-- ============================================
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT DISTINCT r.invoice_id, r.id, NOW(), NOW()
FROM reports r
WHERE r.invoice_id IS NOT NULL
  AND r.invoice_id != ''
  AND EXISTS (SELECT 1 FROM invoices i WHERE i.id = r.invoice_id)
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = r.invoice_id 
      AND ir.report_id = r.id
  )
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- STRATEGY 4: Link through serial numbers matching
-- ============================================
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT DISTINCT ii.invoiceId, r.id, NOW(), NOW()
FROM invoice_items ii
INNER JOIN invoices i ON ii.invoiceId = i.id
INNER JOIN reports r ON r.serial_number = ii.serialNumber 
  AND r.client_id = i.client_id
WHERE ii.serialNumber IS NOT NULL
  AND ii.serialNumber != ''
  AND (ii.report_id IS NULL OR ii.report_id = '')
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = ii.invoiceId 
      AND ir.report_id = r.id
  )
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- STRATEGY 5: Link through client_id and date proximity (within 30 days)
-- Note: This links invoices to the closest matching report by date
-- For MySQL 8.0+, you can use ROW_NUMBER() for better matching
-- For older versions, this will create multiple links (which is acceptable)
-- ============================================
INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at)
SELECT DISTINCT i.id, r.id, NOW(), NOW()
FROM invoices i
INNER JOIN reports r ON r.client_id = i.client_id
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = i.id
  )
  AND ABS(DATEDIFF(i.date, r.inspection_date)) <= 30
  AND r.invoice_created = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = i.id 
      AND ir.report_id = r.id
  )
  -- Only link to the closest report by date (if MySQL 8.0+)
  AND r.id = (
    SELECT r2.id
    FROM reports r2
    WHERE r2.client_id = i.client_id
      AND ABS(DATEDIFF(i.date, r2.inspection_date)) <= 30
      AND r2.invoice_created = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM invoice_reports ir2 
        WHERE ir2.invoice_id = i.id AND ir2.report_id = r2.id
      )
    ORDER BY ABS(DATEDIFF(i.date, r2.inspection_date))
    LIMIT 1
  )
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- Update report flags after linking
-- ============================================
UPDATE reports r
INNER JOIN invoice_reports ir ON r.id = ir.report_id
INNER JOIN invoices i ON ir.invoice_id = i.id
SET r.invoice_created = TRUE,
    r.invoice_id = i.id,
    r.invoice_date = i.date,
    r.billing_enabled = TRUE
WHERE r.invoice_created = FALSE OR r.invoice_id IS NULL;

-- ============================================
-- ANALYSIS QUERIES (Run these to see the status)
-- ============================================

-- Count total links
SELECT COUNT(*) as total_links FROM invoice_reports;

-- Count unlinked invoices
SELECT COUNT(*) as unlinked_invoices
FROM invoices i
LEFT JOIN invoice_reports ir ON i.id = ir.invoice_id
WHERE ir.id IS NULL;

-- Count unlinked reports (with invoice_id but not in junction)
SELECT COUNT(*) as unlinked_reports
FROM reports r
WHERE r.invoice_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.report_id = r.id AND ir.invoice_id = r.invoice_id
  );

-- Count invoice items with report_id but not linked
SELECT COUNT(*) as unlinked_invoice_items
FROM invoice_items ii
WHERE ii.report_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM invoice_reports ir 
    WHERE ir.invoice_id = ii.invoiceId AND ir.report_id = ii.report_id
  );

