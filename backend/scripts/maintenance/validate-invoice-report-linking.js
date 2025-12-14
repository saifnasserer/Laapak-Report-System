/**
 * Validation script to check invoice-report linking integrity
 * Run this script to verify that all invoices are properly linked to reports
 */

const { sequelize } = require('../config/db');
const { Report, Invoice, InvoiceReport } = require('../models');

async function validateInvoiceReportLinking() {
    try {
        console.log('🔍 Starting invoice-report linking validation...\n');

        // 1. Check for invoices without reportId
        const invoicesWithoutReport = await Invoice.findAll({
            where: {
                reportId: null
            }
        });

        console.log(`📊 Invoices without reportId: ${invoicesWithoutReport.length}`);
        if (invoicesWithoutReport.length > 0) {
            console.log('❌ Found invoices without report links:');
            invoicesWithoutReport.forEach(invoice => {
                console.log(`   - Invoice ID: ${invoice.id}, Client: ${invoice.client_id}`);
            });
        }

        // 2. Check for reports with billing_enabled but no invoice
        const reportsWithBillingNoInvoice = await Report.findAll({
            where: {
                billing_enabled: true,
                invoice_created: false
            }
        });

        console.log(`\n📊 Reports with billing enabled but no invoice: ${reportsWithBillingNoInvoice.length}`);
        if (reportsWithBillingNoInvoice.length > 0) {
            console.log('⚠️  Found reports that should have invoices:');
            reportsWithBillingNoInvoice.forEach(report => {
                console.log(`   - Report ID: ${report.id}, Order: ${report.order_number}, Amount: ${report.amount}`);
            });
        }

        // 3. Check for orphaned invoices (invoices pointing to non-existent reports)
        const orphanedInvoices = await sequelize.query(`
            SELECT i.id, i.reportId, i.client_id 
            FROM invoices i 
            LEFT JOIN reports r ON i.reportId = r.id 
            WHERE r.id IS NULL AND i.reportId IS NOT NULL
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`\n📊 Orphaned invoices (pointing to non-existent reports): ${orphanedInvoices.length}`);
        if (orphanedInvoices.length > 0) {
            console.log('❌ Found orphaned invoices:');
            orphanedInvoices.forEach(invoice => {
                console.log(`   - Invoice ID: ${invoice.id}, Report ID: ${invoice.reportId}`);
            });
        }

        // 4. Check for duplicate invoice-report links
        const duplicateLinks = await sequelize.query(`
            SELECT reportId, COUNT(*) as count 
            FROM invoices 
            WHERE reportId IS NOT NULL 
            GROUP BY reportId 
            HAVING COUNT(*) > 1
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`\n📊 Reports with multiple invoices: ${duplicateLinks.length}`);
        if (duplicateLinks.length > 0) {
            console.log('⚠️  Found reports with multiple invoices:');
            duplicateLinks.forEach(link => {
                console.log(`   - Report ID: ${link.reportId}, Invoice count: ${link.count}`);
            });
        }

        // 5. Check data consistency between reports and invoices
        const inconsistentData = await sequelize.query(`
            SELECT 
                r.id as report_id,
                r.order_number,
                r.amount as report_amount,
                r.invoice_created,
                r.invoice_id,
                i.id as invoice_id,
                i.total as invoice_total,
                i.report_order_number
            FROM reports r
            LEFT JOIN invoices i ON r.id = i.reportId
            WHERE r.invoice_created = TRUE AND i.id IS NULL
               OR r.invoice_created = FALSE AND i.id IS NOT NULL
               OR r.invoice_id != i.id
               OR r.order_number != i.report_order_number
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`\n📊 Inconsistent data between reports and invoices: ${inconsistentData.length}`);
        if (inconsistentData.length > 0) {
            console.log('⚠️  Found inconsistent data:');
            inconsistentData.forEach(item => {
                console.log(`   - Report ID: ${item.report_id}, Order: ${item.order_number}`);
                console.log(`     Report invoice_created: ${item.invoice_created}, Invoice ID: ${item.invoice_id}`);
            });
        }

        // 6. Summary statistics
        const totalReports = await Report.count();
        const totalInvoices = await Invoice.count();
        const linkedInvoices = await Invoice.count({ where: { reportId: { [sequelize.Op.ne]: null } } });
        const reportsWithInvoices = await Report.count({ where: { invoice_created: true } });

        console.log('\n📈 SUMMARY STATISTICS:');
        console.log(`   Total Reports: ${totalReports}`);
        console.log(`   Total Invoices: ${totalInvoices}`);
        console.log(`   Linked Invoices: ${linkedInvoices}`);
        console.log(`   Reports with Invoices: ${reportsWithInvoices}`);
        console.log(`   Linking Rate: ${((linkedInvoices / totalInvoices) * 100).toFixed(2)}%`);

        // 7. Generate recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (invoicesWithoutReport.length > 0) {
            console.log('   🔧 Fix invoices without reportId by linking them to appropriate reports');
        }
        
        if (reportsWithBillingNoInvoice.length > 0) {
            console.log('   🔧 Create invoices for reports with billing enabled');
        }
        
        if (orphanedInvoices.length > 0) {
            console.log('   🔧 Clean up orphaned invoices or restore missing reports');
        }
        
        if (duplicateLinks.length > 0) {
            console.log('   🔧 Review and consolidate multiple invoices per report');
        }
        
        if (inconsistentData.length > 0) {
            console.log('   🔧 Fix data inconsistencies between reports and invoices');
        }

        if (invoicesWithoutReport.length === 0 && 
            reportsWithBillingNoInvoice.length === 0 && 
            orphanedInvoices.length === 0 && 
            duplicateLinks.length === 0 && 
            inconsistentData.length === 0) {
            console.log('   ✅ All invoice-report links are valid and consistent!');
        }

        console.log('\n✅ Validation completed successfully!');

    } catch (error) {
        console.error('❌ Error during validation:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the validation if this script is executed directly
if (require.main === module) {
    validateInvoiceReportLinking();
}

module.exports = { validateInvoiceReportLinking }; 