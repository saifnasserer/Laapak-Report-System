@extends('layouts.client')

@section('title', 'أجهزتي')

@section('page-title', 'إدارة الأجهزة')

@section('styles')
<style>
    .device-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .device-card:hover {
        transform: translateY(-5px);
    }
    .device-badge {
        font-weight: bold;
        padding: 8px 12px;
        border-radius: 20px;
    }
    .device-status-active {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .device-status-inactive {
        background-color: #f8d7da;
        color: #842029;
    }
    .device-status-maintenance {
        background-color: #fff3cd;
        color: #664d03;
    }
    .device-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .device-laptop {
        background-color: #e8f4f8;
        color: #0dcaf0;
    }
    .device-desktop {
        background-color: #e8f0fe;
        color: #0d6efd;
    }
    .device-tablet {
        background-color: #f8f0fc;
        color: #d63384;
    }
    .device-phone {
        background-color: #f0f8f0;
        color: #198754;
    }
    .device-other {
        background-color: #f8f9fa;
        color: #6c757d;
    }
    .device-info-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    .device-info-item:last-child {
        border-bottom: none;
    }
    .device-info-label {
        color: #6c757d;
    }
    .device-filter {
        display: flex;
        align-items: center;
        background-color: #f8f9fa;
        border-radius: 50px;
        padding: 5px;
        margin-bottom: 20px;
    }
    .device-filter-item {
        flex: 1;
        text-align: center;
        padding: 8px 15px;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    .device-filter-item.active {
        background-color: #0d6efd;
        color: white;
    }
    .device-stats-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .device-stats-card:hover {
        transform: translateY(-5px);
    }
    .device-stats-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .device-stats-total {
        background-color: #e8f0fe;
        color: #0d6efd;
    }
    .device-stats-active {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .device-stats-warranty {
        background-color: #fff3cd;
        color: #664d03;
    }
</style>
@endsection

@section('content')
<!-- Device Statistics -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title mb-4"><i class="fas fa-laptop text-primary me-2"></i> إحصائيات الأجهزة</h5>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm device-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="device-stats-icon device-stats-total">
                                        <i class="fas fa-laptop fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">إجمالي الأجهزة</h6>
                                        <h3 class="mb-0">{{ $devices->count() }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm device-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="device-stats-icon device-stats-active">
                                        <i class="fas fa-check-circle fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">الأجهزة النشطة</h6>
                                        <h3 class="mb-0">{{ $devices->where('status', 'active')->count() }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm device-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="device-stats-icon device-stats-warranty">
                                        <i class="fas fa-shield-alt fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">أجهزة تحت الضمان</h6>
                                        <h3 class="mb-0">{{ $devicesUnderWarranty }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Device Filter -->
<div class="device-filter mb-4">
    <div class="device-filter-item active" data-filter="all">الكل</div>
    <div class="device-filter-item" data-filter="laptop">لابتوب</div>
    <div class="device-filter-item" data-filter="desktop">كمبيوتر مكتبي</div>
    <div class="device-filter-item" data-filter="tablet">تابلت</div>
    <div class="device-filter-item" data-filter="phone">هاتف ذكي</div>
</div>

<!-- Devices List -->
<div class="row" id="devicesContainer">
    @forelse($devices as $device)
    <div class="col-md-6 mb-4 device-item" data-type="{{ $device->type }}">
        <div class="card border-0 shadow-sm device-card">
            <div class="card-header bg-white border-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="device-icon 
                            @if($device->type == 'laptop') device-laptop
                            @elseif($device->type == 'desktop') device-desktop
                            @elseif($device->type == 'tablet') device-tablet
                            @elseif($device->type == 'phone') device-phone
                            @else device-other
                            @endif">
                            @if($device->type == 'laptop')
                                <i class="fas fa-laptop fa-lg"></i>
                            @elseif($device->type == 'desktop')
                                <i class="fas fa-desktop fa-lg"></i>
                            @elseif($device->type == 'tablet')
                                <i class="fas fa-tablet-alt fa-lg"></i>
                            @elseif($device->type == 'phone')
                                <i class="fas fa-mobile-alt fa-lg"></i>
                            @else
                                <i class="fas fa-hdd fa-lg"></i>
                            @endif
                        </div>
                        <div>
                            <h5 class="mb-0 fw-bold">{{ $device->brand }} {{ $device->model }}</h5>
                            <span class="text-muted small">{{ $device->order_number }}</span>
                        </div>
                    </div>
                    <div>
                        @if($device->status == 'active')
                        <span class="device-badge device-status-active">
                            <i class="fas fa-check-circle me-1"></i> نشط
                        </span>
                        @elseif($device->status == 'inactive')
                        <span class="device-badge device-status-inactive">
                            <i class="fas fa-times-circle me-1"></i> غير نشط
                        </span>
                        @elseif($device->status == 'maintenance')
                        <span class="device-badge device-status-maintenance">
                            <i class="fas fa-tools me-1"></i> قيد الصيانة
                        </span>
                        @endif
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="device-info">
                    <div class="device-info-item">
                        <span class="device-info-label">الرقم التسلسلي:</span>
                        <span>{{ $device->serial_number }}</span>
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">تاريخ الفحص:</span>
                        <span>{{ $device->inspection_date->format('Y-m-d') }}</span>
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">حالة الضمان:</span>
                        @if($device->isUnderWarranty())
                        <span class="text-success">
                            <i class="fas fa-shield-alt me-1"></i> ساري المفعول
                            (متبقي {{ $device->warrantyDaysRemaining() }} يوم)
                        </span>
                        @else
                        <span class="text-danger">
                            <i class="fas fa-times-circle me-1"></i> منتهي
                        </span>
                        @endif
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">عدد التقارير:</span>
                        <span>{{ $device->reports->count() }}</span>
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">آخر صيانة:</span>
                        <span>
                            @if($device->maintenanceLogs->count() > 0)
                                {{ $device->maintenanceLogs->sortByDesc('maintenance_date')->first()->maintenance_date->format('Y-m-d') }}
                            @else
                                {{ $device->inspection_date->format('Y-m-d') }} (تاريخ الفحص)
                            @endif
                        </span>
                    </div>
                </div>
                
                <!-- Device Specs Summary -->
                <div class="mt-3">
                    <h6 class="mb-2">المواصفات الأساسية</h6>
                    <div class="row">
                        @if($device->technicalInspection)
                        <div class="col-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-microchip text-primary me-2"></i>
                                <span>{{ $device->technicalInspection->processor }}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-memory text-primary me-2"></i>
                                <span>{{ $device->technicalInspection->ram }}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-hdd text-primary me-2"></i>
                                <span>{{ $device->technicalInspection->storage }}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-tv text-primary me-2"></i>
                                <span>{{ $device->technicalInspection->display }}</span>
                            </div>
                        </div>
                        @else
                        <div class="col-12">
                            <p class="text-muted small">لا توجد معلومات فنية متاحة</p>
                        </div>
                        @endif
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex gap-2">
                    <a href="{{ route('client.devices.show', $device->id) }}" class="btn btn-sm btn-outline-primary flex-grow-1">
                        <i class="fas fa-info-circle me-1"></i> التفاصيل
                    </a>
                    <a href="{{ route('client.reports.index', ['device_id' => $device->id]) }}" class="btn btn-sm btn-primary flex-grow-1">
                        <i class="fas fa-file-alt me-1"></i> التقارير
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

<!-- Device Registration CTA -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-4 text-center">
                <div class="mb-3">
                    <div class="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-plus-circle text-primary fa-3x"></i>
                    </div>
                </div>
                <h4>هل لديك جهاز جديد؟</h4>
                <p class="text-muted mb-4">يمكنك تسجيل جهاز جديد لإضافته إلى قائمة أجهزتك والاستفادة من خدمات الصيانة والضمان.</p>
                <a href="{{ route('client.devices.register') }}" class="btn btn-primary">
                    <i class="fas fa-plus-circle me-1"></i> تسجيل جهاز جديد
                </a>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Device filtering
    const filterItems = document.querySelectorAll('.device-filter-item');
    const deviceItems = document.querySelectorAll('.device-item');
    
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            filterItems.forEach(filter => filter.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filter devices
            deviceItems.forEach(device => {
                if (filter === 'all' || device.getAttribute('data-type') === filter) {
                    device.style.display = 'block';
                } else {
                    device.style.display = 'none';
                }
            });
            
            // Show no results message if needed
            const visibleDevices = document.querySelectorAll('.device-item[style="display: block;"]');
            const noResultsElement = document.getElementById('noResultsMessage');
            
            if (visibleDevices.length === 0) {
                if (!noResultsElement) {
                    const container = document.getElementById('devicesContainer');
                    const noResults = document.createElement('div');
                    noResults.id = 'noResultsMessage';
                    noResults.className = 'col-12';
                    noResults.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i> لا توجد أجهزة مطابقة للفلتر المحدد.</div>';
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
