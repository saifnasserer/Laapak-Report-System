<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Device;
use App\Models\Report;
use App\Models\Client;
use App\Models\Admin;
use App\Models\ComponentTest;
use App\Models\ExternalInspection;
use App\Models\ReportNote;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing clients and admins
        $client = Client::first();
        $admin = Admin::first();
        
        if (!$client || !$admin) {
            $this->command->error('No clients or admins found. Please run migrations first.');
            return;
        }
        
        // Create test devices
        $devices = [
            [
                'brand' => 'Apple',
                'model' => 'MacBook Pro 16"',
                'serial_number' => 'MBPRO2023001',
                'processor' => 'Apple M2 Pro',
                'ram' => '16GB',
                'storage' => '512GB SSD',
                'gpu' => 'Integrated',
                'battery' => '100Wh',
                'additional_details' => 'Space Gray, 2023 model'
            ],
            [
                'brand' => 'Dell',
                'model' => 'XPS 15',
                'serial_number' => 'XPS15202301',
                'processor' => 'Intel Core i7-12700H',
                'ram' => '32GB',
                'storage' => '1TB SSD',
                'gpu' => 'NVIDIA RTX 3050 Ti',
                'battery' => '86Wh',
                'additional_details' => 'Silver, 2023 model'
            ],
            [
                'brand' => 'Lenovo',
                'model' => 'ThinkPad X1 Carbon',
                'serial_number' => 'TPX1C202301',
                'processor' => 'Intel Core i5-1240P',
                'ram' => '16GB',
                'storage' => '512GB SSD',
                'gpu' => 'Intel Iris Xe',
                'battery' => '57Wh',
                'additional_details' => 'Black, 2023 model'
            ]
        ];
        
        $this->command->info('Creating test devices...');
        
        foreach ($devices as $deviceData) {
            // Check if device already exists
            if (!Device::where('serial_number', $deviceData['serial_number'])->exists()) {
                Device::create($deviceData);
            }
        }
        
        // Get the created devices
        $device1 = Device::where('serial_number', 'MBPRO2023001')->first();
        $device2 = Device::where('serial_number', 'XPS15202301')->first();
        $device3 = Device::where('serial_number', 'TPX1C202301')->first();
        
        // Create test reports if they don't exist
        $reports = [
            [
                'id' => 1001, // Explicitly set ID
                'order_number' => 'LAP-2023-001',
                'client_id' => $client->id,
                'device_id' => $device1->id,
                'user_id' => $admin->id,
                'inspection_date' => now()->subDays(5),
                'status' => 'completed'
            ],
            [
                'id' => 1002, // Explicitly set ID
                'order_number' => 'LAP-2023-002',
                'client_id' => $client->id,
                'device_id' => $device2->id,
                'user_id' => $admin->id,
                'inspection_date' => now()->subDays(3),
                'status' => 'in-progress'
            ],
            [
                'id' => 1003, // Explicitly set ID
                'order_number' => 'LAP-2023-003',
                'client_id' => $client->id,
                'device_id' => $device3->id,
                'user_id' => $admin->id,
                'inspection_date' => now()->subDay(),
                'status' => 'pending'
            ]
        ];
        
        $this->command->info('Creating test reports...');
        
        $createdReports = [];
        foreach ($reports as $reportData) {
            // Check if report already exists
            if (!Report::where('order_number', $reportData['order_number'])->exists()) {
                $report = Report::create($reportData);
                $createdReports[] = $report;
            }
        }
        
        if (count($createdReports) > 0) {
            $this->command->info('Created ' . count($createdReports) . ' new reports. Creating related data...');
            
            foreach ($createdReports as $report) {
                $componentTests = [
                    [
                        'report_id' => $report->id,
                        'component_type' => 'CPU',
                        'test_purpose' => 'Performance Test',
                        'test_result' => 'pass',
                        'notes' => 'CPU performing as expected'
                    ],
                    [
                        'report_id' => $report->id,
                        'component_type' => 'RAM',
                        'test_purpose' => 'Memory Test',
                        'test_result' => 'pass',
                        'notes' => 'Memory modules functioning correctly'
                    ],
                    [
                        'report_id' => $report->id,
                        'component_type' => 'Storage',
                        'test_purpose' => 'Disk Health',
                        'test_result' => 'warning',
                        'notes' => 'Some bad sectors detected, recommend backup'
                    ],
                    [
                        'report_id' => $report->id,
                        'component_type' => 'Battery',
                        'test_purpose' => 'Battery Health',
                        'test_result' => 'pass',
                        'notes' => 'Battery health at 92%'
                    ]
                ];
                
                foreach ($componentTests as $testData) {
                    ComponentTest::create($testData);
                }
                
                // Create external inspections
                $externalInspections = [
                    [
                        'report_id' => $report->id,
                        'inspection_area' => 'Screen',
                        'condition' => 'good',
                        'notes' => 'No scratches or dead pixels'
                    ],
                    [
                        'report_id' => $report->id,
                        'inspection_area' => 'Keyboard',
                        'condition' => 'good',
                        'notes' => 'All keys functioning properly'
                    ],
                    [
                        'report_id' => $report->id,
                        'inspection_area' => 'Chassis',
                        'condition' => 'fair',
                        'notes' => 'Minor scratches on bottom case'
                    ],
                    [
                        'report_id' => $report->id,
                        'inspection_area' => 'Ports',
                        'condition' => 'good',
                        'notes' => 'All ports functioning correctly'
                    ]
                ];
                
                foreach ($externalInspections as $inspectionData) {
                    ExternalInspection::create($inspectionData);
                }
                
                // Create report notes
                $reportNotes = [
                    [
                        'report_id' => $report->id,
                        'content' => 'Device was received in good condition',
                        'type' => 'general'
                    ],
                    [
                        'report_id' => $report->id,
                        'content' => 'Recommend updating system software to latest version',
                        'type' => 'technical'
                    ],
                    [
                        'report_id' => $report->id,
                        'content' => 'Client requested priority service',
                        'type' => 'client'
                    ]
                ];
                
                foreach ($reportNotes as $noteData) {
                    ReportNote::create($noteData);
                }
            }
        } else {
            $this->command->info('No new reports created, skipping related data creation.');
        }
        
        $this->command->info('Test data seeded successfully!');
    }
}
