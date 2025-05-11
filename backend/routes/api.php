<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ComponentTestController;
use App\Http\Controllers\Api\ExternalInspectionController;
use App\Http\Controllers\Api\ReportNoteController;
use App\Http\Controllers\Api\InvoiceController;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Laapak Report System API is running',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0'
    ]);
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('admin', [AuthController::class, 'adminLogin']);
    Route::post('client', [AuthController::class, 'clientLogin']);
    
    // Protected auth routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('verify', [AuthController::class, 'verify']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Admin API Routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Admin-only routes (requires 'admin' role)
    Route::middleware(['ability:admin'])->group(function () {
        // User management
        Route::get('users', [AdminController::class, 'listUsers']);
        Route::post('users', [AdminController::class, 'createUser']);
        Route::put('users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('users/{id}', [AdminController::class, 'deleteUser']);
    });
    
    // Admin and technician routes
    Route::middleware(['abilities:admin,technician'])->group(function () {
        // Full access to clients
        Route::get('clients', [ClientController::class, 'index']);
        Route::post('clients', [ClientController::class, 'store']);
        Route::put('clients/{id}', [ClientController::class, 'update']);
        Route::delete('clients/{id}', [ClientController::class, 'destroy']);
        
        // Full access to reports
        Route::post('reports', [ReportController::class, 'store']);
        Route::put('reports/{id}', [ReportController::class, 'update']);
        Route::delete('reports/{id}', [ReportController::class, 'destroy']);
        
        // Full access to invoices
        Route::post('invoices', [InvoiceController::class, 'store']);
        Route::put('invoices/{id}', [InvoiceController::class, 'update']);
        Route::delete('invoices/{id}', [InvoiceController::class, 'destroy']);
        Route::put('invoices/{id}/payment', [InvoiceController::class, 'updatePayment']);
    });
    
    // All admin roles (admin, technician, viewer)
    // Read-only access for viewers
    Route::get('clients/{id}', [ClientController::class, 'show']);
    Route::get('clients/search', [ClientController::class, 'search']);
    Route::get('reports', [ReportController::class, 'index']);
    Route::get('reports/{id}', [ReportController::class, 'show']);
    Route::get('reports/search/{query}', [ReportController::class, 'search']);
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{id}', [InvoiceController::class, 'show']);
    
    // Devices
    Route::get('devices', [DeviceController::class, 'index']);
    Route::get('devices/{id}', [DeviceController::class, 'show']);
    Route::middleware(['abilities:admin,technician'])->group(function () {
        Route::post('devices', [DeviceController::class, 'store']);
        Route::put('devices/{id}', [DeviceController::class, 'update']);
        Route::delete('devices/{id}', [DeviceController::class, 'destroy']);
    });
    
    // Component Tests and External Inspections
    Route::middleware(['abilities:admin,technician'])->group(function () {
        Route::post('component-tests', [ComponentTestController::class, 'store']);
        Route::delete('component-tests/{id}', [ComponentTestController::class, 'destroy']);
        Route::post('external-inspections', [ExternalInspectionController::class, 'store']);
        Route::delete('external-inspections/{id}', [ExternalInspectionController::class, 'destroy']);
        Route::post('report-notes', [ReportNoteController::class, 'store']);
        Route::delete('report-notes/{id}', [ReportNoteController::class, 'destroy']);
    });
});

// Client API Routes
Route::middleware(['auth:sanctum'])->prefix('client')->group(function () {
    // Client can only access their own data
    Route::get('profile', [ClientController::class, 'profile']);
    Route::put('profile', [ClientController::class, 'updateProfile']);
    Route::get('reports', [ReportController::class, 'clientReports']);
    Route::get('reports/{id}', [ReportController::class, 'clientReport']);
    Route::get('invoices', [InvoiceController::class, 'clientInvoices']);
    Route::get('invoices/{id}', [InvoiceController::class, 'clientInvoice']);
});

// Health check route (public)
Route::get('health', function () {
    \Illuminate\Support\Facades\Log::info('Health check route accessed');
    return response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]);
});

// Test route for debugging
Route::get('test', function () {
    \Illuminate\Support\Facades\Log::info('Test route accessed');
    return response()->json([
        'status' => 'API is working',
        'time' => now()->toIso8601String(),
        'server' => 'Laravel ' . app()->version()
    ]);
});

// Public routes (if needed, e.g., for report viewing by QR)
Route::get('public/report/{orderCode}', [ReportController::class, 'publicShow']);

