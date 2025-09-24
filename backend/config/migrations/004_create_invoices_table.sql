-- Migration: Create Invoices Table

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(255) PRIMARY KEY,
  reportId VARCHAR(255),
  clientId INT NOT NULL,
  date DATETIME NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  taxRate DECIMAL(5,2) DEFAULT 14.00,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  paymentStatus ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  paymentMethod VARCHAR(255),
  paymentDate DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE SET NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
);
