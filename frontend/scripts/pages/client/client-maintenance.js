/**
 * Laapak Report System - Client Maintenance JavaScript
 * Handles maintenance schedule calculations and display
 */

/**
 * Display maintenance schedule for client reports
 * Uses dynamic calculations based on report creation date
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
        // Find newest device report (will be highlighted)
        const reportDate = new Date(report.inspection_date || report.created_at);
        const isNewest = reportDate.getTime() === Math.max(...reports.map(r => new Date(r.inspection_date || r.created_at).getTime()));
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Calculate maintenance schedules with actual days based on report creation date
        const firstMaintenance = calculateMaintenanceDate(reportDate, 1);
        const secondMaintenance = calculateMaintenanceDate(reportDate, 2);
        
        // Set completed status - in a real system this would come from the database
        // For demo purposes, we randomly mark some maintenances as completed based on their due status
        if (firstMaintenance.isDue && Math.random() > 0.5) {
            firstMaintenance.completed = true;
            firstMaintenance.completedDate = new Date(firstMaintenance.date.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000));
        }
        
        // Get status based on calculated dates
        let firstStatus = firstMaintenance.completed ? 'completed' : getMaintenanceStatus(firstMaintenance.date, currentDate);
        let secondStatus = secondMaintenance.completed ? 'completed' : getMaintenanceStatus(secondMaintenance.date, currentDate);
        
        // Determine if any maintenance is upcoming soon (within 30 days)
        const hasUpcomingMaintenance = (firstStatus === 'upcoming') || (secondStatus === 'upcoming');
        
        col.innerHTML = `
            <div class="card h-100 border-0 ${isNewest ? 'shadow-lg' : 'shadow-sm'}">
                <div class="card-body p-4">
                    ${isNewest ? '<div class="position-absolute end-0 top-0 mt-2 me-3"><i class="fas fa-circle text-warning"></i></div>' : ''}
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold">${report.device_model || 'جهاز غير محدد'}</h5>
                        ${hasUpcomingMaintenance ? '<span class="badge bg-info rounded-pill px-3">صيانة قريبة</span>' : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between text-muted small mb-4">
                        <span><i class="fas fa-calendar-alt me-1"></i> ${formatGregorianDate(reportDate)}</span>
                        ${report.serial_number ? `<span><i class="fas fa-barcode me-1"></i> ${report.serial_number}</span>` : ''}
                    </div>
                    
                    <!-- First Maintenance -->
                    <div class="maintenance-item mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <i class="fas fa-tools me-2 ${firstStatus === 'due' ? 'text-danger' : 
                                                    firstStatus === 'upcoming' ? 'text-info' : 
                                                    firstStatus === 'completed' ? 'text-success' : 'text-muted'}"></i>
                                <span class="${firstStatus === 'completed' ? 'text-muted' : 'text-dark'}">الصيانة الدورية الأولى</span>
                            </div>
                            <span class="badge ${firstStatus === 'due' ? 'bg-danger' : 
                                             firstStatus === 'upcoming' ? 'bg-info' : 
                                             firstStatus === 'completed' ? 'bg-success' : 'bg-secondary'} rounded-pill px-2 py-1">
                                ${getMaintenanceStatusText(firstStatus)}
                            </span>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mb-2 small">
                            <span class="${firstStatus === 'due' ? 'text-danger' : 
                                       firstStatus === 'upcoming' ? 'text-info' : 
                                       firstStatus === 'completed' ? 'text-success' : 'text-muted'}">
                                ${formatGregorianDate(firstMaintenance.date)}
                            </span>
                            <span class="text-muted">بعد 6 أشهر</span>
                        </div>
                        
                        ${firstMaintenance.completed ? 
                            `<div class="small mb-1 text-success">
                                <i class="fas fa-check-circle me-2"></i> تمت بتاريخ: ${formatGregorianDate(firstMaintenance.completedDate || new Date())}
                            </div>` : 
                            `<div class="progress mb-1" style="height:5px;">
                                <div class="progress-bar ${firstStatus === 'due' ? 'bg-danger' : 
                                                      firstStatus === 'upcoming' ? 'bg-info' : 
                                                      firstStatus === 'scheduled' ? 'bg-secondary' : 'bg-secondary'}" 
                                     style="width: ${firstStatus === 'due' ? 100 : 
                                                 firstStatus === 'upcoming' ? Math.min(firstMaintenance.percentPassed, 100) : 
                                                 firstStatus === 'scheduled' ? Math.min(firstMaintenance.percentPassed, 100) : 0}%"></div>
                            </div>
                            <div class="d-flex justify-content-between mt-1 small text-muted">
                                ${firstStatus === 'upcoming' ? 
                                    `<span>${firstMaintenance.daysRemaining} يوم</span>` : 
                                    firstStatus === 'due' ? 
                                    '<span class="text-danger">متأخر</span>' : 
                                    '<span>-</span>'}
                                ${firstStatus === 'upcoming' ? '<span>قريباً</span>' : '<span>-</span>'}
                            </div>`
                        }
                    </div>
                    
                    <!-- Second Maintenance -->
                    <div class="maintenance-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <i class="fas fa-tools me-2 ${secondStatus === 'due' ? 'text-danger' : 
                                                    secondStatus === 'upcoming' ? 'text-info' : 
                                                    secondStatus === 'completed' ? 'text-success' : 'text-muted'}"></i>
                                <span class="${secondStatus === 'completed' ? 'text-muted' : 'text-dark'}">الصيانة الدورية الثانية</span>
                            </div>
                            <span class="badge ${secondStatus === 'due' ? 'bg-danger' : 
                                             secondStatus === 'upcoming' ? 'bg-info' : 
                                             secondStatus === 'completed' ? 'bg-success' : 'bg-secondary'} rounded-pill px-2 py-1">
                                ${getMaintenanceStatusText(secondStatus)}
                            </span>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mb-2 small">
                            <span class="${secondStatus === 'due' ? 'text-danger' : 
                                       secondStatus === 'upcoming' ? 'text-info' : 
                                       secondStatus === 'completed' ? 'text-success' : 'text-muted'}">
                                ${formatGregorianDate(secondMaintenance.date)}
                            </span>
                            <span class="text-muted">بعد 12 شهر</span>
                        </div>
                        
                        ${secondMaintenance.completed ?
                            `<div class="small mb-1 text-success">
                                <i class="fas fa-check-circle me-2"></i> تمت بتاريخ: ${formatGregorianDate(secondMaintenance.completedDate || new Date())}
                            </div>` : 
                            `<div class="progress mb-1" style="height:5px;">
                                <div class="progress-bar ${secondStatus === 'due' ? 'bg-danger' : 
                                                      secondStatus === 'upcoming' ? 'bg-info' : 
                                                      secondStatus === 'scheduled' ? 'bg-secondary' : 'bg-secondary'}" 
                                     style="width: ${secondStatus === 'due' ? 100 : 
                                                 secondStatus === 'upcoming' ? Math.min(secondMaintenance.percentPassed, 100) : 
                                                 secondStatus === 'scheduled' ? Math.min(secondMaintenance.percentPassed, 100) : 0}%"></div>
                            </div>
                            <div class="d-flex justify-content-between mt-1 small text-muted">
                                ${secondStatus === 'upcoming' ? 
                                    `<span>${secondMaintenance.daysRemaining} يوم</span>` : 
                                    secondStatus === 'due' ? 
                                    '<span class="text-danger">متأخر</span>' : 
                                    '<span>-</span>'}
                                ${secondStatus === 'upcoming' ? '<span>قريباً</span>' : '<span>-</span>'}
                            </div>`
                        }
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0 p-4 pt-0">
                    <a href="report.html?id=${report.id}" class="btn btn-sm btn-outline-primary w-100">
                        <i class="fas fa-eye me-1"></i> عرض التقرير
                    </a>
                </div>
                <div class="card-footer bg-light">
                    <a href="#" class="btn btn-sm btn-primary w-100" 
                        onclick="sendMaintenanceWhatsApp('${report.id}', '${report.client?.name || report.client_name || ''}', '${formatDate(reportDate) || ''}', '${report.device_model || report.deviceModel || ''}')"
                        style="background-color: #25D366; border-color: #25D366;">
                        <i class="fab fa-whatsapp me-2"></i> حجز موعد للصيانة
                    </a>
                </div>
                ${isMaintenanceWarrantyActive(reportDate, currentDate) ? '' : 
                    `<div class="alert alert-warning mt-3 p-2 small">
                        <i class="fas fa-exclamation-triangle me-2"></i> انتهت فترة الضمان للصيانة الدورية
                    </div>`
                }
            </div>
        `;
        
        maintenanceList.appendChild(col);
    });
}

/**
 * Send a WhatsApp message to schedule maintenance
 * @param {string} reportId - Report ID
 * @param {string} clientName - Client name
 * @param {string} reportDate - Report creation date
 * @param {string} deviceModel - Device model
 */
