<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Admin;
use App\Models\Client;
use App\Models\Report;
use App\Models\Device;
use App\Models\Invoice;
use App\Models\ComponentTest;
use App\Models\ExternalInspection;
use App\Models\ReportNote;
use App\Models\InvoiceItem;

class TestModelsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:models';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test all models and their relationships';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing database connection and models...');
        
        // Test database connection
        try {
            \DB::connection()->getPdo();
            $this->info('✓ Database connection successful: ' . \DB::connection()->getDatabaseName());
        } catch (\Exception $e) {
            $this->error('✗ Database connection failed: ' . $e->getMessage());
            return 1;
        }
        
        // Check which tables exist in the database
        $this->info("\nChecking database tables:");
        $tables = $this->getExistingTables();
        
        foreach ($tables as $table) {
            $this->info("✓ Table exists: {$table}");
        }
        
        // Count records in existing tables
        $this->info("\nCounting records in tables:");
        
        if (in_array('admins', $tables)) {
            $this->countRecords('Admin', Admin::class);
            
            // Create test admin if table is empty
            if (Admin::count() === 0) {
                $this->info("\nCreating test admin user...");
                Admin::create([
                    'username' => 'admin',
                    'password' => bcrypt('admin123'),
                    'name' => 'Administrator',
                    'role' => 'admin',
                    'email' => 'admin@example.com',
                ]);
                $this->info('✓ Test admin user created');
            }
        } else {
            $this->warn('✗ Table not found: admins');
        }
        
        if (in_array('clients', $tables)) {
            $this->countRecords('Client', Client::class);
            
            // Create test client if table is empty
            if (Client::count() === 0) {
                $this->info("\nCreating test client...");
                Client::create([
                    'name' => 'Test Client',
                    'phone' => '1234567890',
                    'email' => 'client@example.com',
                    'order_code' => '123456',
                    'address' => 'Test Address',
                    'status' => 'active',
                ]);
                $this->info('✓ Test client created');
            }
        } else {
            $this->warn('✗ Table not found: clients');
        }
        
        if (in_array('invoices', $tables)) {
            $this->countRecords('Invoice', Invoice::class);
        } else {
            $this->warn('✗ Table not found: invoices');
        }
        
        if (in_array('invoice_items', $tables)) {
            $this->countRecords('InvoiceItem', InvoiceItem::class);
        } else {
            $this->warn('✗ Table not found: invoice_items');
        }
        
        // These tables might not exist yet, so we'll check them conditionally
        if (in_array('reports', $tables)) {
            $this->countRecords('Report', Report::class);
        } else {
            $this->warn('✗ Table not found: reports');
        }
        
        if (in_array('devices', $tables)) {
            $this->countRecords('Device', Device::class);
        } else {
            $this->warn('✗ Table not found: devices');
        }
        
        if (in_array('component_tests', $tables)) {
            $this->countRecords('ComponentTest', ComponentTest::class);
        } else {
            $this->warn('✗ Table not found: component_tests');
        }
        
        if (in_array('external_inspections', $tables)) {
            $this->countRecords('ExternalInspection', ExternalInspection::class);
        } else {
            $this->warn('✗ Table not found: external_inspections');
        }
        
        if (in_array('report_notes', $tables)) {
            $this->countRecords('ReportNote', ReportNote::class);
        } else {
            $this->warn('✗ Table not found: report_notes');
        }
        
        // Test relationships if data exists and tables are available
        if (in_array('admins', $tables) && in_array('clients', $tables) && Admin::count() > 0 && Client::count() > 0) {
            $this->info("\nTesting basic model data:");
            
            $admin = Admin::first();
            $client = Client::first();
            
            $this->info("Admin: {$admin->name} (ID: {$admin->id})");
            $this->info("Client: {$client->name} (ID: {$client->id})");
            
            // Test relationships if reports table exists
            if (in_array('reports', $tables) && Report::count() > 0) {
                $this->info("\nTesting relationships:");
                try {
                    $report = Report::with(['client'])->first();
                    $this->info("Report: {$report->orderCode} (ID: {$report->id})");
                    
                    if ($report->client) {
                        $this->info("  - Client: {$report->client->name}");
                    }
                    
                    $this->info("  - Device: {$report->deviceModel} (S/N: {$report->serialNumber})");
                } catch (\Exception $e) {
                    $this->error("✗ Error testing relationships: " . $e->getMessage());
                }
            }
        }
        
        $this->info("\nAll tests completed successfully!");
        return 0;
    }
    
    /**
     * Count records in a table and display the result
     */
    private function countRecords($modelName, $modelClass)
    {
        try {
            $count = $modelClass::count();
            $this->info("✓ {$modelName}: {$count} records");
        } catch (\Exception $e) {
            $this->error("✗ {$modelName}: Error - " . $e->getMessage());
        }
    }
    
    /**
     * Get a list of existing tables in the database
     */
    private function getExistingTables()
    {
        $tables = [];
        
        // Get all tables from the database
        $results = \DB::select('SHOW TABLES');
        
        // Extract table names from the results
        foreach ($results as $result) {
            $tables[] = array_values((array) $result)[0];
        }
        
        return $tables;
    }
}
