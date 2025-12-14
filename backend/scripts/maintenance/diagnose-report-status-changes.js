// Load environment variables - .env is in project root
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sequelize } = require('../../config/db');
const Report = require('../../models/Report');

/**
 * Diagnostic script to analyze what the mark-reports-with-completed-invoices script changed
 * 
 * This script will:
 * 1. Find all reports currently marked as 'مكتمل' that are linked to completed/paid invoices
 * 2. Show when they were last updated (to identify recently changed ones)
 * 3. Show their invoice relationships
 * 4. Provide statistics on what was changed
 * 
 * Usage:
 *   cd backend
 *   node scripts/maintenance/diagnose-report-status-changes.js
 */
async function diagnoseReportStatusChanges() {
    try {
        console.log('=== DIAGNOSTIC: Analyzing Report Status Changes ===\n');
        
        // Test database connection
        await sequelize.authenticate();
        console.log('✓ Database connection established\n');
        
        // Find all reports marked as 'مكتمل' that are linked to completed/paid invoices
        const reportsWithCompletedInvoices = await sequelize.query(`
            SELECT DISTINCT 
                r.id,
                r.status,
                r.order_number,
                r.device_model,
                r.client_name,
                r.created_at,
                r.updated_at,
                i.id as invoice_id,
                i.paymentStatus,
                i.date as invoice_date,
                i.total as invoice_total
            FROM reports r
            LEFT JOIN invoice_reports ir ON r.id = ir.report_id
            LEFT JOIN invoices i ON (ir.invoice_id = i.id OR r.id = i.reportId OR r.id = i.report_id)
            WHERE r.status = 'مكتمل'
            AND i.paymentStatus IN ('completed', 'paid')
            ORDER BY r.updated_at DESC
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`Found ${reportsWithCompletedInvoices.length} reports marked as 'مكتمل' with completed/paid invoices\n`);
        
        // Group by update time to identify recently changed reports
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentlyUpdated = reportsWithCompletedInvoices.filter(r => {
            const updatedAt = new Date(r.updated_at);
            return updatedAt >= oneDayAgo;
        });
        
        const updatedThisWeek = reportsWithCompletedInvoices.filter(r => {
            const updatedAt = new Date(r.updated_at);
            return updatedAt >= oneWeekAgo && updatedAt < oneDayAgo;
        });
        
        console.log('📊 Update Timeline Analysis:');
        console.log(`   - Updated in last 24 hours: ${recentlyUpdated.length} reports`);
        console.log(`   - Updated in last week (but not today): ${updatedThisWeek.length} reports`);
        console.log(`   - Updated more than a week ago: ${reportsWithCompletedInvoices.length - recentlyUpdated.length - updatedThisWeek.length} reports\n`);
        
        // Show sample of recently updated reports
        if (recentlyUpdated.length > 0) {
            console.log('⚠️  Recently Updated Reports (likely changed by the script):');
            console.log('─'.repeat(100));
            recentlyUpdated.slice(0, 20).forEach((report, index) => {
                console.log(`${index + 1}. Report ID: ${report.id}`);
                console.log(`   Order: ${report.order_number || 'N/A'}`);
                console.log(`   Client: ${report.client_name || 'N/A'}`);
                console.log(`   Device: ${report.device_model || 'N/A'}`);
                console.log(`   Status: ${report.status}`);
                console.log(`   Invoice ID: ${report.invoice_id || 'N/A'}`);
                console.log(`   Invoice Payment Status: ${report.paymentStatus || 'N/A'}`);
                console.log(`   Last Updated: ${report.updated_at}`);
                console.log(`   Created: ${report.created_at}`);
                console.log('');
            });
            
            if (recentlyUpdated.length > 20) {
                console.log(`... and ${recentlyUpdated.length - 20} more recently updated reports\n`);
            }
        }
        
        // Check for reports that might have been incorrectly marked as completed
        // (e.g., reports that were created very recently but marked as completed)
        const suspiciousReports = await sequelize.query(`
            SELECT DISTINCT 
                r.id,
                r.status,
                r.order_number,
                r.device_model,
                r.client_name,
                r.created_at,
                r.updated_at,
                DATEDIFF(r.updated_at, r.created_at) as days_between_creation_and_completion
            FROM reports r
            LEFT JOIN invoice_reports ir ON r.id = ir.report_id
            LEFT JOIN invoices i ON (ir.invoice_id = i.id OR r.id = i.reportId OR r.id = i.report_id)
            WHERE r.status = 'مكتمل'
            AND i.paymentStatus IN ('completed', 'paid')
            AND r.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND DATEDIFF(r.updated_at, r.created_at) < 1
            ORDER BY r.updated_at DESC
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        if (suspiciousReports.length > 0) {
            console.log('🚨 POTENTIALLY PROBLEMATIC REPORTS:');
            console.log('   Reports completed on the same day they were created (might be incorrect):');
            console.log('─'.repeat(100));
            suspiciousReports.forEach((report, index) => {
                console.log(`${index + 1}. Report ID: ${report.id}`);
                console.log(`   Order: ${report.order_number || 'N/A'}`);
                console.log(`   Created: ${report.created_at}`);
                console.log(`   Completed: ${report.updated_at}`);
                console.log(`   Days between: ${report.days_between_creation_and_completion}`);
                console.log('');
            });
        }
        
        // Get status distribution
        const statusDistribution = await sequelize.query(`
            SELECT status, COUNT(*) as count
            FROM reports
            GROUP BY status
            ORDER BY count DESC
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log('📈 Current Status Distribution in Database:');
        statusDistribution.forEach(stat => {
            console.log(`   ${stat.status}: ${stat.count} reports`);
        });
        
        console.log('\n=== Diagnostic Complete ===');
        console.log('\nNext Steps:');
        console.log('1. Review the recently updated reports above');
        console.log('2. If you see reports that should NOT be marked as completed, run the revert script:');
        console.log('   node scripts/maintenance/revert-report-status-changes.js');
        
    } catch (error) {
        console.error('Error diagnosing report status changes:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the script
if (require.main === module) {
    diagnoseReportStatusChanges()
        .then(() => {
            console.log('\n✓ Diagnostic script execution completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n✗ Diagnostic script execution failed:', error);
            process.exit(1);
        });
}

module.exports = diagnoseReportStatusChanges;

