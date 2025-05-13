@extends('layouts.client')

@section('title', 'تفاصيل التقرير')

@section('page-title', 'تقرير فحص #' . $report->report_number)

@section('styles')
<style>
    .report-header {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
    }
    .report-status {
        font-weight: bold;
        padding: 8px 15px;
        border-radius: 20px;
        display: inline-block;
    }
    .report-status-passed {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .report-status-failed {
        background-color: #f8d7da;
        color: #842029;
    }
    .report-status-conditional {
        background-color: #fff3cd;
        color: #664d03;
    }
    .report-section {
        margin-bottom: 30px;
    }
    .report-section-title {
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 10px;
        margin-bottom: 20px;
        font-weight: 600;
    }
    .report-info-item {
        margin-bottom: 15px;
    }
    .report-info-label {
        font-weight: 500;
        color: #6c757d;
        margin-bottom: 5px;
    }
    .report-info-value {
        font-weight: 400;
    }
    .test-result {
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 15px;
        transition: transform 0.3s ease;
    }
    .test-result:hover {
        transform: translateY(-5px);
    }
    .test-passed {
        background-color: #d1e7dd;
    }
    .test-failed {
        background-color: #f8d7da;
    }
    .test-warning {
        background-color: #fff3cd;
    }
    .test-info {
        background-color: #cfe2ff;
    }
    .test-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-right: 15px;
    }
    .test-passed-icon {
        background-color: #198754;
        color: white;
    }
    .test-failed-icon {
        background-color: #dc3545;
        color: white;
    }
    .test-warning-icon {
        background-color: #ffc107;
        color: white;
    }
    .test-info-icon {
        background-color: #0d6efd;
        color: white;
    }
    .component-status {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 5px;
    }
    .component-good {
        background-color: #198754;
    }
    .component-bad {
        background-color: #dc3545;
    }
    .component-warning {
        background-color: #ffc107;
    }
    .progress {
        height: 8px;
        border-radius: 4px;
    }
    .qr-code {
        max-width: 150px;
        margin: 0 auto;
    }
</style>
@endsection

