<?php

/**
 * Laapak Report System - Laravel Model Test
 * 
 * This script creates a simple Artisan command to test our models
 */

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
        
        // Count records in each table
        $this->info("\nCounting records in tables:");
        $this->countRecords('Admin', Admin::class);
        $this->countRecords('Client', Client::class);
        $this->countRecords('Report', Report::class);
        $this->countRecords('Device', Device::class);
        $this->countRecords('Invoice', Invoice::class);
        $this->countRecords('ComponentTest', ComponentTest::class);
        $this->countRecords('ExternalInspection', ExternalInspection::class);
        $this->countRecords('ReportNote', ReportNote::class);
        $this->countRecords('InvoiceItem', InvoiceItem::class);
        
        // Create test data if tables are empty
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
        
        // Test relationships if data exists
        if (Admin::count() > 0 && Client::count() > 0) {
            $this->info("\nTesting model relationships...");
            
            $admin = Admin::first();
            $client = Client::first();
            
            $this->info("Admin: {$admin->name} (ID: {$admin->id})");
            $this->info("Client: {$client->name} (ID: {$client->id})");
            
            // Test if we can create a device
            if (Device::count() === 0) {
                $device = Device::create([
                    'brand' => 'Test Brand',
                    'model' => 'Test Model',
                    'serial_number' => 'SN12345',
                    'processor' => 'Intel i7',
                    'ram' => '16GB',
                    'storage' => '512GB SSD',
                ]);
                $this->info('✓ Test device created');
            } else {
                $device = Device::first();
                $this->info("Device: {$device->brand} {$device->model} (ID: {$device->id})");
            }
            
            // Test if we can create a report
            if (Report::count() === 0) {
                $report = Report::create([
                    'order_number' => 'LAP-' . date('Y') . '-001',
                    'client_id' => $client->id,
                    'device_id' => $device->id,
                    'user_id' => $admin->id,
                    'inspection_date' => now(),
                    'status' => 'completed',
                ]);
                $this->info('✓ Test report created');
            } else {
                $report = Report::first();
                $this->info("Report: {$report->order_number} (ID: {$report->id})");
            }
            
            // Test loading relationships
            $report = Report::with(['client', 'device'])->first();
            if ($report->client && $report->device) {
                $this->info('✓ Report relationships loaded successfully');
                $this->info("  - Client: {$report->client->name}");
                $this->info("  - Device: {$report->device->brand} {$report->device->model}");
            } else {
                $this->error('✗ Failed to load report relationships');
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
}
