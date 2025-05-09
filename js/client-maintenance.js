/**
 * Laapak Report System - Client Maintenance JavaScript
 * Handles maintenance schedule calculations and display
 */

/**
 * Display maintenance schedule for client reports
 */
function displayMaintenanceSchedule(reports) {
    const maintenanceList = document.getElementById('maintenanceList');
    
    if (!maintenanceList || reports.length === 0) {
        return;
    }
    
    // Clear existing content
    maintenanceList.innerHTML = '';
    
    // Current date for calculations
    const currentDate = new Date();
    
    // Process each report for maintenance schedule
    reports.forEach(report => {
        // Create maintenance card
        const reportDate = new Date(report.creationDate);
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Calculate maintenance schedules
        const firstMaintenance = calculateMaintenanceDate(reportDate, 1);
        const secondMaintenance = calculateMaintenanceDate(reportDate, 2);
        
        // Determine maintenance status
        const firstStatus = getMaintenanceStatus(firstMaintenance.date, currentDate);
        const secondStatus = getMaintenanceStatus(secondMaintenance.date, currentDate);
        
        col.innerHTML = `
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-light">
                    <h6 class="mb-0 d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-laptop me-2"></i> ${report.brand} ${report.model}</span>
                        <small class="text-muted">رقم التقرير: ${report.id}</small>
                    </h6>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">تاريخ التقرير:</span>
                            <span>${formatDate(reportDate)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">الرقم التسلسلي:</span>
                            <span>${report.serialNumber}</span>
                        </div>
                    </div>
                    <hr>
                    <h6 class="mb-3">جدول الصيانة الدورية:</h6>
                    
                    <!-- First Maintenance -->
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold"><i class="fas fa-tools me-2"></i> الصيانة الدورية الأولى</span>
                            <span class="maintenance-badge ${getMaintenanceBadgeClass(firstStatus)}">
                                ${getMaintenanceStatusText(firstStatus)}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between small">
                            <span>بعد 6 أشهر من تاريخ التقرير</span>
                            <span>${formatDate(firstMaintenance.date)}</span>
                        </div>
                        ${firstMaintenance.completed ? 
                            `<div class="alert alert-success mt-2 p-2 small">
                                <i class="fas fa-check-circle me-2"></i> تمت الصيانة بتاريخ ${formatDate(firstMaintenance.completedDate || new Date())}
                            </div>` : 
                            `<div class="mt-2">
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar ${getMaintenanceProgressClass(firstStatus)}" 
                                        style="width: ${firstMaintenance.percentPassed}%"></div>
                                </div>
                                <div class="d-flex justify-content-between small mt-1">
                                    <span>تاريخ التقرير</span>
                                    <span>موعد الصيانة</span>
                                </div>
                            </div>`
                        }
                    </div>
                    
                    <!-- Second Maintenance -->
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold"><i class="fas fa-tools me-2"></i> الصيانة الدورية الثانية</span>
                            <span class="maintenance-badge ${getMaintenanceBadgeClass(secondStatus)}">
                                ${getMaintenanceStatusText(secondStatus)}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between small">
                            <span>بعد 12 شهر من تاريخ التقرير</span>
                            <span>${formatDate(secondMaintenance.date)}</span>
                        </div>
                        ${secondMaintenance.completed ? 
                            `<div class="alert alert-success mt-2 p-2 small">
                                <i class="fas fa-check-circle me-2"></i> تمت الصيانة بتاريخ ${formatDate(secondMaintenance.completedDate || new Date())}
                            </div>` : 
                            `<div class="mt-2">
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar ${getMaintenanceProgressClass(secondStatus)}" 
                                        style="width: ${secondMaintenance.percentPassed}%"></div>
                                </div>
                                <div class="d-flex justify-content-between small mt-1">
                                    <span>تاريخ التقرير</span>
                                    <span>موعد الصيانة</span>
                                </div>
                            </div>`
                        }
                    </div>
                    
                    ${isMaintenanceWarrantyActive(reportDate, currentDate) ? '' : 
                        `<div class="alert alert-warning mt-3 p-2 small">
                            <i class="fas fa-exclamation-triangle me-2"></i> انتهت فترة الضمان للصيانة الدورية
                        </div>`
                    }
                </div>
                <div class="card-footer bg-light">
                    <button type="button" class="btn btn-sm btn-outline-primary w-100" 
                        onclick="scheduleMaintenance('${report.id}')">
                        <i class="fas fa-calendar-plus me-2"></i> حجز موعد للصيانة
                    </button>
                </div>
            </div>
        `;
        
        maintenanceList.appendChild(col);
    });
}

/**
 * Calculate maintenance date
 * @param {Date} reportDate - Report creation date
 * @param {number} period - Maintenance period (1 for first at 6 months, 2 for second at 12 months)
 */
function calculateMaintenanceDate(reportDate, period) {
    const maintenanceDate = new Date(reportDate);
    maintenanceDate.setMonth(maintenanceDate.getMonth() + (period * 6));
    
    const currentDate = new Date();
    const totalDays = period * 6 * 30; // Approximate days for 6 or 12 months
    const daysPassed = Math.ceil((currentDate - reportDate) / (1000 * 60 * 60 * 24));
    const percentPassed = (daysPassed / totalDays) * 100;
    
    // For demo purposes, randomly mark some maintenances as completed
    const isCompleted = Math.random() > 0.7 && daysPassed > totalDays;
    const completedDate = isCompleted ? new Date(maintenanceDate.getTime() + (Math.random() * 10 * 24 * 60 * 60 * 1000)) : null;
    
    return {
        date: maintenanceDate,
        completed: isCompleted,
        completedDate: completedDate,
        percentPassed: Math.min(Math.max(percentPassed, 0), 100)
    };
}

/**
 * Get maintenance status based on date comparison
 */
function getMaintenanceStatus(maintenanceDate, currentDate) {
    const daysUntilMaintenance = Math.ceil((maintenanceDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysUntilMaintenance < 0) {
        return 'overdue';
    } else if (daysUntilMaintenance <= 14) {
        return 'due-soon';
    } else {
        return 'upcoming';
    }
}

/**
 * Get CSS class for maintenance status badge
 */
function getMaintenanceBadgeClass(status) {
    switch (status) {
        case 'overdue':
            return 'bg-danger';
        case 'due-soon':
            return 'bg-warning text-dark';
        case 'upcoming':
            return 'bg-info text-dark';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get text for maintenance status
 */
function getMaintenanceStatusText(status) {
    switch (status) {
        case 'overdue':
            return 'متأخرة';
        case 'due-soon':
            return 'قريباً';
        case 'upcoming':
            return 'مجدولة';
        default:
            return 'غير محدد';
    }
}

/**
 * Get CSS class for maintenance progress bar
 */
function getMaintenanceProgressClass(status) {
    switch (status) {
        case 'overdue':
            return 'bg-danger';
        case 'due-soon':
            return 'bg-warning';
        case 'upcoming':
            return 'bg-info';
        default:
            return 'bg-secondary';
    }
}

/**
 * Check if maintenance warranty is still active
 */
function isMaintenanceWarrantyActive(reportDate, currentDate) {
    const warrantyEndDate = new Date(reportDate);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
    return currentDate <= warrantyEndDate;
}

/**
 * Schedule maintenance appointment (placeholder function)
 */
function scheduleMaintenance(reportId) {
    alert(`سيتم التواصل معك قريباً لتحديد موعد الصيانة للتقرير رقم: ${reportId}`);
}
