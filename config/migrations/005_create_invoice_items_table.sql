-- Migration: Create Invoice Items Table

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  type ENUM('laptop', 'item', 'service') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 1,
  totalAmount DECIMAL(10,2) NOT NULL,
  serialNumber VARCHAR(255),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
);
