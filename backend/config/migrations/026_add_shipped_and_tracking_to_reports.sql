-- Migration: Add shipped status and tracking columns to reports
-- Adds 'shipped' to the status ENUM and adds tracking_code and tracking_method columns.

ALTER TABLE reports 
    'قيد الانتظار', 
    'قيد المعالجة', 
    'مكتمل', 
    'ملغى', 
    'آجل',
    'pending', 
    'in-progress', 
    'completed', 
    'shipped',
    'cancelled', 
    'canceled', 
    'active',
    'new_order'
) DEFAULT 'قيد الانتظار';

ALTER TABLE reports
ADD COLUMN tracking_code VARCHAR(100) NULL AFTER status,
ADD COLUMN tracking_method VARCHAR(50) NULL AFTER tracking_code;
