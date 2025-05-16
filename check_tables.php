<?php
// Database connection parameters
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'laapak_report_system';

// Connect to database
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Connected to database successfully\n\n";

// Get all tables
$tables_query = "SHOW TABLES";
$tables_result = $conn->query($tables_query);

if ($tables_result->num_rows > 0) {
    echo "Tables in database:\n";
    while($table = $tables_result->fetch_array()) {
        $table_name = $table[0];
        echo "- $table_name\n";
        
        // Get columns for each table
        $columns_query = "DESCRIBE $table_name";
        $columns_result = $conn->query($columns_query);
        
        if ($columns_result->num_rows > 0) {
            echo "  Columns:\n";
            while($column = $columns_result->fetch_assoc()) {
                echo "    - " . $column['Field'] . " (" . $column['Type'] . ")" . 
                     ($column['Key'] == 'PRI' ? " PRIMARY KEY" : "") . 
                     ($column['Null'] == 'NO' ? " NOT NULL" : "") . "\n";
            }
        }
        echo "\n";
    }
} else {
    echo "No tables found in database\n";
}

$conn->close();
?>
