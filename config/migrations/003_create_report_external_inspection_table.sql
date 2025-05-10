-- Migration: Create Report External Inspection Table

CREATE TABLE IF NOT EXISTS report_external_inspection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL,
  component_name VARCHAR(50) NOT NULL,
  condition_status VARCHAR(20) NOT NULL,
  notes TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
