-- Create Expected Items Table
CREATE TABLE IF NOT EXISTS expected_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('expected_payment', 'work_in_progress', 'inventory_item') NOT NULL COMMENT 'Type of expected item',
    title VARCHAR(255) NOT NULL COMMENT 'Title or name of the item',
    description TEXT COMMENT 'Detailed description',
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Expected amount in EGP',
    expected_date DATE NOT NULL COMMENT 'Expected date for payment/completion',
    from_whom VARCHAR(255) NOT NULL COMMENT 'Client name or source',
    contact VARCHAR(50) COMMENT 'Phone number or contact info',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Current status of the item',
    notes TEXT COMMENT 'Additional notes',
    created_by INT COMMENT 'Admin ID who created this item',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
CREATE INDEX idx_expected_items_type ON expected_items(type);
CREATE INDEX idx_expected_items_status ON expected_items(status);
CREATE INDEX idx_expected_items_expected_date ON expected_items(expected_date);
