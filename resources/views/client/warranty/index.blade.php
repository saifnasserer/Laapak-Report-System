@extends('layouts.client')

@section('title', 'تفاصيل الضمان')

@section('page-title', 'تفاصيل الضمان')

@section('styles')
<style>
    .warranty-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .warranty-card:hover {
        transform: translateY(-5px);
    }
    .warranty-badge {
        font-size: 0.85rem;
        padding: 5px 10px;
        border-radius: 20px;
        font-weight: bold;
    }
    .warranty-active {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .warranty-expired {
        background-color: #f8d7da;
        color: #842029;
    }
    .warranty-progress {
        height: 6px;
        border-radius: 3px;
    }
    .warranty-info-card {
        border-radius: 10px;
        overflow: hidden;
        border-left: 4px solid;
    }
    .warranty-info-card.manufacturing {
        border-color: #198754;
    }
    .warranty-info-card.replacement {
        border-color: #ffc107;
    }
    .warranty-info-card.maintenance {
        border-color: #0dcaf0;
    }
    .warranty-timeline {
        position: relative;
        padding-left: 30px;
    }
    .warranty-timeline::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 0;
        height: 100%;
        width: 2px;
        background-color: #dee2e6;
    }
    .warranty-timeline-item {
        position: relative;
        padding-bottom: 25px;
    }
    .warranty-timeline-item:last-child {
        padding-bottom: 0;
    }
    .warranty-timeline-item::before {
        content: '';
        position: absolute;
        left: -30px;
        top: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #fff;
        border: 2px solid #6c757d;
        z-index: 1;
    }
    .warranty-timeline-item.active::before {
        background-color: #198754;
        border-color: #198754;
    }
    .warranty-timeline-item.expired::before {
        background-color: #dc3545;
        border-color: #dc3545;
    }
</style>
@endsection

@section('content')
<!-- Warranty Information -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title"><i class="fas fa-info-circle text-primary me-2"></i> معلومات الضمان</h5>
                <p class="card-text">تقدم Laapak ثلاثة أنواع من الضمانات لعملائها:</p>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 warranty-info-card manufacturing">
                            <div class="card-body">
                                <h6 class="card-title text-success">
                                    <i class="fas fa-cog me-2"></i> ضمان عيوب الصناعة
                                </h6>
                                <p class="card-text">ضمان لمدة 6 أشهر ضد عيوب الصناعة منذ تاريخ إنشاء التقرير</p>
                                <ul class="small text-muted">
                                    <li>يغطي جميع المشاكل المتعلقة بعيوب التصنيع</li>
                                    <li>يشمل الأعطال الداخلية غير الناتجة عن سوء الاستخدام</li>
                                    <li>لا يشمل الأضرار الناتجة عن سقوط الجهاز أو تعرضه للسوائل</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 warranty-info-card replacement">
                            <div class="card-body">
                                <h6 class="card-title text-warning">
                                    <i class="fas fa-exchange-alt me-2"></i> ضمان الاستبدال
                                </h6>
                                <p class="card-text">ضمان استبدال لمدة 14 يوم من تاريخ استلام الجهاز</p>
                                <ul class="small text-muted">
                                    <li>يمكنك استبدال الجهاز في حال وجود عيوب واضحة</li>
                                    <li>يجب أن يكون الجهاز بحالته الأصلية مع جميع الملحقات</li>
                                    <li>لا يشمل الأضرار الناتجة عن سوء الاستخدام</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 warranty-info-card maintenance">
                            <div class="card-body">
                                <h6 class="card-title text-info">
                                    <i class="fas fa-tools me-2"></i> ضمان الصيانة الدورية
                                </h6>
                                <p class="card-text">ضمان صيانة دورية لمدة سنة كاملة (مرة كل 6 أشهر)</p>
                                <ul class="small text-muted">
                                    <li>زيارتان مجانيتان للصيانة الدورية خلال السنة الأولى</li>
                                    <li>تشمل تنظيف الجهاز وفحص المكونات وتحديث البرامج</li>
                                    <li>لا تشمل استبدال أي قطع تالفة بسبب سوء الاستخدام</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Devices Warranty Status -->
