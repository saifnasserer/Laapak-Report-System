-- Create Facebook Ad Spend Table
CREATE TABLE IF NOT EXISTS facebook_ad_spend (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_account_id VARCHAR(50) NOT NULL,
    ad_account_name VARCHAR(100),
    date DATE NOT NULL,
    spend DECIMAL(10, 2) DEFAULT 0.00,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    reach INT DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EGP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_account_date (ad_account_id, date)
);
