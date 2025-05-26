/**
 * Laapak Report System - Database Utilities
 * Helper functions for database operations and error handling
 */

/**
 * Check if database is empty (no reports)
 * @param {Function} callback - Function to call with result (true if empty, false if not)
 */
function checkEmptyDatabase(callback) {
    // Try to get a count of reports
    const apiBaseUrl = window.config ? window.config.api.baseUrl : window.location.origin;
    fetch(`${apiBaseUrl}/api/reports/count`)
        .then(response => response.json())
        .then(data => {
            // If count is 0, database is empty
            callback(data.count === 0);
        })
        .catch(error => {
            console.error('Error checking database:', error);
            // Assume not empty on error to avoid false positives
            callback(false);
        });
}

/**
 * Show empty database message
 * @param {string} containerId - ID of container to show message in
 * @param {string} message - Message to display
 * @param {string} buttonText - Text for action button
 * @param {string} buttonLink - Link for action button
 */
function showEmptyDatabaseMessage(containerId, message, buttonText, buttonLink) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center p-5">
            <div class="mb-4">
                <i class="fas fa-database fa-4x text-muted"></i>
            </div>
            <h3 class="text-muted">قاعدة البيانات فارغة</h3>
            <p class="text-muted">${message}</p>
            <a href="${buttonLink}" class="btn btn-primary mt-3">
                <i class="fas fa-plus-circle me-2"></i> ${buttonText}
            </a>
        </div>
    `;
}

/**
 * Handle database connection errors
 * @param {Error} error - Error object
 * @param {string} containerId - ID of container to show error in
 */
function handleDatabaseError(error, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let errorMessage = 'حدث خطأ أثناء الاتصال بقاعدة البيانات.';
    
    // Check for specific error types
    if (error.message && error.message.includes('database')) {
        errorMessage = 'لا يمكن الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل خادم قاعدة البيانات.';
    } else if (error.message && error.message.includes('connection')) {
        errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وتشغيل الخادم.';
    }
    
    container.innerHTML = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle me-2"></i> خطأ في قاعدة البيانات</h5>
            <p>${errorMessage}</p>
            <div class="mt-3 small">
                <strong>اقتراحات للحل:</strong>
                <ul>
                    <li>تأكد من تشغيل خادم قاعدة البيانات MySQL</li>
                    <li>تحقق من إعدادات الاتصال في ملف config/db.js</li>
                    <li>تأكد من وجود جدول التقارير في قاعدة البيانات</li>
                </ul>
            </div>
        </div>
    `;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkEmptyDatabase,
        showEmptyDatabaseMessage,
        handleDatabaseError
    };
}