@section('content')
<!-- Report Header -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body">
        <div class="report-header">
            <div class="row">
                <div class="col-md-6">
                    <h4 class="mb-3">{{ $report->device->brand }} {{ $report->device->model }}</h4>
                    <div class="report-info-item">
                        <div class="report-info-label">رقم التقرير</div>
                        <div class="report-info-value">{{ $report->report_number }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">تاريخ الفحص</div>
                        <div class="report-info-value">{{ $report->inspection_date->format('Y-m-d') }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">الفني</div>
                        <div class="report-info-value">{{ $report->technician->name }}</div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <div class="report-status 
                        @if($report->status == 'passed') report-status-passed
                        @elseif($report->status == 'failed') report-status-failed
                        @elseif($report->status == 'conditional') report-status-conditional
                        @endif">
                        @if($report->status == 'passed')
                            <i class="fas fa-check-circle me-1"></i> اجتياز
                        @elseif($report->status == 'failed')
                            <i class="fas fa-times-circle me-1"></i> عدم اجتياز
                        @elseif($report->status == 'conditional')
                            <i class="fas fa-exclamation-circle me-1"></i> اجتياز مشروط
                        @endif
                    </div>
                    <div class="mt-3">
                        <div class="qr-code mb-2">
                            {!! QrCode::size(150)->generate(route('reports.public', $report->public_key)) !!}
                        </div>
                        <p class="small text-muted">امسح رمز QR لمشاركة التقرير</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Device Information -->
        <div class="report-section">
            <h5 class="report-section-title"><i class="fas fa-laptop text-primary me-2"></i> معلومات الجهاز</h5>
            <div class="row">
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">نوع الجهاز</div>
                        <div class="report-info-value">
                            @if($report->device->type == 'laptop')
                                <i class="fas fa-laptop me-1"></i> لابتوب
                            @elseif($report->device->type == 'desktop')
                                <i class="fas fa-desktop me-1"></i> كمبيوتر مكتبي
                            @elseif($report->device->type == 'tablet')
                                <i class="fas fa-tablet-alt me-1"></i> تابلت
                            @elseif($report->device->type == 'phone')
                                <i class="fas fa-mobile-alt me-1"></i> هاتف ذكي
                            @else
                                <i class="fas fa-hdd me-1"></i> آخر
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">الماركة والموديل</div>
                        <div class="report-info-value">{{ $report->device->brand }} {{ $report->device->model }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">الرقم التسلسلي</div>
                        <div class="report-info-value">{{ $report->device->serial_number }}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">رقم الطلب</div>
                        <div class="report-info-value">{{ $report->device->order_number }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">حالة الضمان</div>
                        <div class="report-info-value">
                            @if($report->device->isUnderWarranty())
                                <span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> ساري</span>
                            @else
                                <span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> منتهي</span>
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">تاريخ الشراء</div>
                        <div class="report-info-value">{{ $report->device->purchase_date->format('Y-m-d') }}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Technical Inspection -->
        <div class="report-section">
            <h5 class="report-section-title"><i class="fas fa-microchip text-primary me-2"></i> الفحص الفني</h5>
            
            @if($report->technicalInspection)
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">نظام التشغيل</div>
                        <div class="report-info-value">{{ $report->technicalInspection->operating_system }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">المعالج</div>
                        <div class="report-info-value">{{ $report->technicalInspection->processor }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">الذاكرة العشوائية</div>
                        <div class="report-info-value">{{ $report->technicalInspection->ram }} GB</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">مساحة التخزين</div>
                        <div class="report-info-value">{{ $report->technicalInspection->storage }} GB</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">كارت الشاشة</div>
                        <div class="report-info-value">{{ $report->technicalInspection->graphics_card ?? 'غير متوفر' }}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">حالة البطارية</div>
                        <div class="report-info-value">
                            @if($report->technicalInspection->battery_health)
                                <div class="progress mb-1">
                                    <div class="progress-bar 
                                        @if($report->technicalInspection->battery_health >= 80) bg-success
                                        @elseif($report->technicalInspection->battery_health >= 50) bg-warning
                                        @else bg-danger
                                        @endif" 
                                        role="progressbar" 
                                        style="width: {{ $report->technicalInspection->battery_health }}%" 
                                        aria-valuenow="{{ $report->technicalInspection->battery_health }}" 
                                        aria-valuemin="0" 
                                        aria-valuemax="100">
                                    </div>
                                </div>
                                {{ $report->technicalInspection->battery_health }}%
                            @else
                                غير متوفر
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            <h6 class="mb-3">نتائج اختبارات المكونات</h6>
            <div class="table-responsive mb-4">
                <table class="table table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>المكون</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>المعالج (CPU)</td>
                            <td>
                                <span class="component-status 
                                    @if($report->technicalInspection->cpu_status == 'good') component-good
                                    @elseif($report->technicalInspection->cpu_status == 'bad') component-bad
                                    @else component-warning
                                    @endif">
                                </span>
                                @if($report->technicalInspection->cpu_status == 'good')
                                    جيد
                                @elseif($report->technicalInspection->cpu_status == 'bad')
                                    سيء
                                @else
                                    متوسط
                                @endif
                            </td>
                            <td>{{ $report->technicalInspection->cpu_notes ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td>كارت الشاشة (GPU)</td>
                            <td>
                                <span class="component-status 
                                    @if($report->technicalInspection->gpu_status == 'good') component-good
                                    @elseif($report->technicalInspection->gpu_status == 'bad') component-bad
                                    @else component-warning
                                    @endif">
                                </span>
                                @if($report->technicalInspection->gpu_status == 'good')
                                    جيد
                                @elseif($report->technicalInspection->gpu_status == 'bad')
                                    سيء
                                @else
                                    متوسط
                                @endif
                            </td>
                            <td>{{ $report->technicalInspection->gpu_notes ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td>الذاكرة العشوائية (RAM)</td>
                            <td>
                                <span class="component-status 
                                    @if($report->technicalInspection->ram_status == 'good') component-good
                                    @elseif($report->technicalInspection->ram_status == 'bad') component-bad
                                    @else component-warning
                                    @endif">
                                </span>
                                @if($report->technicalInspection->ram_status == 'good')
                                    جيد
                                @elseif($report->technicalInspection->ram_status == 'bad')
                                    سيء
                                @else
                                    متوسط
                                @endif
                            </td>
                            <td>{{ $report->technicalInspection->ram_notes ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td>وحدة التخزين (Storage)</td>
                            <td>
                                <span class="component-status 
                                    @if($report->technicalInspection->storage_status == 'good') component-good
                                    @elseif($report->technicalInspection->storage_status == 'bad') component-bad
                                    @else component-warning
                                    @endif">
                                </span>
                                @if($report->technicalInspection->storage_status == 'good')
                                    جيد
                                @elseif($report->technicalInspection->storage_status == 'bad')
                                    سيء
                                @else
                                    متوسط
                                @endif
                            </td>
                            <td>{{ $report->technicalInspection->storage_notes ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td>البطارية (Battery)</td>
                            <td>
                                <span class="component-status 
                                    @if($report->technicalInspection->battery_status == 'good') component-good
                                    @elseif($report->technicalInspection->battery_status == 'bad') component-bad
                                    @else component-warning
                                    @endif">
                                </span>
                                @if($report->technicalInspection->battery_status == 'good')
                                    جيد
                                @elseif($report->technicalInspection->battery_status == 'bad')
                                    سيء
                                @else
                                    متوسط
                                @endif
                            </td>
                            <td>{{ $report->technicalInspection->battery_notes ?? '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            @else
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> لا توجد معلومات فنية متاحة لهذا التقرير.
            </div>
            @endif
        </div>
        
        <!-- External Inspection -->
        <div class="report-section">
            <h5 class="report-section-title"><i class="fas fa-eye text-primary me-2"></i> الفحص الخارجي</h5>
            
            @if($report->externalInspection)
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">الحالة العامة</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->overall_condition == 'excellent')
                                <span class="badge bg-success">ممتاز</span>
                            @elseif($report->externalInspection->overall_condition == 'good')
                                <span class="badge bg-primary">جيد</span>
                            @elseif($report->externalInspection->overall_condition == 'fair')
                                <span class="badge bg-warning text-dark">مقبول</span>
                            @elseif($report->externalInspection->overall_condition == 'poor')
                                <span class="badge bg-danger">سيء</span>
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">حالة الشاشة</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->screen_condition == 'excellent')
                                <span class="badge bg-success">ممتاز</span>
                            @elseif($report->externalInspection->screen_condition == 'good')
                                <span class="badge bg-primary">جيد</span>
                            @elseif($report->externalInspection->screen_condition == 'fair')
                                <span class="badge bg-warning text-dark">مقبول</span>
                            @elseif($report->externalInspection->screen_condition == 'poor')
                                <span class="badge bg-danger">سيء</span>
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">حالة الهيكل</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->body_condition == 'excellent')
                                <span class="badge bg-success">ممتاز</span>
                            @elseif($report->externalInspection->body_condition == 'good')
                                <span class="badge bg-primary">جيد</span>
                            @elseif($report->externalInspection->body_condition == 'fair')
                                <span class="badge bg-warning text-dark">مقبول</span>
                            @elseif($report->externalInspection->body_condition == 'poor')
                                <span class="badge bg-danger">سيء</span>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="report-info-item">
                        <div class="report-info-label">حالة لوحة المفاتيح</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->keyboard_condition == 'excellent')
                                <span class="badge bg-success">ممتاز</span>
                            @elseif($report->externalInspection->keyboard_condition == 'good')
                                <span class="badge bg-primary">جيد</span>
                            @elseif($report->externalInspection->keyboard_condition == 'fair')
                                <span class="badge bg-warning text-dark">مقبول</span>
                            @elseif($report->externalInspection->keyboard_condition == 'poor')
                                <span class="badge bg-danger">سيء</span>
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">حالة المنافذ</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->ports_condition == 'excellent')
                                <span class="badge bg-success">ممتاز</span>
                            @elseif($report->externalInspection->ports_condition == 'good')
                                <span class="badge bg-primary">جيد</span>
                            @elseif($report->externalInspection->ports_condition == 'fair')
                                <span class="badge bg-warning text-dark">مقبول</span>
                            @elseif($report->externalInspection->ports_condition == 'poor')
                                <span class="badge bg-danger">سيء</span>
                            @endif
                        </div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">علامات تعرض للسوائل</div>
                        <div class="report-info-value">
                            @if($report->externalInspection->liquid_damage)
                                <span class="badge bg-danger"><i class="fas fa-tint me-1"></i> نعم</span>
                            @else
                                <span class="badge bg-success"><i class="fas fa-times me-1"></i> لا</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            @if($report->externalInspection->notes)
            <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i> ملاحظات الفحص الخارجي:</h6>
                <p class="mb-0">{{ $report->externalInspection->notes }}</p>
            </div>
            @endif
            @else
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> لا توجد معلومات فحص خارجي متاحة لهذا التقرير.
            </div>
            @endif
        </div>
        
        <!-- Conclusion and Recommendations -->
        <div class="report-section">
            <h5 class="report-section-title"><i class="fas fa-clipboard-check text-primary me-2"></i> النتائج والتوصيات</h5>
            
            <div class="alert 
                @if($report->status == 'passed') alert-success
                @elseif($report->status == 'failed') alert-danger
                @elseif($report->status == 'conditional') alert-warning
                @endif">
                <h6 class="mb-2">
                    @if($report->status == 'passed')
                        <i class="fas fa-check-circle me-2"></i> نتيجة الفحص: اجتياز
                    @elseif($report->status == 'failed')
                        <i class="fas fa-times-circle me-2"></i> نتيجة الفحص: عدم اجتياز
                    @elseif($report->status == 'conditional')
                        <i class="fas fa-exclamation-circle me-2"></i> نتيجة الفحص: اجتياز مشروط
                    @endif
                </h6>
                <p class="mb-0">{{ $report->conclusion }}</p>
            </div>
            
            @if($report->recommendations)
            <div class="mt-4">
                <h6 class="mb-3">التوصيات:</h6>
                <ul class="list-group">
                    @foreach(explode("\n", $report->recommendations) as $recommendation)
                        @if(trim($recommendation))
                            <li class="list-group-item">{{ $recommendation }}</li>
                        @endif
                    @endforeach
                </ul>
            </div>
            @endif
        </div>
    </div>
    <div class="card-footer bg-white border-0 py-3">
        <div class="d-flex justify-content-between">
            <a href="{{ route('client.reports.index') }}" class="btn btn-outline-secondary">
                <i class="fas fa-arrow-right me-1"></i> العودة للتقارير
            </a>
            <div>
                <button onclick="window.print()" class="btn btn-outline-primary me-2">
                    <i class="fas fa-print me-1"></i> طباعة
                </button>
                <a href="{{ route('client.reports.download', $report->id) }}" class="btn btn-primary">
                    <i class="fas fa-download me-1"></i> تحميل PDF
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
