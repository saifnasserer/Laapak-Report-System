-- Migration: Add Money Location Tracking
-- This migration adds money location tracking and updates payment methods

-- First, update existing payment methods to new structure
UPDATE invoices SET paymentMethod = 'بنك' WHERE paymentMethod = 'bank';
UPDATE invoices SET paymentMethod = 'محفظة' WHERE paymentMethod = 'card';
UPDATE invoices SET paymentMethod = 'other' WHERE paymentMethod = 'other';

-- Create money locations table
CREATE TABLE IF NOT EXISTS money_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    type ENUM('cash', 'digital_wallet', 'bank_account', 'other') NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EGP',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create money movements table (for tracking money transfers between locations)
CREATE TABLE IF NOT EXISTS money_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_location_id INT,
    to_location_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    movement_type ENUM('transfer', 'deposit', 'withdrawal', 'payment_received', 'expense_paid') NOT NULL,
    reference_type ENUM('invoice', 'expense', 'manual', 'other') NOT NULL,
    reference_id VARCHAR(255),
    description TEXT,
    movement_date DATETIME NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES money_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (to_location_id) REFERENCES money_locations(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_movement_date (movement_date),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_movement_type (movement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default money locations
INSERT INTO money_locations (name, name_ar, type, balance, description) VALUES
('Cash Register', 'الصندوق النقدي', 'cash', 0.00, 'Physical cash register'),
('Instapay Wallet', 'محفظة انستاباي', 'digital_wallet', 0.00, 'Instapay digital wallet'),
('Bank Account', 'الحساب البنكي', 'bank_account', 0.00, 'Main business bank account'),
('Digital Wallet', 'محفظة رقمية', 'digital_wallet', 0.00, 'Other digital wallet');

-- Add money_location_id to invoices table for tracking where payments are received
ALTER TABLE invoices ADD COLUMN money_location_id INT DEFAULT NULL;
ALTER TABLE invoices ADD FOREIGN KEY (money_location_id) REFERENCES money_locations(id) ON DELETE SET NULL;

-- Add money_location_id to expenses table for tracking where expenses are paid from
ALTER TABLE expenses ADD COLUMN money_location_id INT DEFAULT NULL;
ALTER TABLE expenses ADD FOREIGN KEY (money_location_id) REFERENCES money_locations(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_invoice_money_location ON invoices(money_location_id);
CREATE INDEX idx_expense_money_location ON expenses(money_location_id);
