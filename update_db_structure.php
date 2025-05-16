<?php
/**
 * Database Structure Update Script
 * This script checks and updates the database structure to match our new approach
 * where hardware components and external images are stored as JSON in the main reports table
 */

// We'll connect to the database directly using PDO
// No need to load the Node.js database configuration

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
        echo "Reports table does not exist. Creating it...\n";
        
        // Create reports table with JSON columns
        $sql = file_get_contents('config/migrations/001_create_reports_table.sql');
        $pdo->exec($sql);
        
        echo "Reports table created successfully.\n";
    } else {
        echo "Reports table exists. Checking structure...\n";
        
        // Check if reports table has the required JSON columns
        $stmt = $pdo->query("DESCRIBE reports");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $requiredJsonColumns = [
            'system_components',
            'hardware_status',
            'external_images'
        ];
        
        $missingColumns = array_diff($requiredJsonColumns, $columns);
        
        if (!empty($missingColumns)) {
            echo "Adding missing JSON columns to reports table...\n";
            
            // Add missing JSON columns
            foreach ($missingColumns as $column) {
                $pdo->exec("ALTER TABLE reports ADD COLUMN $column JSON");
                echo "Added $column column.\n";
            }
        } else {
            echo "All required JSON columns exist in reports table.\n";
        }
    }
    
    // Check if the separate tables for hardware components and external images exist
    $separateTables = [
        'report_technical_tests',
        'report_external_inspection'
    ];
    
    foreach ($separateTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $tableExists = $stmt->rowCount() > 0;
        
        if ($tableExists) {
            echo "$table table exists. Checking if it's still being used...\n";
            
            // Check if there are any records in the table
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                echo "$table has $count records. We'll keep it for now.\n";
            } else {
                echo "$table is empty. You can safely drop it if you want.\n";
                // Uncomment the line below to automatically drop the table
                // $pdo->exec("DROP TABLE $table");
                // echo "$table dropped successfully.\n";
            }
        } else {
            echo "$table does not exist. No action needed.\n";
        }
    }
    
    echo "Database structure update completed successfully.\n";
    
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
