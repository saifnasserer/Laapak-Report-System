-- Migration: Create API Usage Logs Table

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NOT NULL COMMENT 'Reference to api_keys table',
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint accessed',
  method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL COMMENT 'HTTP method used',
  client_ip VARCHAR(45) NOT NULL COMMENT 'Client IP address',
  user_agent TEXT NULL COMMENT 'User agent string',
  response_status INT NOT NULL COMMENT 'HTTP response status code',
  response_time INT NOT NULL COMMENT 'Response time in milliseconds',
  request_size INT NULL COMMENT 'Request size in bytes',
  response_size INT NULL COMMENT 'Response size in bytes',
  error_message TEXT NULL COMMENT 'Error message if request failed',
  request_data JSON NULL COMMENT 'Request data (for debugging, limited size)',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  INDEX idx_api_key_id (api_key_id),
  INDEX idx_endpoint (endpoint),
  INDEX idx_response_status (response_status),
  INDEX idx_created_at (created_at),
  INDEX idx_client_ip (client_ip)
);
