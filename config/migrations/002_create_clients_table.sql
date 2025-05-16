-- Migration: Create Clients Table

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL UNIQUE,
  orderCode VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
