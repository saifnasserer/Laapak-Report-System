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
        // Find newest device report (will be highlighted)
        const reportDate = new Date(report.inspection_date || report.created_at);
        const isNewest = reportDate.getTime() === Math.max(...reports.map(r => new Date(r.inspection_date || r.created_at).getTime()));
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Calculate warranty dates and status
        const manufacturingWarranty = calculateManufacturingWarranty(reportDate, currentDate);
        const replacementWarranty = calculateReplacementWarranty(reportDate, currentDate);
        const maintenanceWarranty = calculateMaintenanceWarranty(reportDate, currentDate);
        
        // Determine the primary warranty status for highlighting
        const primaryWarrantyActive = manufacturingWarranty.active || replacementWarranty.active || maintenanceWarranty.active;
        
        col.innerHTML = `
            <div class="card h-100 border-0 ${isNewest ? 'shadow-lg' : 'shadow-sm'}">
                <div class="card-body p-4">
                    ${isNewest ? '<div class="position-absolute end-0 top-0 mt-2 me-3"><i class="fas fa-circle text-warning"></i></div>' : ''}
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold">${report.device_model || 'جهاز غير محدد'}</h5>
                        <span class="badge ${primaryWarrantyActive ? 'bg-success' : 'bg-danger'} rounded-pill px-3">
                            ${primaryWarrantyActive ? 'الضمان ساري' : 'الضمان منتهي'}
                        </span>
                    </div>
                    
                    <div class="d-flex justify-content-between text-muted small mb-4">
                        <span><i class="fas fa-calendar-alt me-1"></i> ${formatGregorianDate(reportDate)}</span>
                        ${report.serial_number ? `<span><i class="fas fa-barcode me-1"></i> ${report.serial_number}</span>` : ''}
                    </div>
                    
                    <!-- Manufacturing Warranty -->
                    <div class="warranty-item mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <i class="fas fa-cog me-2 ${manufacturingWarranty.active ? 'text-success' : 'text-muted'}"></i>
                                <span class="${manufacturingWarranty.active ? 'text-dark' : 'text-muted'}">ضمان عيوب الصناعة</span>
                            </div>
                            <span class="badge ${manufacturingWarranty.active ? 'bg-success' : 'bg-secondary'} rounded-pill px-2 py-1">
                                ${manufacturingWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="progress mb-1" style="height:5px;">
                            <div class="progress-bar ${manufacturingWarranty.active ? 'bg-success' : 'bg-secondary'}" 
                                 style="width: ${manufacturingWarranty.percentRemaining}%"></div>
                        </div>
                        <div class="d-flex justify-content-between small text-muted">
                            <div>${manufacturingWarranty.active ? `${manufacturingWarranty.daysRemaining} يوم` : 'منتهي'}</div>
                            <div>${formatGregorianDate(manufacturingWarranty.endDate)}</div>
                        </div>
                    </div>
                    
                    <!-- Replacement Warranty -->
                    <div class="warranty-item mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <i class="fas fa-exchange-alt me-2 ${replacementWarranty.active ? 'text-success' : 'text-muted'}"></i>
                                <span class="${replacementWarranty.active ? 'text-dark' : 'text-muted'}">ضمان الاستبدال</span>
                            </div>
                            <span class="badge ${replacementWarranty.active ? 'bg-success' : 'bg-secondary'} rounded-pill px-2 py-1">
                                ${replacementWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="progress mb-1" style="height:5px;">
                            <div class="progress-bar ${replacementWarranty.active ? 'bg-success' : 'bg-secondary'}" 
                                 style="width: ${replacementWarranty.percentRemaining}%"></div>
                        </div>
                        <div class="d-flex justify-content-between small text-muted">
                            <div>${replacementWarranty.active ? `${replacementWarranty.daysRemaining} يوم` : 'منتهي'}</div>
                            <div>${formatGregorianDate(replacementWarranty.endDate)}</div>
                        </div>
                    </div>
                    
                    <!-- Maintenance Warranty -->
                    <div class="warranty-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <i class="fas fa-tools me-2 ${maintenanceWarranty.active ? 'text-success' : 'text-muted'}"></i>
                                <span class="${maintenanceWarranty.active ? 'text-dark' : 'text-muted'}">ضمان الصيانة الدورية</span>
                            </div>
                            <span class="badge ${maintenanceWarranty.active ? 'bg-success' : 'bg-secondary'} rounded-pill px-2 py-1">
                                ${maintenanceWarranty.active ? 'ساري' : 'منتهي'}
                            </span>
                        </div>
                        <div class="progress mb-1" style="height:5px;">
                            <div class="progress-bar ${maintenanceWarranty.active ? 'bg-success' : 'bg-secondary'}" 
                                 style="width: ${maintenanceWarranty.percentRemaining}%"></div>
                        </div>
                        <div class="d-flex justify-content-between small text-muted">
                            <div>${maintenanceWarranty.active ? `${maintenanceWarranty.daysRemaining} يوم` : 'منتهي'}</div>
                            <div>${formatGregorianDate(maintenanceWarranty.endDate)}</div>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0 p-4 pt-0">
                    <a href="report.html?id=${report.id}" class="btn btn-sm btn-outline-primary w-100">
                        <i class="fas fa-eye me-1"></i> عرض التقرير
                    </a>
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
    // Ensure we're working with Date objects
    reportDate = new Date(reportDate);
    currentDate = new Date(currentDate);
    
    // Manufacturing warranty: 6 months from report date
    const endDate = new Date(reportDate);
    endDate.setMonth(endDate.getMonth() + 6);
    
    // Calculate exact days from report date to warranty end date
    const totalDays = Math.ceil((endDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate days remaining
    const active = currentDate <= endDate;
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const daysPassed = Math.ceil((currentDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate percentage remaining
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        daysPassed,
        totalDays,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Calculate replacement warranty status (14 days)
 */
function calculateReplacementWarranty(reportDate, currentDate) {
    // Ensure we're working with Date objects
    reportDate = new Date(reportDate);
    currentDate = new Date(currentDate);
    
    // Replacement warranty: 14 days from report date
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 14);
    
    // The total warranty period is exactly 14 days
    const totalDays = 14;
    
    // Calculate days remaining and days passed
    const active = currentDate <= endDate;
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const daysPassed = Math.ceil((currentDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate percentage remaining
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        daysPassed,
        totalDays,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Calculate maintenance warranty status (1 year)
 */
function calculateMaintenanceWarranty(reportDate, currentDate) {
    // Ensure we're working with Date objects
    reportDate = new Date(reportDate);
    currentDate = new Date(currentDate);
    
    // Maintenance warranty: 1 year from report date
    const endDate = new Date(reportDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    // Calculate exact days from report date to warranty end date (accounts for leap years)
    const totalDays = Math.ceil((endDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate days remaining and days passed
    const active = currentDate <= endDate;
    const daysRemaining = active ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    const daysPassed = Math.ceil((currentDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate percentage remaining
    const percentRemaining = active ? (daysRemaining / totalDays) * 100 : 0;
    
    return {
        active,
        endDate,
        daysRemaining,
        daysPassed,
        totalDays,
        percentRemaining: Math.min(Math.max(percentRemaining, 0), 100)
    };
}

/**
 * Format date to locale string
 */
function formatDate(date) {
    if (!date) return 'غير متوفر';
    
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        calendar: 'gregory' // Explicitly use Gregorian calendar
    });
}

/**
 * Format date in Gregorian calendar (Miladi) without labels
 */
function formatGregorianDate(date) {
    if (!date) return 'غير متوفر';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        calendar: 'gregory' // Explicitly use Gregorian calendar
    });
}