<div class="row">
    @forelse($devices as $device)
    <div class="col-md-6 mb-4">
        <div class="card border-0 shadow-sm warranty-card">
            <div class="card-header bg-white border-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold">{{ $device->brand }} {{ $device->model }}</h5>
                    <span class="badge bg-primary">{{ $device->order_number }}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>تاريخ بداية الضمان:</span>
                        <span class="fw-bold">{{ $device->warranty_start_date->format('Y-m-d') }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>تاريخ انتهاء الضمان:</span>
                        <span class="fw-bold">{{ $device->warranty_end_date->format('Y-m-d') }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>الحالة:</span>
                        @if($device->isUnderWarranty())
                        <span class="warranty-badge warranty-active">
                            <i class="fas fa-shield-alt me-1"></i> ساري المفعول
                        </span>
                        @else
                        <span class="warranty-badge warranty-expired">
                            <i class="fas fa-times-circle me-1"></i> منتهي
                        </span>
                        @endif
                    </div>
                    
                    @if($device->isUnderWarranty())
                    <div class="mb-1">
                        <small class="d-block text-muted mb-1">المدة المتبقية من الضمان:</small>
                        <div class="progress warranty-progress mb-1">
                            <div class="progress-bar bg-success" style="width: {{ $device->warrantyDaysRemaining() / 180 * 100 }}%"></div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>{{ $device->warrantyDaysRemaining() }} يوم متبقي</small>
                            <small>{{ round($device->warrantyDaysRemaining() / 180 * 100) }}%</small>
                        </div>
                    </div>
                    @endif
                    
                    <!-- Warranty Timeline -->
                    <div class="warranty-timeline mt-4">
                        <h6 class="mb-3">مراحل الضمان</h6>
                        
                        <!-- Replacement Warranty -->
                        @php
                            $replacementEndDate = $device->inspection_date->copy()->addDays(14);
                            $isReplacementActive = now()->between($device->inspection_date, $replacementEndDate);
                            $isReplacementExpired = now()->gt($replacementEndDate);
                        @endphp
                        <div class="warranty-timeline-item {{ $isReplacementActive ? 'active' : ($isReplacementExpired ? 'expired' : '') }}">
                            <h6>ضمان الاستبدال (14 يوم)</h6>
                            <p class="small mb-0">
                                من {{ $device->inspection_date->format('Y-m-d') }} إلى {{ $replacementEndDate->format('Y-m-d') }}
                            </p>
                            <p class="small text-muted">
                                @if($isReplacementActive)
                                    <span class="text-success">ساري المفعول حالياً</span>
                                @elseif($isReplacementExpired)
                                    <span class="text-danger">منتهي</span>
                                @else
                                    <span class="text-muted">لم يبدأ بعد</span>
                                @endif
                            </p>
                        </div>
                        
                        <!-- Manufacturing Defects Warranty -->
                        @php
                            $manufacturingEndDate = $device->warranty_end_date;
                            $isManufacturingActive = now()->between($device->warranty_start_date, $manufacturingEndDate);
                            $isManufacturingExpired = now()->gt($manufacturingEndDate);
                        @endphp
                        <div class="warranty-timeline-item {{ $isManufacturingActive ? 'active' : ($isManufacturingExpired ? 'expired' : '') }}">
                            <h6>ضمان عيوب الصناعة (6 أشهر)</h6>
                            <p class="small mb-0">
                                من {{ $device->warranty_start_date->format('Y-m-d') }} إلى {{ $manufacturingEndDate->format('Y-m-d') }}
                            </p>
                            <p class="small text-muted">
                                @if($isManufacturingActive)
                                    <span class="text-success">ساري المفعول حالياً</span>
                                @elseif($isManufacturingExpired)
                                    <span class="text-danger">منتهي</span>
                                @else
                                    <span class="text-muted">لم يبدأ بعد</span>
                                @endif
                            </p>
                        </div>
                        
                        <!-- Maintenance Warranty -->
                        @php
                            $maintenanceEndDate = $device->inspection_date->copy()->addYear();
                            $isMaintenanceActive = now()->between($device->inspection_date, $maintenanceEndDate);
                            $isMaintenanceExpired = now()->gt($maintenanceEndDate);
                            
                            $freeMaintenance = $device->maintenanceLogs()->where('is_free_maintenance', true)->count();
                            $freeMaintenanceRemaining = 2 - $freeMaintenance;
                            $freeMaintenanceRemaining = max(0, $freeMaintenanceRemaining);
                        @endphp
                        <div class="warranty-timeline-item {{ $isMaintenanceActive ? 'active' : ($isMaintenanceExpired ? 'expired' : '') }}">
                            <h6>ضمان الصيانة الدورية (سنة)</h6>
                            <p class="small mb-0">
                                من {{ $device->inspection_date->format('Y-m-d') }} إلى {{ $maintenanceEndDate->format('Y-m-d') }}
                            </p>
                            <p class="small text-muted">
                                @if($isMaintenanceActive)
                                    <span class="text-success">ساري المفعول حالياً</span>
                                    <span class="ms-2">| الزيارات المتبقية: {{ $freeMaintenanceRemaining }}</span>
                                @elseif($isMaintenanceExpired)
                                    <span class="text-danger">منتهي</span>
                                @else
                                    <span class="text-muted">لم يبدأ بعد</span>
                                @endif
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex gap-2">
                    <a href="{{ route('client.devices.show', $device->id) }}" class="btn btn-sm btn-outline-primary flex-grow-1">
                        <i class="fas fa-info-circle me-1"></i> تفاصيل الجهاز
                    </a>
                    <a href="{{ route('client.warranty.show', $device->id) }}" class="btn btn-sm btn-primary flex-grow-1">
                        <i class="fas fa-shield-alt me-1"></i> تفاصيل الضمان
                    </a>
                </div>
            </div>
        </div>
    </div>
    @empty
    <div class="col-12">
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> لا توجد أجهزة مسجلة حالياً.
        </div>
    </div>
    @endforelse
</div>

<!-- Warranty FAQ -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-question-circle text-primary me-2"></i> الأسئلة الشائعة حول الضمان</h5>
            </div>
            <div class="card-body">
                <div class="accordion" id="warrantyFaq">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="faqOne">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                ماذا يغطي ضمان عيوب الصناعة؟
                            </button>
                        </h2>
                        <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="faqOne" data-bs-parent="#warrantyFaq">
                            <div class="accordion-body">
                                <p>يغطي ضمان عيوب الصناعة جميع المشاكل المتعلقة بعيوب التصنيع والأعطال الداخلية غير الناتجة عن سوء الاستخدام. يشمل ذلك:</p>
                                <ul>
                                    <li>أعطال اللوحة الأم</li>
                                    <li>مشاكل المعالج والذاكرة</li>
                                    <li>أعطال البطارية (التي لا تنتج عن الاستخدام العادي)</li>
                                    <li>مشاكل الشاشة (بكسلات ميتة، مشاكل في الإضاءة الخلفية)</li>
                                    <li>أعطال لوحة المفاتيح والتاتش باد</li>
                                </ul>
                                <p>لا يشمل الضمان الأضرار الناتجة عن سوء الاستخدام مثل:</p>
                                <ul>
                                    <li>الأضرار الناتجة عن سقوط الجهاز</li>
                                    <li>الأضرار الناتجة عن تعرض الجهاز للسوائل</li>
                                    <li>الأضرار الناتجة عن فتح الجهاز من قبل أشخاص غير معتمدين</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="faqTwo">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                كيف يمكنني الاستفادة من ضمان الصيانة الدورية؟
                            </button>
                        </h2>
                        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="faqTwo" data-bs-parent="#warrantyFaq">
                            <div class="accordion-body">
                                <p>يمكنك الاستفادة من ضمان الصيانة الدورية من خلال زيارتين مجانيتين خلال السنة الأولى من شراء الجهاز. للحصول على موعد للصيانة الدورية:</p>
                                <ol>
                                    <li>قم بالتواصل معنا عبر الهاتف أو الواتساب</li>
                                    <li>حدد موعداً مناسباً للزيارة</li>
                                    <li>أحضر الجهاز في الموعد المحدد</li>
                                </ol>
                                <p>تشمل الصيانة الدورية:</p>
                                <ul>
                                    <li>تنظيف الجهاز من الداخل والخارج</li>
                                    <li>فحص المكونات الداخلية</li>
                                    <li>تحديث البرامج والتعريفات</li>
                                    <li>تحسين أداء الجهاز</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="faqThree">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                ماذا أفعل إذا واجهت مشكلة في الجهاز خلال فترة الضمان؟
                            </button>
                        </h2>
                        <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="faqThree" data-bs-parent="#warrantyFaq">
                            <div class="accordion-body">
                                <p>إذا واجهت أي مشكلة في الجهاز خلال فترة الضمان، يرجى اتباع الخطوات التالية:</p>
                                <ol>
                                    <li>تواصل معنا فوراً عبر الهاتف أو الواتساب لوصف المشكلة</li>
                                    <li>سنقوم بتحديد ما إذا كانت المشكلة مشمولة بالضمان</li>
                                    <li>حدد موعداً لإحضار الجهاز للفحص والإصلاح</li>
                                    <li>أحضر الجهاز مع إثبات الشراء وبطاقة الضمان</li>
                                </ol>
                                <p>ملاحظة: يجب الإبلاغ عن المشكلة خلال فترة الضمان، حتى لو تم الإصلاح بعد انتهاء الضمان.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
