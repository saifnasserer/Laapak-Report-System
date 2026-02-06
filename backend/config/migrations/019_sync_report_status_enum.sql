-- Migration: Sync report status ENUM with model
-- This migration ensures the status column supports all values defined in the Report model,
-- including both English and Arabic versions, and sets the default to Arabic as per the model.

ALTER TABLE reports 
MODIFY COLUMN status ENUM(
    'قيد الانتظار', 
    'قيد المعالجة', 
    'مكتمل', 
    'ملغى', 
    'pending', 
    'in-progress', 
    'completed', 
    'cancelled', 
    'canceled', 
    'active'
) DEFAULT 'قيد الانتظار';
