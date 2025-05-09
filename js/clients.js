/**
 * Laapak Report System - Clients Management JavaScript
 * Handles client management functionality and initializes the header component
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the header component
    const header = new LpkHeader('header-container', {
        showLogo: true,
        logoPath: 'img/logo.png',
        logoWidth: '100px',
        showNavigation: true,
        navigationItems: [
            { text: 'الرئيسية', url: 'admin.html', icon: 'fas fa-tachometer-alt' },
            { text: 'التقارير', url: 'reports.html', icon: 'fas fa-file-alt' },
            { text: 'العملاء', url: 'clients.html', icon: 'fas fa-users', active: true },
            { text: 'تقرير جديد', url: 'create-report.html', icon: 'fas fa-plus-circle' }
        ],
        showUserMenu: true,
        userMenuItems: [
            { text: 'الإعدادات', url: 'settings.html', icon: 'fas fa-cog' },
            { text: 'تسجيل الخروج', url: 'index.html', icon: 'fas fa-sign-out-alt' }
        ]
    });

    // Form submission for client search
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // In a real implementation, this would search clients
            console.log('Search form submitted');
        });
    }

    // Form submission for adding a new client
    const addClientForm = document.getElementById('addClientForm');
    if (addClientForm) {
        addClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // In a real implementation, this would add a new client
            console.log('Add client form submitted');
            
            // Show success message and close modal
            alert('تم إضافة العميل بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
            if (modal) {
                modal.hide();
            }
            addClientForm.reset();
        });
    }

    // Handle client actions (view, edit, share, delete)
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.currentTarget.textContent.includes('حذف')) {
                e.preventDefault();
                if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                    // In a real implementation, this would delete the client
                    console.log('Client deleted');
                }
            }
        });
    });

    // Check for offline status
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
            } else {
                offlineAlert.style.display = 'block';
            }
        }
    }

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
});
