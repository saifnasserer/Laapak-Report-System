 -- Migration: Create Reports Table

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(50) PRIMARY KEY,
  client_id INT NOT NULL,
  client_name VARCHAR(100),
  client_phone VARCHAR(20),
  client_email VARCHAR(100),
  client_address TEXT,
  order_number VARCHAR(20) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  inspection_date DATETIME NOT NULL,
  hardware_status LONGTEXT,
  external_images LONGTEXT,
  notes TEXT,
  billing_enabled TINYINT(1) DEFAULT 0,
  amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'active') DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
