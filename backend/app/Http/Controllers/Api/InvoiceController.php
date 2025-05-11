<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Report;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the invoices.
     */
    public function index(Request $request)
    {
        $query = Invoice::with(['client', 'report', 'invoiceItems']);
        
        // Filter by client if provided
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $invoices = $query->orderBy('created_at', 'desc')->paginate(10);
        
        return response()->json($invoices);
    }

    /**
     * Store a newly created invoice.
     */
    public function store(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'report_id' => 'nullable|exists:reports,id',
            'due_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:laptop,item,service',
            'items.*.description' => 'required|string',
            'items.*.amount' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.serial_number' => 'nullable|string',
        ]);
        
        try {
            DB::beginTransaction();
            
            // Generate invoice ID (e.g., INV123456)
            $invoiceId = 'INV' . date('Y') . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
            
            // Calculate total amount
            $totalAmount = 0;
            foreach ($request->items as $item) {
                $totalAmount += $item['amount'] * $item['quantity'];
            }
            
            // Create invoice
            $invoice = Invoice::create([
                'id' => $invoiceId,
                'client_id' => $request->client_id,
                'report_id' => $request->report_id,
                'total_amount' => $totalAmount,
                'paid_amount' => 0,
                'due_date' => $request->due_date,
                'status' => 'pending',
            ]);
            
            // Create invoice items
            foreach ($request->items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoiceId,
                    'type' => $item['type'],
                    'description' => $item['description'],
                    'amount' => $item['amount'],
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['amount'] * $item['quantity'],
                    'serial_number' => $item['serial_number'] ?? null,
                ]);
            }
            
            // Update report if provided
            if ($request->report_id) {
                Report::where('id', $request->report_id)
                    ->update(['has_invoice' => true]);
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Invoice created successfully',
                'invoice' => $invoice->load(['client', 'invoiceItems'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show($id)
    {
        $invoice = Invoice::with(['client', 'report', 'invoiceItems'])
            ->findOrFail($id);
            
        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,paid,overdue',
            'items' => 'sometimes|array',
            'items.*.id' => 'sometimes|exists:invoice_items,id',
            'items.*.type' => 'required_with:items|in:laptop,item,service',
            'items.*.description' => 'required_with:items|string',
            'items.*.amount' => 'required_with:items|numeric|min:0',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.serial_number' => 'nullable|string',
        ]);
        
        try {
            DB::beginTransaction();
            
            $invoice = Invoice::findOrFail($id);
            
            // Update invoice fields
            if ($request->has('due_date')) {
                $invoice->due_date = $request->due_date;
            }
            
            if ($request->has('status')) {
                $invoice->status = $request->status;
            }
            
            // Update items if provided
            if ($request->has('items')) {
                // Delete existing items
                InvoiceItem::where('invoice_id', $id)->delete();
                
                // Calculate new total amount
                $totalAmount = 0;
                foreach ($request->items as $item) {
                    $totalAmount += $item['amount'] * $item['quantity'];
                    
                    // Create new items
                    InvoiceItem::create([
                        'invoice_id' => $id,
                        'type' => $item['type'],
                        'description' => $item['description'],
                        'amount' => $item['amount'],
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['amount'] * $item['quantity'],
                        'serial_number' => $item['serial_number'] ?? null,
                    ]);
                }
                
                $invoice->total_amount = $totalAmount;
            }
            
            $invoice->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Invoice updated successfully',
                'invoice' => $invoice->load(['client', 'invoiceItems'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update payment status for an invoice.
     */
    public function updatePayment(Request $request, $id)
    {
        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
        ]);
        
        try {
            $invoice = Invoice::findOrFail($id);
            
            // Update paid amount
            $invoice->paid_amount = $request->paid_amount;
            
            // Update status based on payment
            if ($invoice->paid_amount >= $invoice->total_amount) {
                $invoice->status = 'paid';
            } else if ($invoice->paid_amount > 0) {
                $invoice->status = 'pending';
            } else if (now() > $invoice->due_date) {
                $invoice->status = 'overdue';
            }
            
            $invoice->save();
            
            return response()->json([
                'message' => 'Payment updated successfully',
                'invoice' => $invoice
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $invoice = Invoice::findOrFail($id);
            
            // Update report if associated
            if ($invoice->report_id) {
                Report::where('id', $invoice->report_id)
                    ->update(['has_invoice' => false]);
            }
            
            // Delete invoice items (should cascade automatically, but just to be safe)
            InvoiceItem::where('invoice_id', $id)->delete();
            
            // Delete invoice
            $invoice->delete();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Invoice deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get invoices for the authenticated client.
     */
    public function clientInvoices(Request $request)
    {
        $client = $request->user();
        
        $invoices = Invoice::with(['invoiceItems'])
            ->where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'invoices' => $invoices
        ]);
    }
    
    /**
     * Get a specific invoice for the authenticated client.
     */
    public function clientInvoice(Request $request, $id)
    {
        $client = $request->user();
        
        $invoice = Invoice::with(['invoiceItems', 'report'])
            ->where('id', $id)
            ->where('client_id', $client->id)
            ->first();
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found or you do not have permission to view it'
            ], 404);
        }
        
        return response()->json([
            'invoice' => $invoice
        ]);
    }
}
