@extends('layouts.client')

@section('title', 'تفاصيل الفاتورة')

@section('page-title', 'تفاصيل الفاتورة #' . $invoice->invoice_number)

@section('styles')
<style>
    .invoice-container {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        padding: 30px;
    }
    .invoice-header {
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 20px;
        margin-bottom: 20px;
    }
    .invoice-logo {
        max-height: 70px;
    }
    .invoice-title {
        font-size: 24px;
        font-weight: bold;
        color: #333;
    }
    .invoice-status {
        font-weight: bold;
        padding: 8px 15px;
        border-radius: 20px;
        display: inline-block;
    }
    .invoice-status-paid {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .invoice-status-pending {
        background-color: #fff3cd;
        color: #664d03;
    }
    .invoice-status-overdue {
        background-color: #f8d7da;
        color: #842029;
    }
    .invoice-info {
        margin-bottom: 30px;
    }
    .invoice-info-item {
        margin-bottom: 10px;
    }
    .invoice-info-label {
        font-weight: 600;
        color: #6c757d;
    }
    .invoice-table {
        margin-bottom: 30px;
    }
    .invoice-table th {
        background-color: #f8f9fa;
        font-weight: 600;
    }
    .invoice-summary {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
    }
    .invoice-summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    .invoice-summary-row:last-child {
        margin-bottom: 0;
        padding-top: 10px;
        border-top: 1px solid #dee2e6;
        font-weight: bold;
    }
    .invoice-summary-label {
        color: #6c757d;
    }
    .invoice-summary-value {
        font-weight: 600;
    }
    .invoice-notes {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
    }
    .invoice-footer {
        text-align: center;
        color: #6c757d;
        font-size: 14px;
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #f0f0f0;
    }
    .payment-badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 15px;
        border-radius: 20px;
        background-color: #f8f9fa;
        margin-right: 10px;
    }
    .payment-badge i {
        margin-right: 5px;
    }
    .qr-code {
        max-width: 150px;
        margin: 0 auto;
    }
    @media print {
        body {
            background-color: #fff;
        }
        .invoice-container {
            box-shadow: none;
            padding: 0;
        }
        .no-print {
            display: none !important;
        }
        .invoice-actions {
            display: none !important;
        }
    }
</style>
@endsection

