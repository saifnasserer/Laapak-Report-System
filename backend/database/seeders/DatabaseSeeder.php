<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run the user seeder first to create admin and client users
        $this->call([
            UserSeeder::class,
            TestDataSeeder::class,
        ]);
    }
}
