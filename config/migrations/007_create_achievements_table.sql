-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('milestone', 'record', 'streak', 'custom') NOT NULL DEFAULT 'milestone',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(100) NOT NULL,
    value INT NOT NULL,
    icon VARCHAR(100) DEFAULT 'fas fa-trophy',
    color VARCHAR(20) DEFAULT '#007553',
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    achievedAt TIMESTAMP NULL,
    createdBy INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_isActive (isActive),
    INDEX idx_achievedAt (achievedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 