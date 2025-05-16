<?php
/**
 * Update Database Schema to Match Actual Form Fields
 * This script updates the database schema to match the fields we're actually collecting in the form
 */

// Connect to the database directly using PDO
try {
    // Get database credentials from environment variables or use defaults
    $host = getenv('DB_HOST') ?: 'localhost';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';
    $dbname = getenv('DB_NAME') ?: 'laapak_report_system';
    
    // Create PDO connection
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "Connected to database successfully.\n";
    
    // Check if reports table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'reports'");
    $reportsTableExists = $stmt->rowCount() > 0;
    
    if (!$reportsTableExists) {
        echo "Reports table does not exist. Creating it with only necessary fields...\n";
        
        // Create reports table with only necessary fields
        $sql = "
        CREATE TABLE IF NOT EXISTS reports (
          -- Basic Information
          id VARCHAR(50) PRIMARY KEY,
          client_id INT NOT NULL,
          client_name VARCHAR(100),
          client_phone VARCHAR(20),
          client_email VARCHAR(100),
          client_address TEXT,
          order_number VARCHAR(20) NOT NULL,
          device_model VARCHAR(100) NOT NULL,
          serial_number VARCHAR(100),
          inspection_date DATE NOT NULL,
          
          -- Hardware Status (stored as JSON)
          hardware_status JSON,
          
          -- External Images (stored as JSON array of image paths)
          external_images JSON,
          
          -- Notes
          notes TEXT,
          
          -- Billing Information
          billing_enabled BOOLEAN DEFAULT FALSE,
          amount DECIMAL(10,2) DEFAULT 0,
          
          -- Status and Metadata
          status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'active') DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- Foreign Keys
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )";
        
        $pdo->exec($sql);
        
        echo "Reports table created successfully with only necessary fields.\n";
    } else {
        echo "Reports table exists. Checking for unused columns...\n";
        
        // Check for unused columns
        $unusedColumns = [
            'problem_description',
            'diagnosis',
            'solution',
            'technician_id',
            'system_components'
        ];
        
        foreach ($unusedColumns as $column) {
            // Check if column exists
            $stmt = $pdo->query("SHOW COLUMNS FROM reports LIKE '$column'");
            $columnExists = $stmt->rowCount() > 0;
            
            if ($columnExists) {
                echo "Column '$column' exists but is not used in the form. Do you want to remove it? (y/n): ";
                $handle = fopen("php://stdin", "r");
                $line = fgets($handle);
                if (trim($line) == 'y') {
                    $pdo->exec("ALTER TABLE reports DROP COLUMN $column");
                    echo "Column '$column' removed successfully.\n";
                } else {
                    echo "Column '$column' kept in the schema.\n";
                }
                fclose($handle);
            }
        }
        
        // Check for required columns
        $requiredColumns = [
            'hardware_status' => 'JSON',
            'external_images' => 'JSON'
        ];
        
        foreach ($requiredColumns as $column => $type) {
            $stmt = $pdo->query("SHOW COLUMNS FROM reports LIKE '$column'");
            $columnExists = $stmt->rowCount() > 0;
            
            if (!$columnExists) {
                echo "Adding required column '$column' of type $type...\n";
                $pdo->exec("ALTER TABLE reports ADD COLUMN $column $type");
                echo "Column '$column' added successfully.\n";
            }
        }
    }
    
    echo "Database schema update completed successfully.\n";
    
} catch (PDOException $e) {
    die("Database operation failed: " . $e->getMessage());
}
