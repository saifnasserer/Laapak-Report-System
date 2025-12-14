// Load environment variables - .env is in project root
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sequelize } = require('../../config/db');
const Report = require('../../models/Report');

/**
 * Revert script to undo changes made by mark-reports-with-completed-invoices.js
 * 
 * This script attempts to revert reports that were incorrectly marked as 'مكتمل'
 * by the mark-reports-with-completed-invoices script.
 * 
 * WARNING: This script uses heuristics to determine what the original status should be.
 * It's recommended to:
 * 1. First run diagnose-report-status-changes.js to see what was changed
 * 2. Review the reports that will be reverted
 * 3. Manually adjust any reports that need different statuses
 * 
 * The script will:
 * 1. Find reports marked as 'مكتمل' that were recently updated (likely by the script)
 * 2. Revert them to 'قيد المعالجة' (in-progress) if they were created recently
 * 3. Or revert to 'قيد الانتظار' (pending) if they're very new
 * 
 * Usage:
 *   cd backend
 *   node scripts/maintenance/revert-report-status-changes.js [--dry-run] [--status=STATUS]
 * 
 * Options:
 *   --dry-run: Show what would be changed without actually changing anything
 *   --status=STATUS: Set all reverted reports to this status (default: 'قيد المعالجة')
 */
async function revertReportStatusChanges(options = {}) {
    try {
        const isDryRun = options.dryRun || process.argv.includes('--dry-run');
        const targetStatus = options.status || 
                           process.argv.find(arg => arg.startsWith('--status='))?.split('=')[1] ||
                           'قيد المعالجة';
        
        console.log('=== REVERT: Undoing Report Status Changes ===\n');
        if (isDryRun) {
            console.log('⚠️  DRY RUN MODE - No changes will be made\n');
        }
        console.log(`Target status for reverted reports: ${targetStatus}\n`);
        
        // Test database connection
        await sequelize.authenticate();
        console.log('✓ Database connection established\n');
        
        // Find reports that were likely changed by the script
        // These are reports marked as 'مكتمل' that:
        // 1. Are linked to completed/paid invoices
        // 2. Were updated in the last 7 days (likely by the script)
        // 3. Were created recently (suggesting they might not actually be completed)
        const reportsToRevert = await sequelize.query(`
            SELECT DISTINCT 
                r.id,
                r.status,
                r.order_number,
                r.device_model,
                r.client_name,
                r.created_at,
                r.updated_at,
                DATEDIFF(r.updated_at, r.created_at) as days_between,
                i.id as invoice_id,
                i.paymentStatus
            FROM reports r
            LEFT JOIN invoice_reports ir ON r.id = ir.report_id
            LEFT JOIN invoices i ON (ir.invoice_id = i.id OR r.id = i.reportId OR r.id = i.report_id)
            WHERE r.status = 'مكتمل'
            AND i.paymentStatus IN ('completed', 'paid')
            AND r.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY r.updated_at DESC
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`Found ${reportsToRevert.length} reports that may need to be reverted\n`);
        
        if (reportsToRevert.length === 0) {
            console.log('No reports found that need to be reverted.');
            return;
        }
        
        // Show preview of reports to be reverted
        console.log('Reports to be reverted:');
        console.log('─'.repeat(100));
        reportsToRevert.slice(0, 20).forEach((report, index) => {
            console.log(`${index + 1}. Report ID: ${report.id}`);
            console.log(`   Order: ${report.order_number || 'N/A'}, Device: ${report.device_model || 'N/A'}`);
            console.log(`   Client: ${report.client_name || 'N/A'}`);
            console.log(`   Current Status: ${report.status}`);
            console.log(`   Will revert to: ${targetStatus}`);
            console.log(`   Created: ${report.created_at}`);
            console.log(`   Last Updated: ${report.updated_at}`);
            console.log(`   Days between creation and completion: ${report.days_between}`);
            console.log('');
        });
        
        if (reportsToRevert.length > 20) {
            console.log(`... and ${reportsToRevert.length - 20} more reports\n`);
        }
        
        if (isDryRun) {
            console.log('\n⚠️  DRY RUN - No changes were made');
            console.log(`Would revert ${reportsToRevert.length} reports to status: ${targetStatus}`);
            return;
        }
        
        // Ask for confirmation
        console.log(`\n⚠️  WARNING: This will revert ${reportsToRevert.length} reports from 'مكتمل' to '${targetStatus}'`);
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Revert the reports
        const reportIds = reportsToRevert.map(r => r.id);
        let updatedCount = 0;
        
        console.log('Reverting reports...');
        
        // Update in batches
        const batchSize = 50;
        for (let i = 0; i < reportIds.length; i += batchSize) {
            const batch = reportIds.slice(i, i + batchSize);
            
            const [affectedRows] = await Report.update(
                { status: targetStatus },
                {
                    where: {
                        id: batch
                    }
                }
            );
            
            updatedCount += affectedRows;
            console.log(`  Reverted batch ${Math.floor(i / batchSize) + 1}: ${affectedRows} reports`);
        }
        
        console.log(`\n✓ Successfully reverted ${updatedCount} reports to '${targetStatus}' status\n`);
        
        // Verify the revert
        const verifyQuery = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM reports r
            LEFT JOIN invoice_reports ir ON r.id = ir.report_id
            LEFT JOIN invoices i ON (ir.invoice_id = i.id OR r.id = i.reportId OR r.id = i.report_id)
            WHERE r.status = '${targetStatus}'
            AND i.paymentStatus IN ('completed', 'paid')
            AND r.updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        const verifiedCount = verifyQuery[0]?.count || 0;
        console.log(`✓ Verification: ${verifiedCount} reports with completed invoices are now marked as '${targetStatus}'\n`);
        
        console.log('Script completed successfully!');
        console.log('\nNote: Please review the reverted reports and manually adjust any that need different statuses.');
        
    } catch (error) {
        console.error('Error reverting report status changes:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the script
if (require.main === module) {
    const options = {
        dryRun: process.argv.includes('--dry-run'),
        status: process.argv.find(arg => arg.startsWith('--status='))?.split('=')[1]
    };
    
    revertReportStatusChanges(options)
        .then(() => {
            console.log('\n✓ Revert script execution completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n✗ Revert script execution failed:', error);
            process.exit(1);
        });
}

module.exports = revertReportStatusChanges;