function sendMaintenanceWhatsApp(reportId, clientName, reportDate, deviceModel) {
    // Clean up any empty or undefined values
    const cleanClientName = clientName && clientName.trim() ? clientName.trim() : 'عميل';
    const cleanDeviceModel = deviceModel && deviceModel.trim() ? deviceModel.trim() : 'غير محدد';
    const cleanReportDate = reportDate && reportDate.trim() ? reportDate.trim() : 'سابق';
    
    // Log values for debugging
    console.log('Maintenance WhatsApp:', {
        reportId,
        clientName: cleanClientName,
        reportDate: cleanReportDate,
        deviceModel: cleanDeviceModel
    });
    
    // Format message with client details
    const message = `السلام عليكم انا ${cleanClientName} ، اشتريت لابتوب من شركة لابك بتاريخ ${cleanReportDate} الموديل ${cleanDeviceModel} وعايز احجز معاد للصيانة الدورية امتي ممكن يكون معاد مناسب ؟`;
    
    // Phone number for maintenance scheduling
    const phoneNumber = '01270388043';
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Track this action if analytics is available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'schedule_maintenance', {
            'event_category': 'maintenance',
            'event_label': reportId,
            'value': 1
        });
    }
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    return false; // Prevent default link behavior
}

/**
 * Calculate maintenance date
 * @param {Date} reportDate - Report creation date
 * @param {number} period - Maintenance period (1 for first at 6 months, 2 for second at 12 months)
 */
