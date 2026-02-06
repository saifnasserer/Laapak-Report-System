-- Add new columns to clients table
ALTER TABLE clients ADD COLUMN company_name VARCHAR(255) NULL;
ALTER TABLE clients ADD COLUMN tax_number VARCHAR(255) NULL;
ALTER TABLE clients ADD COLUMN notes TEXT NULL;
