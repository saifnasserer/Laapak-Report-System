<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use App\Models\Client;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user if it doesn't exist
        if (!Admin::where('username', 'admin')->exists()) {
            Admin::create([
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'name' => 'Admin User',
                'email' => 'admin@laapak.com',
                'role' => 'admin',
                'last_login' => null
            ]);
            $this->command->info('Admin user created successfully!');
        } else {
            $this->command->info('Admin user already exists.');
        }

        // Create test client if it doesn't exist
        if (!Client::where('phone', '1234567890')->exists()) {
            Client::create([
                'name' => 'Test Client',
                'phone' => '1234567890',
                'email' => 'client@example.com',
                'address' => 'Test Address',
                'order_code' => '123456'
            ]);
            $this->command->info('Test client created successfully!');
        } else {
            $this->command->info('Test client already exists.');
        }
    }
}
