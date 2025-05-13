@extends('layouts.client')

@section('title', 'لوحة التحكم')

@section('page-title', 'لوحة التحكم')

@section('styles')
<style>
    .dashboard-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .dashboard-card:hover {
        transform: translateY(-5px);
    }
    .dashboard-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .dashboard-devices {
        background-color: #e8f0fe;
        color: #0d6efd;
    }
    .dashboard-reports {
        background-color: #f0f8f0;
        color: #198754;
    }
    .dashboard-warranty {
        background-color: #fff3cd;
        color: #664d03;
    }
    .dashboard-maintenance {
        background-color: #e8f4f8;
        color: #0dcaf0;
    }
    .dashboard-invoices {
        background-color: #f8f0fc;
        color: #d63384;
    }
    .dashboard-stats-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .dashboard-stats-card:hover {
        transform: translateY(-5px);
    }
    .dashboard-stats-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .dashboard-stats-devices {
        background-color: #e8f0fe;
        color: #0d6efd;
    }
    .dashboard-stats-reports {
        background-color: #f0f8f0;
        color: #198754;
    }
    .dashboard-stats-warranty {
        background-color: #fff3cd;
        color: #664d03;
    }
    .dashboard-stats-invoices {
        background-color: #f8f0fc;
        color: #d63384;
    }
    .recent-item {
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.3s ease;
    }
    .recent-item:last-child {
        border-bottom: none;
    }
    .recent-item:hover {
        background-color: #f8f9fa;
    }
    .recent-item-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        margin-right: 15px;
    }
    .recent-item-report {
        background-color: #f0f8f0;
        color: #198754;
    }
    .recent-item-maintenance {
        background-color: #e8f4f8;
        color: #0dcaf0;
    }
    .recent-item-invoice {
        background-color: #f8f0fc;
        color: #d63384;
    }
    .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #dc3545;
        color: white;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .maintenance-timeline {
        position: relative;
        padding-left: 30px;
    }
    .maintenance-timeline::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 0;
        height: 100%;
        width: 2px;
        background-color: #dee2e6;
    }
    .maintenance-timeline-item {
        position: relative;
        padding-bottom: 25px;
    }
    .maintenance-timeline-item:last-child {
        padding-bottom: 0;
    }
    .maintenance-timeline-item::before {
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
    .maintenance-timeline-item.completed::before {
        background-color: #198754;
        border-color: #198754;
    }
    .maintenance-timeline-item.upcoming::before {
        background-color: #0dcaf0;
        border-color: #0dcaf0;
    }
    .maintenance-timeline-item.overdue::before {
        background-color: #dc3545;
        border-color: #dc3545;
    }
</style>
@endsection

@section('content')
<!-- Welcome Message -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3" style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user text-primary fa-2x"></i>
                    </div>
                    <div>
                        <h4 class="mb-1">مرحباً، {{ Auth::guard('client')->user()->name }}</h4>
                        <p class="text-muted mb-0">آخر تسجيل دخول: {{ Auth::guard('client')->user()->last_login_at ? Auth::guard('client')->user()->last_login_at->format('Y-m-d H:i') : 'لم يتم تسجيل الدخول من قبل' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dashboard Stats -->
<div class="row mb-4">
    <div class="col-md-3 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-stats-card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="dashboard-stats-icon dashboard-stats-devices">
                        <i class="fas fa-laptop fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-muted">الأجهزة</h6>
                        <h3 class="mb-0">{{ $devices->count() }}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-stats-card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="dashboard-stats-icon dashboard-stats-reports">
                        <i class="fas fa-file-alt fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-muted">التقارير</h6>
                        <h3 class="mb-0">{{ $reports->count() }}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-stats-card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="dashboard-stats-icon dashboard-stats-warranty">
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
    <div class="col-md-3 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-stats-card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="dashboard-stats-icon dashboard-stats-invoices">
                        <i class="fas fa-file-invoice-dollar fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-muted">الفواتير</h6>
                        <h3 class="mb-0">{{ $invoices->count() }}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dashboard Quick Links -->
<div class="row mb-4">
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon dashboard-devices">
                        <i class="fas fa-laptop fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">أجهزتي</h5>
                        <p class="text-muted mb-0">إدارة الأجهزة المسجلة</p>
                    </div>
                </div>
                <p>يمكنك عرض وإدارة جميع أجهزتك المسجلة في النظام.</p>
                <a href="{{ route('client.devices.index') }}" class="btn btn-primary">
                    <i class="fas fa-laptop me-1"></i> عرض الأجهزة
                </a>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon dashboard-reports">
                        <i class="fas fa-file-alt fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">التقارير</h5>
                        <p class="text-muted mb-0">عرض تقارير الفحص</p>
                    </div>
                </div>
                <p>يمكنك عرض جميع تقارير الفحص الخاصة بأجهزتك.</p>
                <a href="{{ route('client.reports.index') }}" class="btn btn-success">
                    <i class="fas fa-file-alt me-1"></i> عرض التقارير
                </a>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon dashboard-warranty">
                        <i class="fas fa-shield-alt fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">الضمان</h5>
                        <p class="text-muted mb-0">معلومات الضمان</p>
                    </div>
                </div>
                <p>يمكنك عرض معلومات الضمان الخاصة بأجهزتك.</p>
                <a href="{{ route('client.warranty.index') }}" class="btn btn-warning text-dark">
                    <i class="fas fa-shield-alt me-1"></i> عرض الضمان
                </a>
            </div>
        </div>
    </div>
</div>

<div class="row mb-4">
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon dashboard-maintenance">
                        <i class="fas fa-tools fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">الصيانة</h5>
                        <p class="text-muted mb-0">جدولة وعرض مواعيد الصيانة</p>
                    </div>
                </div>
                <p>يمكنك جدولة مواعيد الصيانة وعرض سجل الصيانة الخاص بأجهزتك.</p>
                <a href="{{ route('client.maintenance.index') }}" class="btn btn-info">
                    <i class="fas fa-tools me-1"></i> عرض الصيانة
                </a>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon dashboard-invoices">
                        <i class="fas fa-file-invoice-dollar fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">الفواتير</h5>
                        <p class="text-muted mb-0">عرض ودفع الفواتير</p>
                    </div>
                </div>
                <p>يمكنك عرض ودفع الفواتير الخاصة بك.</p>
                <a href="{{ route('client.invoices.index') }}" class="btn btn-primary">
                    <i class="fas fa-file-invoice-dollar me-1"></i> عرض الفواتير
                </a>
            </div>
        </div>
    </div>
    <div class="col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm dashboard-card">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="dashboard-icon" style="background-color: #f0f0f0; color: #6c757d;">
                        <i class="fas fa-user-cog fa-lg"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">الملف الشخصي</h5>
                        <p class="text-muted mb-0">إدارة معلوماتك الشخصية</p>
                    </div>
                </div>
                <p>يمكنك عرض وتعديل معلوماتك الشخصية وتغيير كلمة المرور.</p>
                <a href="{{ route('client.profile') }}" class="btn btn-secondary">
                    <i class="fas fa-user-cog me-1"></i> الملف الشخصي
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Recent Activities and Upcoming Maintenance -->
<div class="row">
    <div class="col-md-6 mb-4">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-history text-primary me-2"></i> آخر النشاطات</h5>
            </div>
            <div class="card-body p-0">
                @forelse($recentActivities as $activity)
                <div class="recent-item">
                    <div class="d-flex align-items-center">
                        <div class="recent-item-icon 
                            @if($activity->type == 'report') recent-item-report
                            @elseif($activity->type == 'maintenance') recent-item-maintenance
                            @elseif($activity->type == 'invoice') recent-item-invoice
                            @endif">
                            @if($activity->type == 'report')
                                <i class="fas fa-file-alt"></i>
                            @elseif($activity->type == 'maintenance')
                                <i class="fas fa-tools"></i>
                            @elseif($activity->type == 'invoice')
                                <i class="fas fa-file-invoice-dollar"></i>
                            @endif
                        </div>
                        <div>
                            <h6 class="mb-0">{{ $activity->title }}</h6>
                            <p class="text-muted mb-0 small">{{ $activity->created_at->format('Y-m-d H:i') }}</p>
                        </div>
                    </div>
                </div>
                @empty
                <div class="p-4 text-center">
                    <p class="text-muted mb-0">لا توجد نشاطات حديثة</p>
                </div>
                @endforelse
            </div>
            @if($recentActivities->count() > 0)
            <div class="card-footer bg-white border-0 text-center">
                <a href="#" class="btn btn-sm btn-outline-primary">عرض جميع النشاطات</a>
            </div>
            @endif
        </div>
    </div>
    <div class="col-md-6 mb-4">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-calendar-alt text-primary me-2"></i> مواعيد الصيانة القادمة</h5>
            </div>
            <div class="card-body">
                <div class="maintenance-timeline">
                    @forelse($upcomingMaintenance as $maintenance)
                    @php
                        $daysUntilMaintenance = now()->diffInDays($maintenance->maintenance_date, false);
                    @endphp
                    <div class="maintenance-timeline-item {{ $daysUntilMaintenance < 0 ? 'overdue' : 'upcoming' }}">
                        <h6>{{ $maintenance->device->brand }} {{ $maintenance->device->model }}</h6>
                        <p class="small mb-0">
                            {{ $maintenance->maintenance_date->format('Y-m-d') }} - {{ $maintenance->maintenance_type }}
                        </p>
                        <p class="small text-muted">
                            @if($daysUntilMaintenance < 0)
                                <span class="text-danger">متأخر {{ abs($daysUntilMaintenance) }} يوم</span>
                            @elseif($daysUntilMaintenance <= 14)
                                <span class="text-warning">قريباً ({{ $daysUntilMaintenance }} يوم)</span>
                            @else
                                <span class="text-success">متبقي {{ $daysUntilMaintenance }} يوم</span>
                            @endif
                        </p>
                    </div>
                    @empty
                    <div class="text-center">
                        <p class="text-muted mb-0">لا توجد مواعيد صيانة قادمة</p>
                    </div>
                    @endforelse
                </div>
            </div>
            @if($upcomingMaintenance->count() > 0)
            <div class="card-footer bg-white border-0 text-center">
                <a href="{{ route('client.maintenance.index') }}" class="btn btn-sm btn-outline-primary">عرض جميع المواعيد</a>
            </div>
            @endif
        </div>
    </div>
</div>

<!-- Notifications -->
@if($notifications->count() > 0)
<div class="row">
    <div class="col-12 mb-4">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-bell text-primary me-2"></i> الإشعارات</h5>
            </div>
            <div class="card-body p-0">
                @foreach($notifications as $notification)
                <div class="recent-item">
                    <div class="d-flex align-items-center">
                        <div class="recent-item-icon" style="background-color: #f8d7da; color: #dc3545;">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">{{ $notification->title }}</h6>
                            <p class="mb-0">{{ $notification->message }}</p>
                            <p class="text-muted mb-0 small">{{ $notification->created_at->format('Y-m-d H:i') }}</p>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            <div class="card-footer bg-white border-0 text-center">
                <a href="#" class="btn btn-sm btn-outline-primary">عرض جميع الإشعارات</a>
            </div>
        </div>
    </div>
</div>
@endif
@endsection
