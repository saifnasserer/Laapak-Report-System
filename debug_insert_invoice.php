<?php
/**
 * Debug script to directly insert an invoice into the database
 * This bypasses the Node.js API to help identify database connection issues
 */

// Database connection parameters - adjust these to match your configuration
$host = 'localhost';
$db = 'laapak_report_system';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Sample invoice data based on the actual table structure
$invoiceData = [
    'id' => 'INV' . time() . rand(100, 999),
    'reportId' => null, // Link to a report if needed
    'clientId' => 1, // Use an existing client ID
    'date' => date('Y-m-d H:i:s'),
    'subtotal' => 500.00,
    'discount' => 0.00,
    'taxRate' => 10.00,
    'tax' => 50.00,
    'total' => 550.00,
    'paymentStatus' => 'unpaid', // unpaid, partial, paid
    'paymentMethod' => null,
    'paymentDate' => null,
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

// Create DSN
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// Set PDO options
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Output HTML header
echo "<h1>Debug Database Insert - Invoice</h1><pre>";

try {
    echo "Connecting to database...\n";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connected successfully!\n\n";
    
    // Check if invoices table exists
    echo "Checking if invoices table exists...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = '$db' 
            AND table_name = 'invoices'");
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        echo "Invoices table exists.\n\n";
        
        // Check table structure
        echo "Checking table structure...\n";
        $stmt = $pdo->query("DESCRIBE invoices");
        $columns = [];
        while ($row = $stmt->fetch()) {
            $columns[] = $row['Field'];
        }
        echo "Table columns: " . implode(', ', $columns) . "\n\n";
        
        // Prepare SQL statement
        echo "Preparing SQL statement...\n";
        $fields = implode(', ', array_keys($invoiceData));
        $placeholders = implode(', ', array_fill(0, count($invoiceData), '?'));
        $sql = "INSERT INTO invoices ($fields) VALUES ($placeholders)";
        echo "SQL: $sql\n\n";
        
        // Prepare and execute statement
        echo "Executing statement...\n";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute(array_values($invoiceData));
        
        if ($result) {
            echo "SUCCESS! Invoice inserted successfully with ID: " . $invoiceData['id'] . "\n";
            
            // Verify the insertion
            $verifyStmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $verifyStmt->execute([$invoiceData['id']]);
            $insertedInvoice = $verifyStmt->fetch();
            
            if ($insertedInvoice) {
                echo "\nVerified invoice data in database:\n";
                print_r($insertedInvoice);
                
                // Now let's add some invoice items
                echo "\nAdding invoice items...\n";
                
                $invoiceItems = [
                    [
                        'id' => 'ITEM' . time() . rand(100, 999) . '_1',
                        'invoiceId' => $invoiceData['id'],
                        'description' => 'Laptop repair service',
                        'type' => 'service',
                        'amount' => 300.00,
                        'quantity' => 1,
                        'totalAmount' => 300.00,
                        'serialNumber' => null,
                        'created_at' => date('Y-m-d H:i:s')
                    ],
                    [
                        'id' => 'ITEM' . time() . rand(100, 999) . '_2',
                        'invoiceId' => $invoiceData['id'],
                        'description' => 'Replacement parts',
                        'type' => 'item',
                        'amount' => 200.00,
                        'quantity' => 1,
                        'totalAmount' => 200.00,
                        'serialNumber' => 'PART123',
                        'created_at' => date('Y-m-d H:i:s')
                    ]
                ];
                
                foreach ($invoiceItems as $item) {
                    $itemFields = implode(', ', array_keys($item));
                    $itemPlaceholders = implode(', ', array_fill(0, count($item), '?'));
                    $itemSql = "INSERT INTO invoice_items ($itemFields) VALUES ($itemPlaceholders)";
                    
                    $itemStmt = $pdo->prepare($itemSql);
                    $itemResult = $itemStmt->execute(array_values($item));
                    
                    if ($itemResult) {
                        echo "Added invoice item: " . $item['description'] . " with ID: " . $item['id'] . "\n";
                    } else {
                        echo "ERROR: Failed to add invoice item: " . $item['description'] . "\n";
                        print_r($itemStmt->errorInfo());
                    }
                }
            } else {
                echo "\nWARNING: Could not verify the inserted invoice. This is unusual.\n";
            }
        } else {
            echo "ERROR: Failed to insert invoice.\n";
            print_r($stmt->errorInfo());
        }
    } else {
        echo "ERROR: Invoices table does not exist in the database.\n";
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
        echo "\nTable 'invoices' doesn't exist. Make sure the table is created.\n";
    } elseif ($e->getCode() == 1452) {
        echo "\nForeign key constraint failed. Make sure the client_id exists in the clients table.\n";
    }
}

echo "</pre><p><a href='javascript:history.back()'>Go Back</a></p>";
?>
