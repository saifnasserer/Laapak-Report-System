@extends('layouts.client')

@section('title', 'تقارير الفحص')

@section('page-title', 'تقارير الفحص')

@section('styles')
<style>
    .report-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .report-card:hover {
        transform: translateY(-5px);
    }
    .report-badge {
        font-weight: bold;
        padding: 8px 12px;
        border-radius: 20px;
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
    .report-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .report-passed {
        background-color: #f0f8f0;
        color: #198754;
    }
    .report-failed {
        background-color: #f8d7da;
        color: #dc3545;
    }
    .report-conditional {
        background-color: #fff3cd;
        color: #ffc107;
    }
    .report-info-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    .report-info-item:last-child {
        border-bottom: none;
    }
    .report-info-label {
        color: #6c757d;
    }
    .report-filter {
        display: flex;
        align-items: center;
        background-color: #f8f9fa;
        border-radius: 50px;
        padding: 5px;
        margin-bottom: 20px;
    }
    .report-filter-item {
        flex: 1;
        text-align: center;
        padding: 8px 15px;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    .report-filter-item.active {
        background-color: #0d6efd;
        color: white;
    }
    .report-stats-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .report-stats-card:hover {
        transform: translateY(-5px);
    }
    .report-stats-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-right: 15px;
    }
    .report-stats-total {
        background-color: #e8f0fe;
        color: #0d6efd;
    }
    .report-stats-passed {
        background-color: #d1e7dd;
        color: #0a3622;
    }
    .report-stats-failed {
        background-color: #f8d7da;
        color: #842029;
    }
    .report-search {
        position: relative;
    }
    .report-search .form-control {
        padding-right: 40px;
        border-radius: 50px;
    }
    .report-search .search-icon {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
    }
</style>
@endsection

@section('content')
<!-- Report Statistics -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title mb-4"><i class="fas fa-chart-pie text-primary me-2"></i> إحصائيات التقارير</h5>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm report-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="report-stats-icon report-stats-total">
                                        <i class="fas fa-file-alt fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">إجمالي التقارير</h6>
                                        <h3 class="mb-0">{{ $reports->count() }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm report-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="report-stats-icon report-stats-passed">
                                        <i class="fas fa-check-circle fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">اجتياز</h6>
                                        <h3 class="mb-0">{{ $passedReports }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-0 shadow-sm report-stats-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="report-stats-icon report-stats-failed">
                                        <i class="fas fa-times-circle fa-lg"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 text-muted">عدم اجتياز</h6>
                                        <h3 class="mb-0">{{ $failedReports }}</h3>
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

<!-- Search and Filter -->
<div class="row mb-4">
    <div class="col-md-6 mb-3">
        <div class="report-search">
            <input type="text" class="form-control" id="reportSearch" placeholder="البحث عن تقرير...">
            <span class="search-icon"><i class="fas fa-search"></i></span>
        </div>
    </div>
    <div class="col-md-6 mb-3">
        <div class="report-filter">
            <div class="report-filter-item active" data-filter="all">الكل</div>
            <div class="report-filter-item" data-filter="passed">اجتياز</div>
            <div class="report-filter-item" data-filter="conditional">اجتياز مشروط</div>
            <div class="report-filter-item" data-filter="failed">عدم اجتياز</div>
        </div>
    </div>
</div>

<!-- Reports List -->
<div class="row" id="reportsContainer">
    @forelse($reports as $report)
    <div class="col-md-6 mb-4 report-item" data-status="{{ $report->status }}">
        <div class="card border-0 shadow-sm report-card">
            <div class="card-header bg-white border-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="report-icon 
                            @if($report->status == 'passed') report-passed
                            @elseif($report->status == 'failed') report-failed
                            @elseif($report->status == 'conditional') report-conditional
                            @endif">
                            @if($report->status == 'passed')
                                <i class="fas fa-check-circle fa-lg"></i>
                            @elseif($report->status == 'failed')
                                <i class="fas fa-times-circle fa-lg"></i>
                            @elseif($report->status == 'conditional')
                                <i class="fas fa-exclamation-circle fa-lg"></i>
                            @endif
                        </div>
                        <div>
                            <h5 class="mb-0 fw-bold">تقرير #{{ $report->report_number }}</h5>
                            <span class="text-muted small">{{ $report->device->brand }} {{ $report->device->model }}</span>
                        </div>
                    </div>
                    <span class="report-badge 
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
                    </span>
                </div>
            </div>
            <div class="card-body">
                <div class="report-info-item">
                    <span class="report-info-label">تاريخ الفحص:</span>
                    <span>{{ $report->inspection_date->format('Y-m-d') }}</span>
                </div>
                <div class="report-info-item">
                    <span class="report-info-label">الفني:</span>
                    <span>{{ $report->technician->name }}</span>
                </div>
                <div class="report-info-item">
                    <span class="report-info-label">المشاكل المكتشفة:</span>
                    <span>{{ $report->issues_count ?? 0 }}</span>
                </div>
                <div class="report-info-item">
                    <span class="report-info-label">الاختبارات الناجحة:</span>
                    <span>{{ $report->passed_tests ?? 0 }} / {{ $report->total_tests ?? 0 }}</span>
                </div>
            </div>
            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex gap-2">
                    <a href="{{ route('client.reports.show', $report->id) }}" class="btn btn-sm btn-primary flex-grow-1">
                        <i class="fas fa-eye me-1"></i> عرض التقرير
                    </a>
                    <a href="{{ route('client.reports.download', $report->id) }}" class="btn btn-sm btn-outline-primary flex-grow-1">
                        <i class="fas fa-download me-1"></i> تحميل PDF
                    </a>
                </div>
            </div>
        </div>
    </div>
    @empty
    <div class="col-12">
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> لا توجد تقارير متاحة حالياً.
        </div>
    </div>
    @endforelse
</div>

<!-- Pagination -->
@if($reports->hasPages())
<div class="d-flex justify-content-center mt-4">
    {{ $reports->links() }}
</div>
@endif
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Report filtering
    const filterItems = document.querySelectorAll('.report-filter-item');
    const reportItems = document.querySelectorAll('.report-item');
    
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            filterItems.forEach(filter => filter.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filter reports
            reportItems.forEach(report => {
                if (filter === 'all' || report.getAttribute('data-status') === filter) {
                    report.style.display = 'block';
                } else {
                    report.style.display = 'none';
                }
            });
            
            // Show no results message if needed
            const visibleReports = document.querySelectorAll('.report-item[style="display: block;"]');
            const noResultsElement = document.getElementById('noResultsMessage');
            
            if (visibleReports.length === 0) {
                if (!noResultsElement) {
                    const container = document.getElementById('reportsContainer');
                    const noResults = document.createElement('div');
                    noResults.id = 'noResultsMessage';
                    noResults.className = 'col-12';
                    noResults.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i> لا توجد تقارير مطابقة للفلتر المحدد.</div>';
                    container.appendChild(noResults);
                }
            } else if (noResultsElement) {
                noResultsElement.remove();
            }
        });
    });
    
    // Report search
    const searchInput = document.getElementById('reportSearch');
    
    searchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        
        reportItems.forEach(report => {
            const reportText = report.textContent.toLowerCase();
            
            if (reportText.includes(searchTerm)) {
                report.style.display = 'block';
            } else {
                report.style.display = 'none';
            }
        });
        
        // Show no results message if needed
        const visibleReports = document.querySelectorAll('.report-item[style="display: block;"]');
        const noResultsElement = document.getElementById('noResultsMessage');
        
        if (visibleReports.length === 0) {
            if (!noResultsElement) {
                const container = document.getElementById('reportsContainer');
                const noResults = document.createElement('div');
                noResults.id = 'noResultsMessage';
                noResults.className = 'col-12';
                noResults.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i> لا توجد تقارير مطابقة لعملية البحث.</div>';
                container.appendChild(noResults);
            }
        } else if (noResultsElement) {
            noResultsElement.remove();
        }
    });
});
</script>
@endsection
