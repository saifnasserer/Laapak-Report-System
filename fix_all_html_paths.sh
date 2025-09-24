#!/bin/bash

# Fix all HTML files in the pages directory
echo "Fixing HTML file paths..."

# Find all HTML files in pages directory
find frontend/public/pages -name "*.html" -type f | while read file; do
    echo "Processing: $file"
    
    # Fix CSS paths - change ../../../styles/ to ../../styles/
    sed -i 's|../../../styles/|../../styles/|g' "$file"
    
    # Fix JavaScript paths - change ../../../scripts/ to ../../scripts/
    sed -i 's|../../../scripts/|../../scripts/|g' "$file"
    
    # Fix specific CSS file paths
    sed -i 's|../../styles/custom-admin.css|../../styles/components/custom-admin.css|g' "$file"
    sed -i 's|../../styles/custom-client.css|../../styles/components/custom-client.css|g' "$file"
    sed -i 's|../../styles/form-steps.css|../../styles/components/form-steps.css|g' "$file"
    
    # Fix specific JavaScript file paths
    sed -i 's|../../scripts/config.js|../../scripts/core/config.js|g' "$file"
    sed -i 's|../../scripts/auth-middleware.js|../../scripts/core/auth-middleware.js|g' "$file"
    sed -i 's|../../scripts/auth-check.js|../../scripts/core/auth-check.js|g' "$file"
    sed -i 's|../../scripts/main.js|../../scripts/core/main.js|g' "$file"
    sed -i 's|../../scripts/api-service.js|../../scripts/core/api-service.js|g' "$file"
    sed -i 's|../../scripts/header-component.js|../../scripts/components/header-component.js|g' "$file"
    sed -i 's|../../scripts/client-header-component.js|../../scripts/components/client-header-component.js|g' "$file"
    sed -i 's|../../scripts/finance-header-component.js|../../scripts/components/finance-header-component.js|g' "$file"
    sed -i 's|../../scripts/admin.js|../../scripts/pages/admin/admin.js|g' "$file"
    sed -i 's|../../scripts/reports.js|../../scripts/pages/reports/reports.js|g' "$file"
    sed -i 's|../../scripts/report-view.js|../../scripts/pages/reports/report-view.js|g' "$file"
    sed -i 's|../../scripts/create-report.js|../../scripts/pages/reports/create-report.js|g' "$file"
    sed -i 's|../../scripts/invoices.js|../../scripts/pages/invoices/invoices.js|g' "$file"
    sed -i 's|../../scripts/create-invoice.js|../../scripts/pages/invoices/create-invoice.js|g' "$file"
    sed -i 's|../../scripts/edit-invoice.js|../../scripts/pages/invoices/edit-invoice.js|g' "$file"
    sed -i 's|../../scripts/view-invoice.js|../../scripts/pages/invoices/view-invoice.js|g' "$file"
    sed -i 's|../../scripts/invoice-form.js|../../scripts/pages/invoices/invoice-form.js|g' "$file"
    sed -i 's|../../scripts/invoice-generator.js|../../scripts/pages/invoices/invoice-generator.js|g' "$file"
    sed -i 's|../../scripts/client-dashboard.js|../../scripts/pages/client/client-dashboard.js|g' "$file"
    sed -i 's|../../scripts/client-display.js|../../scripts/pages/client/client-display.js|g' "$file"
    sed -i 's|../../scripts/client-warranty.js|../../scripts/pages/client/client-warranty.js|g' "$file"
    sed -i 's|../../scripts/client-maintenance.js|../../scripts/pages/client/client-maintenance.js|g' "$file"
    sed -i 's|../../scripts/clients.js|../../scripts/pages/admin/clients.js|g' "$file"
    sed -i 's|../../scripts/money-management.js|../../scripts/pages/financial/money-management.js|g' "$file"
    sed -i 's|../../scripts/redirect.js|../../scripts/core/redirect.js|g' "$file"
    sed -i 's|../../scripts/auth-test.js|../../scripts/core/auth-test.js|g' "$file"
    sed -i 's|../../scripts/sw-register.js|../../scripts/pwa/sw-register.js|g' "$file"
    sed -i 's|../../scripts/offline-handler.js|../../scripts/pwa/offline-handler.js|g' "$file"
    sed -i 's|../../scripts/reset-service-worker.js|../../scripts/pwa/reset-service-worker.js|g' "$file"
    sed -i 's|../../scripts/form-steps-utils.js|../../scripts/utils/form-steps-utils.js|g' "$file"
    sed -i 's|../../scripts/form-steps.js|../../scripts/utils/form-steps.js|g' "$file"
    sed -i 's|../../scripts/component-tests.js|../../scripts/utils/component-tests.js|g' "$file"
    
    echo "Fixed: $file"
done

echo "All HTML files have been updated!"