function calculateMaintenanceDate(reportDate, period) {
    // Ensure we're working with Date objects
    reportDate = new Date(reportDate);
    const currentDate = new Date();
    
    // Calculate maintenance date based on period (6 or 12 months from report date)
    const maintenanceDate = new Date(reportDate);
    maintenanceDate.setMonth(maintenanceDate.getMonth() + (period * 6));
    
    // Calculate exact total days from report to maintenance date
    const totalDays = Math.ceil((maintenanceDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate days passed since report was created
    const daysPassed = Math.ceil((currentDate - reportDate) / (1000 * 60 * 60 * 24));
    
    // Calculate days remaining until maintenance
    const daysRemaining = Math.ceil((maintenanceDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Calculate percentage progress toward maintenance date
    const percentPassed = (daysPassed / totalDays) * 100;
    
    // Determine if maintenance is due (overdue), upcoming, or completed based on real dates
    const isDue = currentDate > maintenanceDate;
    const isUpcoming = daysRemaining <= 30 && daysRemaining > 0;
    
    // For demo purposes, mark some past maintenance dates as completed
    // In a real system, this would come from the database
    const isCompleted = isDue && (Math.random() > 0.4);
    const completedDate = isCompleted ? new Date(maintenanceDate.getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000)) : null;
    
    return {
        date: maintenanceDate,
        completed: isCompleted,
        completedDate: completedDate,
        totalDays: totalDays,
        daysPassed: daysPassed,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isDue: isDue && !isCompleted,
        isUpcoming: isUpcoming,
        percentPassed: Math.min(Math.max(percentPassed, 0), 100)
    };
}

/**
 * Get maintenance status based on date comparison
 * @param {Date} maintenanceDate - Scheduled maintenance date
 * @param {Date} currentDate - Current date for comparison
 * @returns {string} Status: 'completed', 'due', 'upcoming', or 'scheduled'
 */
function getMaintenanceStatus(maintenanceDate, currentDate) {
    // Ensure we're working with Date objects
    maintenanceDate = new Date(maintenanceDate);
    currentDate = new Date(currentDate);
    
    // Calculate days until maintenance
    const daysUntilMaintenance = Math.ceil((maintenanceDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Determine status based on days until maintenance
    if (daysUntilMaintenance < 0) {
        return 'due'; // Maintenance is overdue
    } else if (daysUntilMaintenance <= 30) {
        return 'upcoming'; // Maintenance is coming up soon (within 30 days)
    } else {
        return 'scheduled'; // Maintenance is scheduled but not soon
    }
}

/**
 * Format date to string
 */
function formatDate(date) {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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

/**
 * Get CSS class for maintenance status badge
 * @param {string} status - Maintenance status
 * @returns {string} CSS class for badge
 */
function getMaintenanceBadgeClass(status) {
    switch (status) {
        case 'completed':
            return 'bg-success';
        case 'due':
            return 'bg-danger';
        case 'upcoming':
            return 'bg-info';
        case 'scheduled':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get text for maintenance status in Arabic
 * @param {string} status - Maintenance status
 * @returns {string} Arabic text for status
 */
function getMaintenanceStatusText(status) {
    switch (status) {
        case 'completed':
            return 'تمت الصيانة';
        case 'due':
            return 'متأخرة';
        case 'upcoming':
            return 'قريباً';
        case 'scheduled':
            return 'مجدولة';
        default:
            return 'غير متوفر';
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
