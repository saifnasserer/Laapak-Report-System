-- Migration: Create Financial Management Tables
-- This migration adds tables for tracking product costs, expenses, and financial analytics

-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007553',
    budget_limit DECIMAL(10,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category_id INT NOT NULL,
    type ENUM('fixed', 'variable') NOT NULL DEFAULT 'variable',
    date DATE NOT NULL,
    repeat_monthly BOOLEAN DEFAULT FALSE,
    description TEXT,
    receipt_url VARCHAR(500),
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'approved',
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product costs table (to track cost prices)
CREATE TABLE IF NOT EXISTS product_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    cost_price DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(255),
    purchase_date DATE,
    effective_date DATE NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_product_name (product_name),
    INDEX idx_product_model (product_model),
    INDEX idx_serial_number (serial_number),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create monthly financial summaries table (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS financial_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL, -- Format: 2025-01
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    total_expenses DECIMAL(12,2) DEFAULT 0.00,
    gross_profit DECIMAL(12,2) DEFAULT 0.00,
    net_profit DECIMAL(12,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    invoice_count INT DEFAULT 0,
    expense_count INT DEFAULT 0,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_year (month_year),
    INDEX idx_month_year (month_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create budget allocations table
CREATE TABLE IF NOT EXISTS budget_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- Format: 2025-01
    allocated_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_month (category_id, month_year),
    INDEX idx_month_year (month_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default expense categories
INSERT INTO expense_categories (name, name_ar, description, color) VALUES
('Office Rent', 'إيجار المكتب', 'Monthly office rental payments', '#e74c3c'),
('Marketing', 'التسويق', 'Advertising and promotional expenses', '#3498db'),
('Equipment', 'المعدات', 'Computer equipment and tools', '#9b59b6'),
('Utilities', 'المرافق', 'Electricity, internet, phone bills', '#f39c12'),
('Transportation', 'المواصلات', 'Travel and delivery expenses', '#1abc9c'),
('Office Supplies', 'مستلزمات المكتب', 'Stationery and office materials', '#34495e'),
('Professional Services', 'الخدمات المهنية', 'Legal, accounting, consulting fees', '#e67e22'),
('Maintenance', 'الصيانة', 'Equipment maintenance and repairs', '#95a5a6'),
('Insurance', 'التأمين', 'Business insurance premiums', '#2c3e50'),
('Miscellaneous', 'متنوعة', 'Other business expenses', '#7f8c8d');
DELIMITER ;

-- Add foreign key to link invoice items with product costs (optional enhancement)
ALTER TABLE invoice_items ADD COLUMN product_cost_id INT DEFAULT NULL;
ALTER TABLE invoice_items ADD FOREIGN KEY (product_cost_id) REFERENCES product_costs(id) ON DELETE SET NULL;

-- Add calculated profit fields to invoice_items table
ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE invoice_items ADD COLUMN profit_amount DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
        WHEN cost_price IS NOT NULL THEN (amount - cost_price) * quantity
        ELSE NULL 
    END
) STORED;
ALTER TABLE invoice_items ADD COLUMN profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN cost_price IS NOT NULL AND amount > 0 THEN ((amount - cost_price) / amount) * 100
        ELSE NULL 
    END
) STORED; 