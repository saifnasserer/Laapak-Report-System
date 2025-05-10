-- Migration: Create Reports Table

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(50) PRIMARY KEY,
  client_id INT NOT NULL,
  order_code VARCHAR(20) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  inspection_date DATE NOT NULL,
  problem_description TEXT,
  diagnosis TEXT,
  solution TEXT,
  notes TEXT,
  has_invoice BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  technician_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES admins(id) ON DELETE SET NULL
);
