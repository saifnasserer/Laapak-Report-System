-- Migration: Add device_brand to Reports Table
-- This migration adds the device_brand column to the reports table
-- and populates it based on existing device_model values.

ALTER TABLE reports
ADD COLUMN device_brand VARCHAR(50) DEFAULT NULL AFTER client_address;

-- Populate device_brand based on common brands found in device_model
UPDATE reports SET device_brand = 'Dell' WHERE device_model LIKE 'Dell%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'HP' WHERE device_model LIKE 'HP%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Lenovo' WHERE device_model LIKE 'Lenovo%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Apple' WHERE (device_model LIKE 'Apple%' OR device_model LIKE 'MacBook%') AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Asus' WHERE device_model LIKE 'Asus%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Acer' WHERE device_model LIKE 'Acer%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'MSI' WHERE device_model LIKE 'MSI%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Surface' WHERE device_model LIKE 'Surface%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Toshiba' WHERE device_model LIKE 'Toshiba%' AND device_brand IS NULL;
UPDATE reports SET device_brand = 'Samsung' WHERE device_model LIKE 'Samsung%' AND device_brand IS NULL;

-- For anything else, use the first word as the brand as a fallback
UPDATE reports 
SET device_brand = SUBSTRING_INDEX(device_model, ' ', 1) 
WHERE device_brand IS NULL AND device_model IS NOT NULL AND device_model != '';
