<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Client;
use App\Models\Device;
use App\Models\ComponentTest;
use App\Models\ExternalInspection;
use App\Models\ReportNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * Display a listing of reports
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $reports = Report::with(['client', 'technician'])
            ->orderBy('inspection_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true, 
            'data' => $reports
        ]);
    }

    /**
     * Store a newly created report with related data
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Validate main request
        $validator = Validator::make($request->all(), [
            'inspection_date' => 'required|date',
            'client' => 'required|array',
            'device' => 'required|array',
            'component_tests' => 'sometimes|array',
            'external_inspections' => 'sometimes|array',
            'report_notes' => 'sometimes|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Create or update client
            $clientData = $request->input('client');
            $clientValidator = Validator::make($clientData, [
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'email' => 'nullable|email',
            ]);
            
            if ($clientValidator->fails()) {
                return response()->json([
                    'success' => false, 
                    'errors' => ['client' => $clientValidator->errors()]
                ], 422);
            }
            
            // Look for existing client by phone or create new one
            $client = Client::where('phone', $clientData['phone'])->first();
            if (!$client) {
                $client = Client::create($clientData);
            } else {
                $client->update($clientData);
            }
            
            // Create or update device
            $deviceData = $request->input('device');
            $deviceValidator = Validator::make($deviceData, [
                'brand' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'serial_number' => 'required|string|max:255',
                'processor' => 'nullable|string|max:255',
                'ram' => 'nullable|string|max:255',
                'storage' => 'nullable|string|max:255',
                'gpu' => 'nullable|string|max:255',
                'battery' => 'nullable|string|max:255',
            ]);
            
            if ($deviceValidator->fails()) {
                return response()->json([
                    'success' => false, 
                    'errors' => ['device' => $deviceValidator->errors()]
                ], 422);
            }
            
            // Look for existing device by serial number or create new one
            $device = Device::where('serial_number', $deviceData['serial_number'])->first();
            if (!$device) {
                $device = Device::create($deviceData);
            } else {
                $device->update($deviceData);
            }
            
            // Create the report
            $report = new Report([
                'id' => time(), // Use timestamp as ID
                'inspectionDate' => $request->input('inspectionDate'),
                'orderCode' => Report::generateOrderCode(),
                'clientId' => $client->id,
                'deviceModel' => $request->input('deviceModel'),
                'serialNumber' => $request->input('serialNumber'),
                'technicianId' => Auth::id() ?? 1, // Use authenticated user or default to 1 if not available
                'status' => 'pending'
            ]);
            
            $report->save();
            
            // Generate QR code if needed
            $qrCodePath = $report->generateQrCode();
            
            // Process component tests
            if ($request->has('componentTests')) {
                foreach ($request->input('componentTests') as $testData) {
                    $testValidator = Validator::make($testData, [
                        'component_type' => 'required|string|max:50',
                        'test_purpose' => 'required|string|max:255',
                        'test_result' => 'required|string|in:pass,warning,fail',
                        'notes' => 'nullable|string',
                        'screenshot_path' => 'nullable|string',
                    ]);
                    
                    if ($testValidator->fails()) {
                        continue; // Skip invalid tests
                    }
                    
                    $report->componentTests()->create([
                        'component_type' => $testData['component_type'],
                        'test_purpose' => $testData['test_purpose'],
                        'test_result' => $testData['test_result'],
                        'notes' => $testData['notes'] ?? null,
                        'screenshot_path' => $testData['screenshot_path'] ?? null,
                    ]);
                }
            }
            
            // Process external inspections
            if ($request->has('externalInspections')) {
                foreach ($request->input('externalInspections') as $inspectionData) {
                    $inspectionValidator = Validator::make($inspectionData, [
                        'position' => 'required|string|max:50',
                        'image_path' => 'required|string',
                        'description' => 'nullable|string',
                    ]);
                    
                    if ($inspectionValidator->fails()) {
                        continue; // Skip invalid inspections
                    }
                    
                    $report->externalInspections()->create([
                        'position' => $inspectionData['position'],
                        'image_path' => $inspectionData['image_path'],
                        'description' => $inspectionData['description'] ?? null,
                    ]);
                }
            }
            
            // Process report notes
            if ($request->has('reportNotes')) {
                foreach ($request->input('reportNotes') as $noteData) {
                    // Skip empty notes
                    if (empty($noteData['note'])) {
                        continue;
                    }
                    
                    $noteValidator = Validator::make($noteData, [
                        'note' => 'required|string',
                        'priority' => 'required|string|in:low,medium,high',
                    ]);
                    
                    if ($noteValidator->fails()) {
                        continue; // Skip invalid notes
                    }
                    
                    $report->notes()->create([
                        'note' => $noteData['note'],
                        'priority' => $noteData['priority'],
                    ]);
                }
            }
            
            DB::commit();
            
            // Reload report with relationships
            $report = Report::with(['client', 'device', 'user', 'componentTests', 'externalInspections', 'notes'])
                ->findOrFail($report->id);
            
            return response()->json([
                'success' => true, 
                'data' => $report, 
                'message' => 'تم إنشاء التقرير بنجاح'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to create report: ' . $e->getMessage());
            
            return response()->json([
                'success' => false, 
                'message' => 'حدث خطأ أثناء إنشاء التقرير: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified report with all related data
     *
     * @param  string  $identifier
     * @return \Illuminate\Http\Response
     */
    public function show($identifier)
    {
        // Check if the identifier is an order code or an ID
        $isOrderCode = !is_numeric($identifier);
        
        $report = $isOrderCode
            ? Report::where('orderCode', $identifier)->firstOrFail()
            : Report::findOrFail($identifier);
        
        // Load relationships
        $report->load(['client', 'technician', 'componentTests', 'externalInspections', 'notes']);
        
        return response()->json([
            'success' => true, 
            'data' => $report
        ]);
    }

    /**
     * Display a report for public access via QR code
     * 
     * @param  string  $orderNumber
     * @return \Illuminate\Http\Response
     */
    public function publicShow($orderCode)
    {
        $report = Report::where('order_number', $orderCode)
            ->with(['client', 'componentTests', 'externalInspections', 'notes'])
            ->firstOrFail();
        
        return response()->json([
            'success' => true, 
            'data' => $report
        ]);
    }

    /**
     * Update the specified report
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $report = Report::findOrFail($id);
            
            // Update basic report info
            $validator = Validator::make($request->all(), [
                'inspectionDate' => 'required|date',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $report->update([
                'inspectionDate' => $request->input('inspectionDate'),
            ]);
            
            // Update client if provided
            if ($request->has('client')) {
                $clientData = $request->input('client');
                $report->client->update($clientData);
            }
            
            // Update device if provided
            if ($request->has('device')) {
                $deviceData = $request->input('device');
                $report->device->update($deviceData);
            }
            
            // Update component tests if provided
            if ($request->has('componentTests')) {
                // Delete existing tests
                $report->componentTests()->delete();
                
                // Create new tests
                foreach ($request->input('componentTests') as $testData) {
                    $report->componentTests()->create($testData);
                }
            }
            
            // Update external inspections if provided
            if ($request->has('externalInspections')) {
                // Delete existing inspections
                $report->externalInspections()->delete();
                
                // Create new inspections
                foreach ($request->input('externalInspections') as $inspectionData) {
                    $report->externalInspections()->create($inspectionData);
                }
            }
            
            // Update notes if provided
            if ($request->has('reportNotes')) {
                // Delete existing notes
                $report->notes()->delete();
                
                // Create new notes
                foreach ($request->input('reportNotes') as $noteData) {
                    if (!empty($noteData['note'])) {
                        $report->notes()->create($noteData);
                    }
                }
            }
            
            DB::commit();
            
            // Reload report with relationships
            $report = Report::with(['client', 'device', 'user', 'componentTests', 'externalInspections', 'notes'])
                ->findOrFail($report->id);
            
            return response()->json([
                'success' => true, 
                'data' => $report, 
                'message' => 'تم تحديث التقرير بنجاح'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to update report: ' . $e->getMessage());
            
            return response()->json([
                'success' => false, 
                'message' => 'حدث خطأ أثناء تحديث التقرير: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified report
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $report = Report::findOrFail($id);
            
            // Delete all related data (will be handled by foreign key constraints with cascade)
            $report->delete();
            
            return response()->json([
                'success' => true, 
                'message' => 'تم حذف التقرير بنجاح'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to delete report: ' . $e->getMessage());
            
            return response()->json([
                'success' => false, 
                'message' => 'حدث خطأ أثناء حذف التقرير: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Search for reports by various criteria
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function search(Request $request, $query = null)
    {
        $reportQuery = Report::with(['client', 'device']);
        
        // If a direct query parameter is provided (from the /reports/search/{query} route)
        if ($query) {
            $reportQuery->where(function($q) use ($query) {
                $q->where('order_number', 'like', "%{$query}%")
                  ->orWhereHas('client', function($subq) use ($query) {
                      $subq->where('name', 'like', "%{$query}%")
                           ->orWhere('phone', 'like', "%{$query}%");
                  })
                  ->orWhereHas('device', function($subq) use ($query) {
                      $subq->where('model', 'like', "%{$query}%")
                           ->orWhere('serial_number', 'like', "%{$query}%");
                  });
            });
        } else {
            // Search by order number
            if ($request->has('order_number')) {
                $reportQuery->where('order_number', 'like', '%' . $request->input('order_number') . '%');
            }
            
            // Search by client name
            if ($request->has('client_name')) {
                $reportQuery->whereHas('client', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->input('client_name') . '%');
                });
            }
            
            // Search by client phone
            if ($request->has('client_phone')) {
                $reportQuery->whereHas('client', function ($q) use ($request) {
                    $q->where('phone', 'like', '%' . $request->input('client_phone') . '%');
                });
            }
            
            // Search by device serial number
            if ($request->has('serial_number')) {
                $reportQuery->whereHas('device', function ($q) use ($request) {
                    $q->where('serial_number', 'like', '%' . $request->input('serial_number') . '%');
                });
            }
            
            // Search by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $reportQuery->whereBetween('inspection_date', [
                    $request->input('start_date'),
                    $request->input('end_date')
                ]);
            }
        }
        
        // Sort results
        $sortField = $request->input('sort_by', 'inspection_date');
        $sortDirection = $request->input('sort_direction', 'desc');
        $reportQuery->orderBy($sortField, $sortDirection);
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $reports = $reportQuery->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $reports,
            'message' => 'تم البحث بنجاح'
        ]);
    }
    
    /**
     * Get reports for the authenticated client
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function clientReports(Request $request)
    {
        $client = $request->user();
        
        $reports = Report::with(['device', 'componentTests', 'externalInspections'])
            ->where('client_id', $client->id)
            ->orderBy('inspection_date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Get a specific report for the authenticated client
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function clientReport(Request $request, $id)
    {
        $client = $request->user();
        
        $report = Report::with(['device', 'componentTests', 'externalInspections', 'notes'])
            ->where('client_id', $client->id)
            ->where('id', $id)
            ->first();
        
        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'التقرير غير موجود أو ليس لديك صلاحية لعرضه'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }
}
