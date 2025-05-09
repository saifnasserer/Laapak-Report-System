

// Laapak Report System API Routes
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ComponentTestController;
use App\Http\Controllers\Api\ExternalInspectionController;
use App\Http\Controllers\Api\ReportNoteController;

// API Routes for Laapak Report System
Route::middleware('auth:sanctum')->group(function () {
    // Clients
    Route::get('clients', [ClientController::class, 'index']);
    Route::post('clients', [ClientController::class, 'store']);
    Route::get('clients/{id}', [ClientController::class, 'show']);
    Route::put('clients/{id}', [ClientController::class, 'update']);
    Route::delete('clients/{id}', [ClientController::class, 'destroy']);
    Route::get('clients/search', [ClientController::class, 'search']);

    // Devices
    Route::get('devices', [DeviceController::class, 'index']);
    Route::post('devices', [DeviceController::class, 'store']);
    Route::get('devices/{id}', [DeviceController::class, 'show']);
    Route::put('devices/{id}', [DeviceController::class, 'update']);
    Route::delete('devices/{id}', [DeviceController::class, 'destroy']);

    // Reports
    Route::get('reports', [ReportController::class, 'index']);
    Route::post('reports', [ReportController::class, 'store']);
    Route::get('reports/{id}', [ReportController::class, 'show']);
    Route::put('reports/{id}', [ReportController::class, 'update']);
    Route::delete('reports/{id}', [ReportController::class, 'destroy']);

    // Component Tests
    Route::post('component-tests', [ComponentTestController::class, 'store']);
    Route::delete('component-tests/{id}', [ComponentTestController::class, 'destroy']);

    // External Inspections
    Route::post('external-inspections', [ExternalInspectionController::class, 'store']);
    Route::delete('external-inspections/{id}', [ExternalInspectionController::class, 'destroy']);

    // Report Notes
    Route::post('report-notes', [ReportNoteController::class, 'store']);
    Route::delete('report-notes/{id}', [ReportNoteController::class, 'destroy']);
});

// Public routes (if needed, e.g., for report viewing by QR)
// Route::get('public/report/{order_number}', [ReportController::class, 'publicShow']);

