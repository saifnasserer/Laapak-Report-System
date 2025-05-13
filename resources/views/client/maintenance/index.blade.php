@extends('layouts.client')

@section('title', 'مواعيد الصيانة')

@section('page-title', 'مواعيد الصيانة الدورية')

@section('styles')
<style>
    .maintenance-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .maintenance-card:hover {
        transform: translateY(-5px);
    }
    .maintenance-badge {
        font-weight: bold;
        padding: 8px 12px;
        border-radius: 20px;
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
    .maintenance-info-card {
        border-radius: 10px;
        overflow: hidden;
        border-left: 4px solid;
    }
    .maintenance-info-card.regular {
        border-color: #198754;
    }
    .maintenance-info-card.emergency {
        border-color: #dc3545;
    }
    .maintenance-info-card.preventive {
        border-color: #0dcaf0;
    }
    .calendar-container {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        padding: 20px;
    }
    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
    }
    .calendar-day-name {
        text-align: center;
        font-weight: bold;
        padding: 10px 0;
    }
    .calendar-day {
        text-align: center;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        position: relative;
    }
    .calendar-day:hover {
        background-color: #f8f9fa;
    }
    .calendar-day.today {
        background-color: #e8f4f8;
        font-weight: bold;
    }
    .calendar-day.has-maintenance {
        position: relative;
    }
    .calendar-day.has-maintenance::after {
        content: '';
        position: absolute;
        bottom: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #0dcaf0;
    }
    .calendar-day.inactive {
        color: #adb5bd;
    }
</style>
@endsection

@section('content')
<!-- Maintenance Information -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title"><i class="fas fa-info-circle text-primary me-2"></i> معلومات الصيانة الدورية</h5>
                <p class="card-text">تقدم Laapak ثلاثة أنواع من خدمات الصيانة لعملائها:</p>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 maintenance-info-card regular">
                            <div class="card-body">
                                <h6 class="card-title text-success">
                                    <i class="fas fa-calendar-check me-2"></i> الصيانة الدورية
                                </h6>
                                <p class="card-text">صيانة دورية كل 6 أشهر للحفاظ على أداء الجهاز</p>
                                <ul class="small text-muted">
                                    <li>تنظيف الجهاز من الداخل والخارج</li>
                                    <li>فحص المكونات الداخلية</li>
                                    <li>تحديث البرامج والتعريفات</li>
                                    <li>تحسين أداء الجهاز</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 maintenance-info-card preventive">
                            <div class="card-body">
                                <h6 class="card-title text-info">
                                    <i class="fas fa-shield-alt me-2"></i> الصيانة الوقائية
                                </h6>
                                <p class="card-text">صيانة وقائية لتجنب المشاكل المستقبلية</p>
                                <ul class="small text-muted">
                                    <li>فحص شامل للجهاز</li>
                                    <li>تحديد المكونات التي قد تسبب مشاكل مستقبلية</li>
                                    <li>استبدال المكونات المعرضة للتلف</li>
                                    <li>تقديم توصيات للحفاظ على الجهاز</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 maintenance-info-card emergency">
                            <div class="card-body">
                                <h6 class="card-title text-danger">
                                    <i class="fas fa-exclamation-triangle me-2"></i> الصيانة الطارئة
                                </h6>
                                <p class="card-text">صيانة طارئة في حالة وجود مشاكل مفاجئة</p>
                                <ul class="small text-muted">
                                    <li>إصلاح الأعطال المفاجئة</li>
                                    <li>استبدال المكونات التالفة</li>
                                    <li>استعادة البيانات المفقودة (إن أمكن)</li>
                                    <li>تقديم حلول سريعة للمشاكل الطارئة</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Maintenance Calendar -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-calendar-alt text-primary me-2"></i> تقويم الصيانة</h5>
            </div>
            <div class="card-body">
                <div class="calendar-container">
                    <div class="calendar-header">
                        <button class="btn btn-sm btn-outline-secondary" id="prevMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <h5 class="mb-0" id="currentMonth">{{ date('F Y') }}</h5>
                        <button class="btn btn-sm btn-outline-secondary" id="nextMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                    <div class="calendar-grid" id="calendarDayNames">
                        <div class="calendar-day-name">الأحد</div>
                        <div class="calendar-day-name">الإثنين</div>
                        <div class="calendar-day-name">الثلاثاء</div>
                        <div class="calendar-day-name">الأربعاء</div>
                        <div class="calendar-day-name">الخميس</div>
                        <div class="calendar-day-name">الجمعة</div>
                        <div class="calendar-day-name">السبت</div>
                    </div>
                    <div class="calendar-grid" id="calendarDays">
                        <!-- Calendar days will be generated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Devices Maintenance Status -->
