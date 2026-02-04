document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login if not authenticated as admin or client
    if (typeof authMiddleware !== 'undefined') {
        // Allow both admin and client users to view invoices
        if (!authMiddleware.isAdminLoggedIn() && !authMiddleware.isClientLoggedIn()) {
            window.location.href = 'index.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
    }

    const invoiceIdParam = new URLSearchParams(window.location.search).get('id');

    if (!invoiceIdParam) {
        document.body.innerHTML = '<div class="container my-5"><div class="alert alert-danger">لم يتم تحديد معرف الفاتورة. يرجى التأكد من صحة الرابط.</div></div>';
        return;
    }

    // Get user token (either admin or client)
    let userToken = null;

    // Try to get token from authMiddleware
    if (typeof authMiddleware !== 'undefined') {
        if (authMiddleware.isAdminLoggedIn()) {
            userToken = authMiddleware.getAdminToken();
        } else if (authMiddleware.isClientLoggedIn()) {
            userToken = authMiddleware.getClientToken();
        }
    } else {
        // Direct access from storage as fallback
        userToken = localStorage.getItem('adminToken') ||
            sessionStorage.getItem('adminToken') ||
            localStorage.getItem('clientToken') ||
            sessionStorage.getItem('clientToken');
    }

    if (!userToken) {
        // Redirect to login if no token found
        window.location.href = 'index.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    // Determine base URL (default to relative)
    const baseUrl = (window.config && window.config.api && window.config.api.baseUrl) || '';

    // Build print URL with token - this is now the main view
    const printUrl = `${baseUrl}/api/invoices/${invoiceIdParam}/print?token=${encodeURIComponent(userToken)}`;

    // Get the iframe and loading elements
    const invoiceFrame = document.getElementById('invoiceFrame');
    const loading = document.getElementById('loading');

    if (invoiceFrame && loading) {
        // Set the iframe source
        invoiceFrame.src = printUrl;

        // Handle iframe load
        invoiceFrame.onload = () => {
            loading.style.display = 'none';
            invoiceFrame.style.display = 'block';
        };

        // Handle iframe error
        invoiceFrame.onerror = () => {
            loading.innerHTML = '<div style="color: red;">فشل تحميل الفاتورة. يرجى المحاولة مرة أخرى.</div>';
        };
    } else {
        // Fallback: replace body if elements don't exist
        document.body.innerHTML = `
            <div class="loading-container" id="loading">
                <div>جاري تحميل الفاتورة...</div>
            </div>
            <iframe 
                id="invoiceFrame" 
                class="invoice-iframe" 
                src="${printUrl}"
                style="display: none;"
                onload="document.getElementById('loading').style.display='none'; document.getElementById('invoiceFrame').style.display='block';"
                onerror="document.getElementById('loading').innerHTML='<div style=\'color: red;\'>فشل تحميل الفاتورة. يرجى المحاولة مرة أخرى.</div>';"
            ></iframe>
        `;
    }

    // Expose share function to window
    window.shareInvoiceWhatsApp = async () => {
        try {
            console.log('Initiating WhatsApp share for invoice:', invoiceIdParam);
            const btn = document.querySelector('.whatsapp-float-btn');
            if (btn) {
                btn.style.opacity = '0.5';
                btn.disabled = true;
            }

            const response = await fetch(`${baseUrl}/api/invoices/${invoiceIdParam}/share/whatsapp`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            console.log('WhatsApp share response status:', response.status);
            const data = await response.json();
            console.log('WhatsApp share response data:', data);

            if (response.ok) {
                alert('تم إرسال الفاتورة بنجاح عبر واتساب');
            } else {
                throw new Error(data.message || 'فشل إرسال الفاتورة');
            }
        } catch (error) {
            console.error('Error sharing invoice via WhatsApp:', error);
            alert(error.message || 'حدث خطأ أثناء مشاركة الفاتورة');
        } finally {
            const btn = document.querySelector('.whatsapp-float-btn');
            if (btn) {
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        }
    };
});
