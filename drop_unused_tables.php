<?php
/**
 * Drop Unused Tables Script
 * This script drops the unused tables for hardware components and external images
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
    
    // Tables to drop
    $tablesToDrop = [
        'report_technical_tests',
        'report_external_inspection'
    ];
    
    foreach ($tablesToDrop as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $tableExists = $stmt->rowCount() > 0;
        
        if ($tableExists) {
            echo "Dropping $table table...\n";
            $pdo->exec("DROP TABLE $table");
            echo "$table table dropped successfully.\n";
        } else {
            echo "$table table does not exist.\n";
        }
    }
    
    echo "Unused tables dropped successfully.\n";
    
} catch (PDOException $e) {
    die("Database operation failed: " . $e->getMessage());
}
