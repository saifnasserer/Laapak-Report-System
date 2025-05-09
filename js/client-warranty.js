/**
 * Laapak Report System - Client Warranty JavaScript
 * Handles warranty calculations and display
 */

/**
 * Display warranty information for client reports
 */
function displayWarrantyInfo(reports) {
    const warrantyList = document.getElementById('warrantyList');
    
    if (!warrantyList || reports.length === 0) {
        return;
    }
    
    // Clear existing content
    warrantyList.innerHTML = '';
    
    // Current date for calculations
    const currentDate = new Date();
    
    // Process each report for warranty info
    reports.forEach(report => {
        // Create warranty card
        const reportDate = new Date(report.creationDate);
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Calculate warranty dates and status
        const manufacturingWarranty = calculateManufacturingWarranty(reportDate, currentDate);
        const replacementWarranty = calculateReplacementWarranty(reportDate, currentDate);
        const maintenanceWarranty = calculateMaintenanceWarranty(reportDate, currentDate);
        
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
                    <h6 class="mb-3">حالة الضمان:</h6>
                    
                    <!-- Manufacturing Warranty -->
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span><i class="fas fa-cog me-2"></i> ضمان عيوب الصناعة</span>
                            <span class="badge ${manufacturingWarranty.active ? 'warranty-active' : 'warranty-expired'} px-3 py-2 rounded-pill">
                                ${manufacturingWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="mb-1 d-flex justify-content-between small">
                            <span>${manufacturingWarranty.active ? `متبقي ${manufacturingWarranty.daysRemaining} يوم` : 'منتهي الصلاحية'}</span>
                            <span>${formatDate(manufacturingWarranty.endDate)}</span>
                        </div>
                        <div class="progress warranty-progress">
                            <div class="progress-bar bg-success" style="width: ${manufacturingWarranty.percentRemaining}%"></div>
                        </div>
                    </div>
                    
                    <!-- Replacement Warranty -->
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span><i class="fas fa-exchange-alt me-2"></i> ضمان الاستبدال</span>
                            <span class="badge ${replacementWarranty.active ? 'warranty-active' : 'warranty-expired'} px-3 py-2 rounded-pill">
                                ${replacementWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="mb-1 d-flex justify-content-between small">
                            <span>${replacementWarranty.active ? `متبقي ${replacementWarranty.daysRemaining} يوم` : 'منتهي الصلاحية'}</span>
                            <span>${formatDate(replacementWarranty.endDate)}</span>
                        </div>
                        <div class="progress warranty-progress">
                            <div class="progress-bar bg-warning" style="width: ${replacementWarranty.percentRemaining}%"></div>
                        </div>
                    </div>
                    
                    <!-- Maintenance Warranty -->
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span><i class="fas fa-tools me-2"></i> ضمان الصيانة الدورية</span>
                            <span class="badge ${maintenanceWarranty.active ? 'warranty-active' : 'warranty-expired'} px-3 py-2 rounded-pill">
                                ${maintenanceWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="mb-1 d-flex justify-content-between small">
                            <span>${maintenanceWarranty.active ? `متبقي ${maintenanceWarranty.daysRemaining} يوم` : 'منتهي الصلاحية'}</span>
                            <span>${formatDate(maintenanceWarranty.endDate)}</span>
                        </div>
                        <div class="progress warranty-progress">
                            <div class="progress-bar bg-info" style="width: ${maintenanceWarranty.percentRemaining}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        warrantyList.appendChild(col);
    });
}

/**
 * Calculate manufacturing warranty status (6 months)
 */
function calculateManufacturingWarranty(reportDate, currentDate) {
    // Manufacturing warranty: 6 months from report date
    const endDate = new Date(reportDate);
    endDate.setMonth(endDate.getMonth() + 6);
    
    const active = currentDate <= endDate;
    const totalDays = 6 * 30; // Approximately 6 months in days
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Calculate replacement warranty status (14 days)
 */
function calculateReplacementWarranty(reportDate, currentDate) {
    // Replacement warranty: 14 days from report date
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 14);
    
    const active = currentDate <= endDate;
    const totalDays = 14;
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Calculate maintenance warranty status (1 year)
 */
function calculateMaintenanceWarranty(reportDate, currentDate) {
    // Maintenance warranty: 1 year from report date
    const endDate = new Date(reportDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const active = currentDate <= endDate;
    const totalDays = 365; // Approximately 1 year in days
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Format date to locale string
 */
function formatDate(date) {
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
