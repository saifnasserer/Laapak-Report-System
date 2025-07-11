-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    type ENUM('reports', 'clients', 'revenue', 'custom') NOT NULL DEFAULT 'reports',
    title VARCHAR(255) NOT NULL,
    target INT NOT NULL,
    current INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'تقرير',
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    isBanner BOOLEAN NOT NULL DEFAULT FALSE,
    period ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
    createdBy INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_year (month, year),
    INDEX idx_type (type),
    INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 