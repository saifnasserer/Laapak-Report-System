/**
 * Laapak Report System - Admin Dashboard JavaScript
 * Handles functionality specific to the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initCreateReportButton();
    initSearchForm();
    initDeleteConfirmation();
    initWhatsAppShare();
    
    // Cache reports list for offline access
    cacheReportsList();
});

/**
 * Initialize create report button
 */
function initCreateReportButton() {
    const createReportBtn = document.getElementById('createReportBtn');
    
    if (createReportBtn) {
        createReportBtn.addEventListener('click', function() {
            // In a real implementation, this would redirect to a form page
            // For the prototype, we'll just show an alert
            alert('سيتم توجيهك إلى صفحة إنشاء تقرير جديد في الإصدار النهائي');
        });
    }
}

/**
 * Initialize search form functionality
 */
function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real implementation, this would perform a search using form data
            // For the prototype, we'll just simulate a search
            
            // Show loading indicator
            const submitBtn = searchForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري البحث...';
            submitBtn.disabled = true;
            
            // Simulate API delay
            setTimeout(() => {
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show a message
                alert('تم تنفيذ البحث. سيتم تحديث النتائج في الإصدار النهائي');
            }, 1000);
        });
    }
}

/**
 * Initialize delete confirmation dialogs
 */
function initDeleteConfirmation() {
    const deleteButtons = document.querySelectorAll('.btn-danger');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const confirmed = confirm('هل أنت متأكد من رغبتك في حذف هذا التقرير؟');
            
            if (confirmed) {
                // Get the report ID from the row
                const row = this.closest('tr');
                const reportId = row.cells[0].textContent;
                
                // In a real implementation, this would call an API to delete the report
                // For the prototype, we'll just remove the row from the table
                alert(`سيتم حذف التقرير رقم ${reportId} في الإصدار النهائي`);
            }
        });
    });
}

/**
 * Initialize WhatsApp share functionality
 */
function initWhatsAppShare() {
    const whatsappButtons = document.querySelectorAll('.btn-info');
    
    whatsappButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the report details from the row
            const row = this.closest('tr');
            const reportId = row.cells[0].textContent;
            const customerName = row.cells[1].textContent;
            
            // Create WhatsApp message
            const message = `مرحبًا ${customerName}، يمكنك الاطلاع على تقرير فحص جهازك من خلال الرابط التالي: https://laapak.com/reports/${reportId}`;
            const encodedMessage = encodeURIComponent(message);
            
            // Open WhatsApp with pre-filled message
            // In a real implementation, you would use a proper API or recipient
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
            
            // Open in a new tab
            window.open(whatsappUrl, '_blank');
        });
    });
}

/**
 * Cache reports list for offline access
 */
function cacheReportsList() {
    // If we're online and have localStorage available
    if (navigator.onLine && typeof localStorage !== 'undefined') {
        // Get all reports from the table
        const reportRows = document.querySelectorAll('tbody tr');
        const reports = [];
        
        reportRows.forEach(row => {
            const cells = row.cells;
            reports.push({
                id: cells[0].textContent,
                customerName: cells[1].textContent,
                deviceModel: cells[2].textContent,
                date: cells[3].textContent,
                status: cells[4].querySelector('.badge').textContent,
            });
        });
        
        // Store in localStorage
        localStorage.setItem('reports_list', JSON.stringify(reports));
        
        console.log('Reports list cached for offline use');
    }
}

/**
 * Load reports list from cache when offline
 */
function loadReportsFromCache() {
    const cachedReports = localStorage.getItem('reports_list');
    
    if (cachedReports) {
        const reports = JSON.parse(cachedReports);
        // In a real implementation, we would rebuild the table with this data
        console.log('Loaded cached reports:', reports);
        return reports;
    }
    
    return [];
}
