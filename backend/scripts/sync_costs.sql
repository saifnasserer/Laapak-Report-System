-- Reconcile device_price in reports with cost_price in invoice_items
-- This fixes 102 legacy records where Profit Management costs were not synced to reports

UPDATE reports r
JOIN invoice_items ii ON r.id = ii.report_id
SET r.device_price = ii.cost_price
WHERE r.device_price = 0 AND ii.cost_price > 0;

-- Verify results
SELECT COUNT(*) as out_of_sync_count 
FROM reports r 
JOIN invoice_items ii ON r.id = ii.report_id 
WHERE r.device_price != ii.cost_price;
