<?php

/**
 * Laapak Report System - Laravel Connection Test
 * 
 * Este script prueba la conexión a la base de datos MySQL utilizando Laravel
 * y verifica que los modelos estén configurados correctamente.
 */

// Cargar el autoloader de Composer
require __DIR__ . '/vendor/autoload.php';

// No cargamos variables de entorno ya que estamos configurando la base de datos directamente
// $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
// $dotenv->load();

// Configurar la conexión a la base de datos directamente (sin depender de .env)
$database = [
    'driver' => 'mysql',
    'host' => '127.0.0.1',
    'port' => '3306',
    'database' => 'laapak_report_system',  // Mismo nombre que en Node.js
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
];

// Crear una nueva instancia de Illuminate Database
$capsule = new Illuminate\Database\Capsule\Manager;
$capsule->addConnection($database);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// Función para imprimir resultados en formato legible
function printResult($title, $result) {
    echo "\n=== $title ===\n";
    if (is_array($result) || is_object($result)) {
        print_r($result);
    } else {
        echo $result . "\n";
    }
    echo "===================\n";
}

// Probar la conexión a la base de datos
try {
    // Mostrar la configuración de la base de datos (sin la contraseña)
    $config = $database;
    unset($config['password']);
    printResult('Configuración de la base de datos', $config);
    
    // Intentar conectar
    $result = $capsule->getConnection()->select('SELECT 1 as result');
    printResult('Conexión a la base de datos', 'Exitosa');
} catch (Exception $e) {
    printResult('Error de conexión a la base de datos', $e->getMessage());
    
    // Sugerir soluciones comunes
    echo "\nPosibles soluciones:\n";
    echo "1. Asegúrate de que el servidor MySQL esté en ejecución\n";
    echo "2. Verifica que la base de datos 'laapak_report_system' exista\n";
    echo "3. Comprueba que el usuario 'root' tenga acceso a la base de datos\n";
    echo "4. Si la base de datos no existe, créala con: CREATE DATABASE laapak_report_system;\n";
    
    exit(1);
}

// Importar modelos
use App\Models\Admin;
use App\Models\Client;
use App\Models\Report;
use App\Models\Device;
use App\Models\Invoice;

// Probar consultas básicas en cada modelo
try {
    // Contar registros en cada tabla
    $adminCount = Admin::count();
    $clientCount = Client::count();
    $reportCount = Report::count();
    $deviceCount = Device::count();
    $invoiceCount = Invoice::count();
    
    printResult('Conteo de registros', [
        'Admins' => $adminCount,
        'Clients' => $clientCount,
        'Reports' => $reportCount,
        'Devices' => $deviceCount,
        'Invoices' => $invoiceCount,
    ]);
    
    // Obtener un cliente con sus reportes (si existe alguno)
    if ($clientCount > 0) {
        $client = Client::with('reports')->first();
        printResult('Cliente con reportes', [
            'ID' => $client->id,
            'Nombre' => $client->name,
            'Teléfono' => $client->phone,
            'Número de reportes' => count($client->reports),
        ]);
    }
    
    // Obtener un reporte con sus componentes (si existe alguno)
    if ($reportCount > 0) {
        $report = Report::with(['client', 'device', 'componentTests', 'externalInspections'])->first();
        printResult('Reporte con relaciones', [
            'ID' => $report->id,
            'Número de orden' => $report->order_number,
            'Cliente' => $report->client ? $report->client->name : 'N/A',
            'Dispositivo' => $report->device ? $report->device->model : 'N/A',
            'Pruebas técnicas' => count($report->componentTests),
            'Inspecciones externas' => count($report->externalInspections),
        ]);
    }
    
    echo "\n¡Todas las pruebas completadas con éxito!\n";
    
} catch (Exception $e) {
    printResult('Error al consultar modelos', $e->getMessage());
    exit(1);
}
