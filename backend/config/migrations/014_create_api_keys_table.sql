-- Migration: Create API Keys Table

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL COMMENT 'Human-readable name for the API key',
  api_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed API key',
  key_prefix VARCHAR(20) NOT NULL COMMENT 'Key prefix (e.g., ak_live_, ak_test_)',
  client_id INT NULL COMMENT 'Associated client (optional for client-specific keys)',
  permissions JSON NOT NULL DEFAULT ('{"reports":{"read":true,"write":false,"delete":false},"invoices":{"read":true,"write":false,"delete":false},"clients":{"read":true,"write":false,"delete":false},"financial":{"read":false,"write":false,"delete":false}}'),
  rate_limit INT NOT NULL DEFAULT 1000 COMMENT 'Requests per hour limit',
  expires_at DATETIME NULL COMMENT 'Optional expiration date',
  last_used DATETIME NULL COMMENT 'Last usage timestamp',
  usage_count INT NOT NULL DEFAULT 0 COMMENT 'Total usage count',
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable/disable key',
  created_by INT NOT NULL COMMENT 'Admin who created this key',
  ip_whitelist TEXT NULL COMMENT 'Comma-separated list of allowed IP addresses',
  description TEXT NULL COMMENT 'Description of the API key purpose',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_api_key (api_key),
  INDEX idx_client_id (client_id),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
);
