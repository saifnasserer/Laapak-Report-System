<?php
/**
 * Debug script to directly insert a report into the database
 * This bypasses the Node.js API to help identify database connection issues
 */

// Database connection parameters - adjust these to match your configuration
$host = 'localhost';
$db = 'laapak_report_system';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Sample report data based on the provided object
$reportData = [
    'id' => 'LPK123' . time() . rand(100, 999),
    'client_id' => 1,
    'client_name' => 'محمود ناصر محمود',
    'client_phone' => '01120352162',
    'client_email' => '',   
    'client_address' => 'التحرير',
    'order_number' => '203',
    'device_model' => 'xx',
    'serial_number' => 'c',
    'inspection_date' => date('Y-m-d H:i:s'), // Current date/time in MySQL format
    'hardware_status' => '[{"componentName":"camera_status","status":"working"},{"componentName":"speakers_status","status":"working"},{"componentName":"microphone_status","status":"working"},{"componentName":"wifi_status","status":"working"},{"componentName":"lan_status","status":"working"},{"componentName":"usb_status","status":"working"},{"componentName":"keyboard_status","status":"working"},{"componentName":"touchpad_status","status":"working"},{"componentName":"card_reader_status","status":"working"},{"componentName":"audio_jack_status","status":"working"},{"componentName":"hdmi_status","status":"not_tested"},{"componentName":"power_status","status":"not_tested"},{"componentName":"cpuStatus","status":"not_tested"},{"componentName":"gpuStatus","status":"not_tested"},{"componentName":"ramStatus","status":"not_tested"},{"componentName":"storageStatus","status":"not_tested"},{"componentName":"batteryStatus","status":"not_tested"},{"componentName":"screenStatus","status":"not_tested"}]',
    'external_images' => null,
    'notes' => '',
    'billing_enabled' => 0, // false in PHP/MySQL is 0
    'amount' => 0,
    'status' => 'active',
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

// Create DSN
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// Set PDO options
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// Output header
echo "<h1>Debug Database Insert</h1>";
echo "<pre>";

try {
    // Create PDO instance
    echo "Connecting to database...\n";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connected successfully!\n\n";
    
    // First, check if the reports table exists
    echo "Checking if reports table exists...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'reports'");
    if ($stmt->rowCount() === 0) {
        throw new Exception("The 'reports' table does not exist in the database!");
    }
    echo "Reports table exists.\n\n";
    
    // Check table structure
    echo "Checking table structure...\n";
    $stmt = $pdo->query("DESCRIBE reports");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Table columns: " . implode(", ", $columns) . "\n\n";
    
    // Prepare SQL statement
    echo "Preparing SQL statement...\n";
    $sql = "INSERT INTO reports (";
    $sql .= implode(", ", array_keys($reportData));
    $sql .= ") VALUES (";
    $sql .= implode(", ", array_fill(0, count($reportData), "?"));
    $sql .= ")";
    
    echo "SQL: $sql\n\n";
    
    // Prepare and execute statement
    echo "Executing statement...\n";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute(array_values($reportData));
    
    if ($result) {
        echo "SUCCESS! Report inserted successfully with ID: " . $reportData['id'] . "\n";
        
        // Verify the insertion
        $verifyStmt = $pdo->prepare("SELECT * FROM reports WHERE id = ?");
        $verifyStmt->execute([$reportData['id']]);
        $insertedReport = $verifyStmt->fetch();
        
        if ($insertedReport) {
            echo "\nVerified report data in database:\n";
            print_r($insertedReport);
        } else {
            echo "\nWARNING: Could not verify the inserted report. This is unusual.\n";
        }
    } else {
        echo "ERROR: Failed to insert report.\n";
        print_r($stmt->errorInfo());
    }
    
} catch (PDOException $e) {
    echo "DATABASE ERROR: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    
    // Additional debugging for common errors
    if ($e->getCode() == 1045) {
        echo "\nThis appears to be an authentication error. Check your username and password.\n";
    } elseif ($e->getCode() == 1049) {
        echo "\nThe database '$db' does not exist. Please create it first.\n";
    } elseif ($e->getCode() == 2002) {
        echo "\nCould not connect to the MySQL server. Make sure MySQL is running.\n";
    } elseif ($e->getCode() == 1146) {
        echo "\nThe 'reports' table does not exist. You need to create the table first.\n";
    } elseif ($e->getCode() == 1054) {
        echo "\nUnknown column error. The table structure doesn't match the data you're trying to insert.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "</pre>";
echo "<p><a href='javascript:history.back()'>Go Back</a></p>";
?>
