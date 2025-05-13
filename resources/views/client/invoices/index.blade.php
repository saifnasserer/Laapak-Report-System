@extends('layouts.client')

@section('title', 'الفواتير')

@section('page-title', 'الفواتير والمدفوعات')

@section('styles')
<style>
    .invoice-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .invoice-card:hover {
        transform: translateY(-5px);
    }
    .invoice-badge {
        font-weight: bold;
        padding: 8px 12px;
        border-radius: 20px;
    }
    .invoice-paid {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .invoice-pending {
        background-color: #fff3cd;
        color: #664d03;
    }
    .invoice-overdue {
        background-color: #f8d7da;
        color: #842029;
    }
    .payment-method-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        margin-right: 10px;
    }
    .payment-method-visa {
        background-color: #1a1f71;
        color: white;
    }
    .payment-method-mastercard {
        background-color: #eb001b;
        color: white;
    }
    .payment-method-mada {
        background-color: #00adef;
        color: white;
    }
    .payment-method-cash {
        background-color: #28a745;
        color: white;
    }
    .payment-method-bank {
        background-color: #6c757d;
        color: white;
    }
    .invoice-summary-card {
        border-radius: 10px;
        border: none;
        overflow: hidden;
    }
    .invoice-summary-item {
        display: flex;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
    }
    .invoice-summary-item:last-child {
        border-bottom: none;
    }
    .invoice-summary-total {
        font-weight: bold;
        background-color: #f8f9fa;
    }
    .invoice-filter {
        display: flex;
        align-items: center;
        background-color: #f8f9fa;
        border-radius: 50px;
        padding: 5px;
        margin-bottom: 20px;
    }
    .invoice-filter-item {
        flex: 1;
        text-align: center;
        padding: 8px 15px;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    .invoice-filter-item.active {
        background-color: #0d6efd;
        color: white;
    }
</style>
@endsection

@section('content')
<!-- Invoice Summary -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title mb-4"><i class="fas fa-file-invoice-dollar text-primary me-2"></i> ملخص الفواتير</h5>
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <div class="card h-100 border-0 shadow-sm invoice-summary-card">
                            <div class="card-body text-center">
                                <div class="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-file-invoice text-primary fa-2x"></i>
                                </div>
                                <h3 class="mb-1">{{ $invoices->count() }}</h3>
                                <p class="text-muted mb-0">إجمالي الفواتير</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card h-100 border-0 shadow-sm invoice-summary-card">
                            <div class="card-body text-center">
                                <div class="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-3" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-check-circle text-success fa-2x"></i>
                                </div>
                                <h3 class="mb-1">{{ $invoices->where('status', 'paid')->count() }}</h3>
                                <p class="text-muted mb-0">الفواتير المدفوعة</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card h-100 border-0 shadow-sm invoice-summary-card">
                            <div class="card-body text-center">
                                <div class="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-clock text-warning fa-2x"></i>
                                </div>
                                <h3 class="mb-1">{{ $invoices->where('status', 'pending')->count() }}</h3>
                                <p class="text-muted mb-0">الفواتير المعلقة</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card h-100 border-0 shadow-sm invoice-summary-card">
                            <div class="card-body text-center">
                                <div class="rounded-circle bg-danger bg-opacity-10 p-3 mx-auto mb-3" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-exclamation-circle text-danger fa-2x"></i>
                                </div>
                                <h3 class="mb-1">{{ $invoices->where('status', 'overdue')->count() }}</h3>
                                <p class="text-muted mb-0">الفواتير المتأخرة</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Amount Summary -->
                <div class="row mt-4">
                    <div class="col-md-6 offset-md-3">
                        <div class="card border-0 shadow-sm invoice-summary-card">
                            <div class="invoice-summary-item">
                                <span>إجمالي المبالغ المدفوعة</span>
                                <span class="text-success fw-bold">{{ number_format($invoices->where('status', 'paid')->sum('total_amount'), 2) }} ريال</span>
                            </div>
                            <div class="invoice-summary-item">
                                <span>إجمالي المبالغ المعلقة</span>
                                <span class="text-warning fw-bold">{{ number_format($invoices->where('status', 'pending')->sum('total_amount'), 2) }} ريال</span>
                            </div>
                            <div class="invoice-summary-item">
                                <span>إجمالي المبالغ المتأخرة</span>
                                <span class="text-danger fw-bold">{{ number_format($invoices->where('status', 'overdue')->sum('total_amount'), 2) }} ريال</span>
                            </div>
                            <div class="invoice-summary-item invoice-summary-total">
                                <span>المبلغ الإجمالي</span>
                                <span class="text-primary fw-bold">{{ number_format($invoices->sum('total_amount'), 2) }} ريال</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Invoice Filter -->
<div class="invoice-filter mb-4">
    <div class="invoice-filter-item active" data-filter="all">الكل</div>
    <div class="invoice-filter-item" data-filter="paid">مدفوعة</div>
    <div class="invoice-filter-item" data-filter="pending">معلقة</div>
    <div class="invoice-filter-item" data-filter="overdue">متأخرة</div>
</div>

<!-- Invoices List -->
<div class="row" id="invoicesContainer">
    @forelse($invoices as $invoice)
    <div class="col-md-6 mb-4 invoice-item" data-status="{{ $invoice->status }}">
        <div class="card border-0 shadow-sm invoice-card">
            <div class="card-header bg-white border-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold">فاتورة #{{ $invoice->invoice_number }}</h5>
                    @if($invoice->status == 'paid')
                    <span class="invoice-badge invoice-paid">
                        <i class="fas fa-check-circle me-1"></i> مدفوعة
                    </span>
                    @elseif($invoice->status == 'pending')
                    <span class="invoice-badge invoice-pending">
                        <i class="fas fa-clock me-1"></i> معلقة
                    </span>
                    @elseif($invoice->status == 'overdue')
                    <span class="invoice-badge invoice-overdue">
                        <i class="fas fa-exclamation-circle me-1"></i> متأخرة
                    </span>
                    @endif
                </div>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>تاريخ الإصدار:</span>
                        <span class="fw-bold">{{ $invoice->issue_date->format('Y-m-d') }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>تاريخ الاستحقاق:</span>
                        <span class="fw-bold">{{ $invoice->due_date->format('Y-m-d') }}</span>
                    </div>
                    @if($invoice->status == 'paid')
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>تاريخ الدفع:</span>
                        <span class="fw-bold">{{ $invoice->payment_date->format('Y-m-d') }}</span>
                    </div>
                    @endif
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>المبلغ الإجمالي:</span>
                        <span class="fw-bold text-primary">{{ number_format($invoice->total_amount, 2) }} ريال</span>
                    </div>
                    
                    @if($invoice->device)
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>الجهاز:</span>
                        <span class="fw-bold">{{ $invoice->device->brand }} {{ $invoice->device->model }}</span>
                    </div>
                    @endif
                    
                    @if($invoice->status == 'paid')
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>طريقة الدفع:</span>
                        <div class="d-flex align-items-center">
                            @if($invoice->payment_method == 'visa')
                            <div class="payment-method-icon payment-method-visa">
                                <i class="fab fa-cc-visa"></i>
                            </div>
                            <span>فيزا</span>
                            @elseif($invoice->payment_method == 'mastercard')
                            <div class="payment-method-icon payment-method-mastercard">
                                <i class="fab fa-cc-mastercard"></i>
                            </div>
                            <span>ماستركارد</span>
                            @elseif($invoice->payment_method == 'mada')
                            <div class="payment-method-icon payment-method-mada">
                                <i class="fas fa-credit-card"></i>
                            </div>
                            <span>مدى</span>
                            @elseif($invoice->payment_method == 'cash')
                            <div class="payment-method-icon payment-method-cash">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <span>نقداً</span>
                            @elseif($invoice->payment_method == 'bank_transfer')
                            <div class="payment-method-icon payment-method-bank">
                                <i class="fas fa-university"></i>
                            </div>
                            <span>تحويل بنكي</span>
                            @endif
                        </div>
                    </div>
                    @endif
                    
                    <!-- Invoice Items Summary -->
                    <div class="mt-4">
                        <h6 class="mb-3">تفاصيل الفاتورة</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>البند</th>
                                        <th>السعر</th>
                                        <th>الكمية</th>
                                        <th>المجموع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($invoice->items as $item)
                                    <tr>
                                        <td>{{ $item->description }}</td>
                                        <td>{{ number_format($item->price, 2) }}</td>
                                        <td>{{ $item->quantity }}</td>
                                        <td>{{ number_format($item->price * $item->quantity, 2) }}</td>
                                    </tr>
                                    @endforeach
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-end fw-bold">المجموع الفرعي:</td>
                                        <td>{{ number_format($invoice->subtotal, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" class="text-end fw-bold">ضريبة القيمة المضافة (15%):</td>
                                        <td>{{ number_format($invoice->tax_amount, 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" class="text-end fw-bold">المجموع الكلي:</td>
                                        <td class="fw-bold text-primary">{{ number_format($invoice->total_amount, 2) }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex gap-2">
                    <a href="{{ route('client.invoices.show', $invoice->id) }}" class="btn btn-sm btn-outline-primary flex-grow-1">
                        <i class="fas fa-eye me-1"></i> عرض التفاصيل
                    </a>
                    <a href="{{ route('client.invoices.download', $invoice->id) }}" class="btn btn-sm btn-primary flex-grow-1">
                        <i class="fas fa-download me-1"></i> تحميل PDF
                    </a>
                    @if($invoice->status == 'pending' || $invoice->status == 'overdue')
                    <a href="{{ route('client.invoices.pay', $invoice->id) }}" class="btn btn-sm btn-success flex-grow-1">
                        <i class="fas fa-credit-card me-1"></i> دفع الآن
                    </a>
                    @endif
                </div>
            </div>
        </div>
    </div>
    @empty
    <div class="col-12">
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> لا توجد فواتير مسجلة حالياً.
        </div>
    </div>
    @endforelse
</div>

<!-- Payment Methods -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-credit-card text-primary me-2"></i> طرق الدفع المتاحة</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-credit-card text-primary fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">بطاقات الائتمان</h5>
                                </div>
                                <p>يمكنك الدفع باستخدام بطاقات الائتمان التالية:</p>
                                <div class="d-flex gap-2 mb-3">
                                    <div class="p-2 bg-light rounded">
                                        <i class="fab fa-cc-visa fa-2x text-primary"></i>
                                    </div>
                                    <div class="p-2 bg-light rounded">
                                        <i class="fab fa-cc-mastercard fa-2x text-danger"></i>
                                    </div>
                                    <div class="p-2 bg-light rounded">
                                        <i class="fab fa-cc-amex fa-2x text-info"></i>
                                    </div>
                                </div>
                                <p class="small text-muted mb-0">جميع المعاملات آمنة ومشفرة</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-success bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-university text-success fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">التحويل البنكي</h5>
                                </div>
                                <p>يمكنك التحويل مباشرة إلى حسابنا البنكي:</p>
                                <ul class="small">
                                    <li><strong>اسم البنك:</strong> البنك الأهلي السعودي</li>
                                    <li><strong>اسم الحساب:</strong> شركة Laapak للتقنية</li>
                                    <li><strong>رقم الحساب:</strong> 1234567890</li>
                                    <li><strong>رقم الآيبان:</strong> SA1234567890123456789012</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-info bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-money-bill-wave text-info fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">الدفع النقدي</h5>
                                </div>
                                <p>يمكنك الدفع نقداً في أحد فروعنا:</p>
                                <ul class="small">
                                    <li><strong>الفرع الرئيسي:</strong> الرياض، طريق الملك فهد</li>
                                    <li><strong>فرع جدة:</strong> جدة، شارع التحلية</li>
                                    <li><strong>فرع الدمام:</strong> الدمام، شارع الأمير محمد بن فهد</li>
                                </ul>
                                <p class="small text-muted mb-0">ساعات العمل: 9 صباحاً - 9 مساءً</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Invoice filtering
    const filterItems = document.querySelectorAll('.invoice-filter-item');
    const invoiceItems = document.querySelectorAll('.invoice-item');
    
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            filterItems.forEach(filter => filter.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filter invoices
            invoiceItems.forEach(invoice => {
                if (filter === 'all' || invoice.getAttribute('data-status') === filter) {
                    invoice.style.display = 'block';
                } else {
                    invoice.style.display = 'none';
                }
            });
            
            // Show no results message if needed
            const visibleInvoices = document.querySelectorAll('.invoice-item[style="display: block;"]');
            const noResultsElement = document.getElementById('noResultsMessage');
            
            if (visibleInvoices.length === 0) {
                if (!noResultsElement) {
                    const container = document.getElementById('invoicesContainer');
                    const noResults = document.createElement('div');
                    noResults.id = 'noResultsMessage';
                    noResults.className = 'col-12';
                    noResults.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i> لا توجد فواتير مطابقة للفلتر المحدد.</div>';
                    container.appendChild(noResults);
                }
            } else if (noResultsElement) {
                noResultsElement.remove();
            }
        });
    });
});
</script>
@endsection