@section('content')
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div class="invoice-container">
                    <!-- Invoice Header -->
                    <div class="invoice-header d-flex justify-content-between align-items-center">
                        <div>
                            <img src="{{ asset('assets/img/logo.png') }}" alt="Laapak Logo" class="invoice-logo">
                        </div>
                        <div class="text-end">
                            <h1 class="invoice-title mb-2">فاتورة</h1>
                            <div class="invoice-status 
                                @if($invoice->status == 'paid') invoice-status-paid
                                @elseif($invoice->status == 'pending') invoice-status-pending
                                @elseif($invoice->status == 'overdue') invoice-status-overdue
                                @endif">
                                @if($invoice->status == 'paid')
                                    <i class="fas fa-check-circle me-1"></i> مدفوعة
                                @elseif($invoice->status == 'pending')
                                    <i class="fas fa-clock me-1"></i> معلقة
                                @elseif($invoice->status == 'overdue')
                                    <i class="fas fa-exclamation-circle me-1"></i> متأخرة
                                @endif
                            </div>
                        </div>
                    </div>
                    
                    <!-- Invoice Info -->
                    <div class="row invoice-info">
                        <div class="col-md-6">
                            <h5 class="mb-3">معلومات العميل</h5>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">الاسم:</span>
                                <span>{{ $invoice->client->name }}</span>
                            </div>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">البريد الإلكتروني:</span>
                                <span>{{ $invoice->client->email }}</span>
                            </div>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">رقم الهاتف:</span>
                                <span>{{ $invoice->client->phone }}</span>
                            </div>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">العنوان:</span>
                                <span>{{ $invoice->client->address }}</span>
                            </div>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h5 class="mb-3">معلومات الفاتورة</h5>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">رقم الفاتورة:</span>
                                <span>#{{ $invoice->invoice_number }}</span>
                            </div>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">تاريخ الإصدار:</span>
                                <span>{{ $invoice->issue_date->format('Y-m-d') }}</span>
                            </div>
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">تاريخ الاستحقاق:</span>
                                <span>{{ $invoice->due_date->format('Y-m-d') }}</span>
                            </div>
                            @if($invoice->status == 'paid')
                            <div class="invoice-info-item">
                                <span class="invoice-info-label">تاريخ الدفع:</span>
                                <span>{{ $invoice->payment_date->format('Y-m-d') }}</span>
                            </div>
                            @endif
                        </div>
                    </div>
                    
                    <!-- Invoice Items -->
                    <div class="invoice-table">
                        <h5 class="mb-3">تفاصيل الفاتورة</h5>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>البند</th>
                                        <th>الوصف</th>
                                        <th>السعر</th>
                                        <th>الكمية</th>
                                        <th>المجموع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($invoice->items as $index => $item)
                                    <tr>
                                        <td>{{ $index + 1 }}</td>
                                        <td>{{ $item->name }}</td>
                                        <td>{{ $item->description }}</td>
                                        <td>{{ number_format($item->price, 2) }} ريال</td>
                                        <td>{{ $item->quantity }}</td>
                                        <td>{{ number_format($item->price * $item->quantity, 2) }} ريال</td>
                                    </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Invoice Summary -->
                    <div class="row">
                        <div class="col-md-6">
                            @if($invoice->device)
                            <div class="invoice-notes">
                                <h5 class="mb-3">معلومات الجهاز</h5>
                                <div class="invoice-info-item">
                                    <span class="invoice-info-label">الجهاز:</span>
                                    <span>{{ $invoice->device->brand }} {{ $invoice->device->model }}</span>
                                </div>
                                <div class="invoice-info-item">
                                    <span class="invoice-info-label">الرقم التسلسلي:</span>
                                    <span>{{ $invoice->device->serial_number }}</span>
                                </div>
                                <div class="invoice-info-item">
                                    <span class="invoice-info-label">رقم الطلب:</span>
                                    <span>{{ $invoice->device->order_number }}</span>
                                </div>
                            </div>
                            @endif
                            
                            @if($invoice->notes)
                            <div class="invoice-notes mt-4">
                                <h5 class="mb-3">ملاحظات</h5>
                                <p class="mb-0">{{ $invoice->notes }}</p>
                            </div>
                            @endif
                            
                            @if($invoice->status == 'paid')
                            <div class="invoice-notes mt-4">
                                <h5 class="mb-3">معلومات الدفع</h5>
                                <div class="invoice-info-item">
                                    <span class="invoice-info-label">طريقة الدفع:</span>
                                    <span>
                                        @if($invoice->payment_method == 'visa')
                                        <span class="payment-badge">
                                            <i class="fab fa-cc-visa"></i> فيزا
                                        </span>
                                        @elseif($invoice->payment_method == 'mastercard')
                                        <span class="payment-badge">
                                            <i class="fab fa-cc-mastercard"></i> ماستركارد
                                        </span>
                                        @elseif($invoice->payment_method == 'mada')
                                        <span class="payment-badge">
                                            <i class="fas fa-credit-card"></i> مدى
                                        </span>
                                        @elseif($invoice->payment_method == 'cash')
                                        <span class="payment-badge">
                                            <i class="fas fa-money-bill-wave"></i> نقداً
                                        </span>
                                        @elseif($invoice->payment_method == 'bank_transfer')
                                        <span class="payment-badge">
                                            <i class="fas fa-university"></i> تحويل بنكي
                                        </span>
                                        @endif
                                    </span>
                                </div>
                                <div class="invoice-info-item">
                                    <span class="invoice-info-label">رقم المعاملة:</span>
                                    <span>{{ $invoice->transaction_id ?? 'غير متوفر' }}</span>
                                </div>
                            </div>
                            @endif
                        </div>
                        <div class="col-md-6">
                            <div class="invoice-summary">
                                <div class="invoice-summary-row">
                                    <span class="invoice-summary-label">المجموع الفرعي:</span>
                                    <span class="invoice-summary-value">{{ number_format($invoice->subtotal, 2) }} ريال</span>
                                </div>
                                <div class="invoice-summary-row">
                                    <span class="invoice-summary-label">ضريبة القيمة المضافة (15%):</span>
                                    <span class="invoice-summary-value">{{ number_format($invoice->tax_amount, 2) }} ريال</span>
                                </div>
                                @if($invoice->discount_amount > 0)
                                <div class="invoice-summary-row">
                                    <span class="invoice-summary-label">الخصم:</span>
                                    <span class="invoice-summary-value">{{ number_format($invoice->discount_amount, 2) }} ريال</span>
                                </div>
                                @endif
                                <div class="invoice-summary-row">
                                    <span class="invoice-summary-label">المجموع الكلي:</span>
                                    <span class="invoice-summary-value text-primary">{{ number_format($invoice->total_amount, 2) }} ريال</span>
                                </div>
                            </div>
                            
                            @if($invoice->status == 'paid')
                            <div class="text-center mt-4">
                                <div class="qr-code mb-2">
                                    {!! QrCode::size(150)->generate(route('client.invoices.verify', $invoice->id)) !!}
                                </div>
                                <p class="small text-muted">امسح رمز QR للتحقق من صحة الفاتورة</p>
                            </div>
                            @endif
                            
                            @if($invoice->status != 'paid')
                            <div class="mt-4 text-center">
                                <a href="{{ route('client.invoices.pay', $invoice->id) }}" class="btn btn-primary btn-lg">
                                    <i class="fas fa-credit-card me-2"></i> دفع الفاتورة الآن
                                </a>
                            </div>
                            @endif
                        </div>
                    </div>
                    
                    <!-- Invoice Footer -->
                    <div class="invoice-footer">
                        <p>شكراً لثقتكم بنا - Laapak للتقنية</p>
                        <p class="mb-0">للاستفسارات: support@laapak.com | +966 12 345 6789</p>
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white border-0 py-3 no-print">
                <div class="d-flex justify-content-between">
                    <a href="{{ route('client.invoices.index') }}" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-right me-1"></i> العودة للفواتير
                    </a>
                    <div class="invoice-actions">
                        <button onclick="window.print()" class="btn btn-outline-primary me-2">
                            <i class="fas fa-print me-1"></i> طباعة
                        </button>
                        <a href="{{ route('client.invoices.download', $invoice->id) }}" class="btn btn-primary">
                            <i class="fas fa-download me-1"></i> تحميل PDF
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