<div class="row">
    @forelse($devices as $device)
    <div class="col-md-6 mb-4">
        <div class="card border-0 shadow-sm maintenance-card">
            <div class="card-header bg-white border-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold">{{ $device->brand }} {{ $device->model }}</h5>
                    <span class="badge bg-primary">{{ $device->order_number }}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>آخر صيانة:</span>
                        <span class="fw-bold">
                            @if($device->maintenanceLogs->count() > 0)
                                {{ $device->maintenanceLogs->sortByDesc('maintenance_date')->first()->maintenance_date->format('Y-m-d') }}
                            @else
                                {{ $device->inspection_date->format('Y-m-d') }} (تاريخ الفحص)
                            @endif
                        </span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>موعد الصيانة القادمة:</span>
                        @php
                            $lastMaintenance = $device->maintenanceLogs->count() > 0 
                                ? $device->maintenanceLogs->sortByDesc('maintenance_date')->first()->maintenance_date 
                                : $device->inspection_date;
                            $nextMaintenance = $lastMaintenance->copy()->addMonths(6);
                            $daysUntilMaintenance = now()->diffInDays($nextMaintenance, false);
                        @endphp
                        <span class="fw-bold">{{ $nextMaintenance->format('Y-m-d') }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>الحالة:</span>
                        @if($daysUntilMaintenance < 0)
                            <span class="badge bg-danger maintenance-badge">
                                <i class="fas fa-exclamation-circle me-1"></i> متأخر {{ abs($daysUntilMaintenance) }} يوم
                            </span>
                        @elseif($daysUntilMaintenance <= 14)
                            <span class="badge bg-warning text-dark maintenance-badge">
                                <i class="fas fa-clock me-1"></i> قريباً ({{ $daysUntilMaintenance }} يوم)
                            </span>
                        @else
                            <span class="badge bg-success maintenance-badge">
                                <i class="fas fa-check-circle me-1"></i> متبقي {{ $daysUntilMaintenance }} يوم
                            </span>
                        @endif
                    </div>
                    
                    <!-- Maintenance Timeline -->
                    <div class="maintenance-timeline mt-4">
                        <h6 class="mb-3">سجل الصيانة</h6>
                        
                        <!-- Initial Inspection -->
                        <div class="maintenance-timeline-item completed">
                            <h6>الفحص الأولي</h6>
                            <p class="small mb-0">
                                {{ $device->inspection_date->format('Y-m-d') }}
                            </p>
                            <p class="small text-muted">
                                تم فحص الجهاز وإعداد التقرير الأولي
                            </p>
                        </div>
                        
                        <!-- Maintenance Logs -->
                        @foreach($device->maintenanceLogs->sortBy('maintenance_date') as $log)
                        <div class="maintenance-timeline-item completed">
                            <h6>{{ $log->maintenance_type }}</h6>
                            <p class="small mb-0">
                                {{ $log->maintenance_date->format('Y-m-d') }}
                            </p>
                            <p class="small text-muted">
                                {{ $log->notes }}
                            </p>
                        </div>
                        @endforeach
                        
                        <!-- Next Maintenance -->
                        <div class="maintenance-timeline-item {{ $daysUntilMaintenance < 0 ? 'overdue' : 'upcoming' }}">
                            <h6>الصيانة القادمة</h6>
                            <p class="small mb-0">
                                {{ $nextMaintenance->format('Y-m-d') }}
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
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex gap-2">
                    <a href="{{ route('client.devices.show', $device->id) }}" class="btn btn-sm btn-outline-primary flex-grow-1">
                        <i class="fas fa-info-circle me-1"></i> تفاصيل الجهاز
                    </a>
                    <a href="#" class="btn btn-sm btn-primary flex-grow-1" data-bs-toggle="modal" data-bs-target="#scheduleMaintenanceModal" data-device-id="{{ $device->id }}">
                        <i class="fas fa-calendar-plus me-1"></i> جدولة صيانة
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

<!-- Maintenance Tips -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-lightbulb text-warning me-2"></i> نصائح للحفاظ على جهازك</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-broom text-primary fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">الحفاظ على النظافة</h5>
                                </div>
                                <p>حافظ على نظافة جهازك من الخارج والداخل. استخدم قطعة قماش ناعمة لتنظيف الشاشة ولوحة المفاتيح بانتظام.</p>
                                <ul class="small text-muted">
                                    <li>استخدم هواء مضغوط لتنظيف لوحة المفاتيح</li>
                                    <li>استخدم قطعة قماش مبللة بالماء فقط لتنظيف الشاشة</li>
                                    <li>تجنب استخدام المواد الكيميائية القاسية</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-success bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-battery-three-quarters text-success fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">العناية بالبطارية</h5>
                                </div>
                                <p>احرص على العناية ببطارية جهازك للحفاظ على عمرها الافتراضي لأطول فترة ممكنة.</p>
                                <ul class="small text-muted">
                                    <li>تجنب تفريغ البطارية بالكامل بشكل متكرر</li>
                                    <li>حافظ على مستوى البطارية بين 20% و 80%</li>
                                    <li>تجنب استخدام الجهاز في درجات الحرارة المرتفعة</li>
                                    <li>افصل الشاحن عند اكتمال الشحن</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="rounded-circle bg-info bg-opacity-10 p-3 me-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-shield-alt text-info fa-2x"></i>
                                    </div>
                                    <h5 class="mb-0">الحماية من الفيروسات</h5>
                                </div>
                                <p>احرص على حماية جهازك من الفيروسات والبرامج الضارة باستخدام برامج الحماية المناسبة.</p>
                                <ul class="small text-muted">
                                    <li>استخدم برنامج مكافحة فيروسات موثوق</li>
                                    <li>قم بتحديث نظام التشغيل والبرامج بانتظام</li>
                                    <li>تجنب تنزيل البرامج من مصادر غير موثوقة</li>
                                    <li>احذر من رسائل البريد الإلكتروني المشبوهة</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Schedule Maintenance Modal -->
<div class="modal fade" id="scheduleMaintenanceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="fas fa-calendar-plus me-2"></i> جدولة موعد صيانة
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="scheduleMaintenanceForm" action="{{ route('client.maintenance.schedule') }}" method="POST">
                    @csrf
                    <input type="hidden" name="device_id" id="maintenanceDeviceId">
                    
                    <div class="mb-3">
                        <label for="maintenanceDate" class="form-label">تاريخ الصيانة</label>
                        <input type="date" class="form-control" id="maintenanceDate" name="maintenance_date" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="maintenanceType" class="form-label">نوع الصيانة</label>
                        <select class="form-select" id="maintenanceType" name="maintenance_type" required>
                            <option value="صيانة دورية">صيانة دورية</option>
                            <option value="صيانة وقائية">صيانة وقائية</option>
                            <option value="صيانة طارئة">صيانة طارئة</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="maintenanceNotes" class="form-label">ملاحظات</label>
                        <textarea class="form-control" id="maintenanceNotes" name="notes" rows="3" placeholder="أدخل أي ملاحظات أو تفاصيل إضافية هنا..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="submit" form="scheduleMaintenanceForm" class="btn btn-primary">
                    <i class="fas fa-calendar-check me-1"></i> تأكيد الموعد
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Calendar functionality
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Maintenance dates from devices
    const maintenanceDates = [
        @foreach($devices as $device)
            @php
                $lastMaintenance = $device->maintenanceLogs->count() > 0 
                    ? $device->maintenanceLogs->sortByDesc('maintenance_date')->first()->maintenance_date 
                    : $device->inspection_date;
                $nextMaintenance = $lastMaintenance->copy()->addMonths(6);
            @endphp
            "{{ $nextMaintenance->format('Y-m-d') }}",
        @endforeach
    ];
    
    function generateCalendar(month, year) {
        // Clear previous calendar
        calendarDays.innerHTML = '';
        
        // Update current month display
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay();
        
        // Get number of days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get number of days in previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Create calendar grid
        let date = 1;
        let nextMonthDate = 1;
        
        // Create rows for weeks
        for (let i = 0; i < 6; i++) {
            // Create days in week
            for (let j = 0; j < 7; j++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day');
                
                // Fill in previous month's days
                if (i === 0 && j < startingDay) {
                    const prevMonthDay = daysInPrevMonth - (startingDay - j - 1);
                    dayElement.textContent = prevMonthDay;
                    dayElement.classList.add('inactive');
                    calendarDays.appendChild(dayElement);
                }
                // Fill in current month's days
                else if (date <= daysInMonth) {
                    dayElement.textContent = date;
                    
                    // Check if this is today
                    const today = new Date();
                    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        dayElement.classList.add('today');
                    }
                    
                    // Check if this day has maintenance
                    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    if (maintenanceDates.includes(currentDateStr)) {
                        dayElement.classList.add('has-maintenance');
                        dayElement.setAttribute('data-bs-toggle', 'tooltip');
                        dayElement.setAttribute('data-bs-placement', 'top');
                        dayElement.setAttribute('title', 'موعد صيانة');
                    }
                    
                    date++;
                    calendarDays.appendChild(dayElement);
                }
                // Fill in next month's days
                else {
                    dayElement.textContent = nextMonthDate;
                    dayElement.classList.add('inactive');
                    nextMonthDate++;
                    calendarDays.appendChild(dayElement);
                }
            }
        }
        
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Generate initial calendar
    generateCalendar(currentMonth, currentYear);
    
    // Previous month button
    prevMonthButton.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    // Next month button
    nextMonthButton.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    // Schedule maintenance modal
    const scheduleMaintenanceModal = document.getElementById('scheduleMaintenanceModal');
    if (scheduleMaintenanceModal) {
        scheduleMaintenanceModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const deviceId = button.getAttribute('data-device-id');
            document.getElementById('maintenanceDeviceId').value = deviceId;
            
            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
            document.getElementById('maintenanceDate').value = tomorrowFormatted;
            document.getElementById('maintenanceDate').min = tomorrowFormatted;
        });
    }
});
</script>
@endsection
