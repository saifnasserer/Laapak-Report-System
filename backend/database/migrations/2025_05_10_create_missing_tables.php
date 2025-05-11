<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create devices table if it doesn't exist
        if (!Schema::hasTable('devices')) {
            Schema::create('devices', function (Blueprint $table) {
                $table->id();
                $table->string('model');
                $table->string('brand');
                $table->string('serial_number')->unique();
                $table->string('processor')->nullable();
                $table->string('ram')->nullable();
                $table->string('storage')->nullable();
                $table->string('gpu')->nullable();
                $table->string('battery')->nullable();
                $table->text('additional_details')->nullable();
                $table->timestamps();
            });
            // Table created successfully
        }

        // Create component_tests table if it doesn't exist
        if (!Schema::hasTable('component_tests')) {
            Schema::create('component_tests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('report_id');
                $table->string('component_type');
                $table->string('test_purpose');
                $table->string('test_result'); // pass, warning, fail
                $table->string('screenshot_path')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                
                // No foreign key constraints for now
            });
            // Table created successfully
        }

        // Create external_inspections table if it doesn't exist
        if (!Schema::hasTable('external_inspections')) {
            Schema::create('external_inspections', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('report_id');
                $table->string('inspection_area');
                $table->string('condition'); // good, fair, poor
                $table->string('photo_path')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                
                // No foreign key constraints for now
            });
            // Table created successfully
        }

        // Create report_notes table if it doesn't exist
        if (!Schema::hasTable('report_notes')) {
            Schema::create('report_notes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('report_id');
                $table->text('content');
                $table->string('type')->default('general'); // general, technical, client
                $table->timestamps();
                
                // No foreign key constraints for now
            });
            // Table created successfully
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_notes');
        Schema::dropIfExists('external_inspections');
        Schema::dropIfExists('component_tests');
        Schema::dropIfExists('devices');
    }
};
