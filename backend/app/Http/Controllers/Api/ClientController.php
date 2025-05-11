<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Report;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    /**
     * Display a listing of clients.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $clients = Client::active()->orderBy('name', 'asc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $clients
        ]);
    }

    /**
     * Store a newly created client.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $client = Client::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $client,
            'message' => 'تم إنشاء العميل بنجاح'
        ], 201);
    }

    /**
     * Display the specified client.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $client = Client::with('reports')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $client
        ]);
    }

    /**
     * Update the specified client.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $client = Client::findOrFail($id);
        $client->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $client,
            'message' => 'تم تحديث بيانات العميل بنجاح'
        ]);
    }

    /**
     * Remove the specified client.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        
        // Set client to inactive instead of deleting
        $client->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء تنشيط العميل بنجاح'
        ]);
    }

    /**
     * Search for clients by name or phone.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function search(Request $request)
    {
        $query = $request->get('query');
        
        $clients = Client::where('status', 'active')
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $clients
        ]);
    }
    
    /**
     * Get the authenticated client's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function profile(Request $request)
    {
        $client = $request->user();
        
        // Count reports by status
        $reportStats = [
            'total' => Report::where('client_id', $client->id)->count(),
            'completed' => Report::where('client_id', $client->id)->where('status', 'completed')->count(),
            'in_progress' => Report::where('client_id', $client->id)->where('status', 'in-progress')->count(),
            'pending' => Report::where('client_id', $client->id)->where('status', 'pending')->count()
        ];
        
        // Get recent reports
        $recentReports = Report::with(['device'])
            ->where('client_id', $client->id)
            ->orderBy('inspection_date', 'desc')
            ->limit(5)
            ->get();
        
        // Get unpaid invoices
        $unpaidInvoices = Invoice::where('client_id', $client->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'client' => $client,
                'stats' => $reportStats,
                'recent_reports' => $recentReports,
                'unpaid_invoices' => $unpaidInvoices
            ]
        ]);
    }
    
    /**
     * Update the authenticated client's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateProfile(Request $request)
    {
        $client = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'order_code' => 'sometimes|nullable|string|max:50',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Update fields if provided
        if ($request->has('name')) {
            $client->name = $request->name;
        }
        
        if ($request->has('email')) {
            $client->email = $request->email;
        }
        
        if ($request->has('address')) {
            $client->address = $request->address;
        }
        
        if ($request->has('order_code')) {
            $client->order_code = $request->order_code;
        }
        
        $client->save();
        
        return response()->json([
            'success' => true,
            'data' => $client,
            'message' => 'تم تحديث الملف الشخصي بنجاح'
        ]);
    }
}
