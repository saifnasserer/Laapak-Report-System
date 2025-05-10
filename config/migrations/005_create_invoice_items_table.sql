-- Migration: Create Invoice Items Table

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  type ENUM('laptop', 'item', 'service') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  serial_number VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
