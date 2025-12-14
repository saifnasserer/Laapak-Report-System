// Load environment variables - .env is in project root
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sequelize } = require('../../config/db');
const Report = require('../../models/Report');

/**
 * Script to mark all reports with completed invoices as completed
 * 
 * This script finds reports linked to invoices with paymentStatus = 'completed' or 'paid'
 * and updates their status to 'مكتمل' (completed in Arabic)
 * 
 * Usage:
 *   cd backend
 *   node scripts/maintenance/mark-reports-with-completed-invoices.js
 * 
 * The script will:
 * 1. Find all reports linked to completed/paid invoices (via invoice_reports table or direct link)
 * 2. Update their status to 'مكتمل' if not already completed
 * 3. Show a summary of updated reports
 * 4. Verify the updates
 */
async function markReportsWithCompletedInvoices() {
    try {
        console.log('Starting script to mark reports with completed invoices as completed...\n');
        
        // Test database connection
        await sequelize.authenticate();
        console.log('✓ Database connection established\n');
        
        // Find all reports linked to completed/paid invoices
        // Method 1: Through invoice_reports junction table
        const reportsViaJunction = await sequelize.query(`
            SELECT DISTINCT r.id, r.status, r.order_number, r.device_model
            FROM reports r
            INNER JOIN invoice_reports ir ON r.id = ir.report_id
            INNER JOIN invoices i ON ir.invoice_id = i.id
            WHERE i.paymentStatus IN ('completed', 'paid')
            AND r.status != 'مكتمل'
            AND r.status != 'completed'
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`Found ${reportsViaJunction.length} reports via invoice_reports junction table`);
        
        // Method 2: Through direct reportId field in invoices
        const reportsViaDirectLink = await sequelize.query(`
            SELECT DISTINCT r.id, r.status, r.order_number, r.device_model
            FROM reports r
            INNER JOIN invoices i ON (r.id = i.reportId OR r.id = i.report_id)
            WHERE i.paymentStatus IN ('completed', 'paid')
            AND r.status != 'مكتمل'
            AND r.status != 'completed'
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`Found ${reportsViaDirectLink.length} reports via direct invoice link\n`);
        
        // Combine and deduplicate report IDs
        const allReportIds = new Set();
        const reportsToUpdate = [];
        
        [...reportsViaJunction, ...reportsViaDirectLink].forEach(report => {
            if (!allReportIds.has(report.id)) {
                allReportIds.add(report.id);
                reportsToUpdate.push(report);
            }
        });
        
        console.log(`Total unique reports to update: ${reportsToUpdate.length}\n`);
        
        if (reportsToUpdate.length === 0) {
            console.log('No reports need to be updated. All reports with completed invoices are already marked as completed.');
            return;
        }
        
        // Show preview of reports to be updated
        console.log('Reports to be updated:');
        console.log('─'.repeat(80));
        reportsToUpdate.slice(0, 10).forEach((report, index) => {
            console.log(`${index + 1}. Report ID: ${report.id}`);
            console.log(`   Order: ${report.order_number || 'N/A'}, Device: ${report.device_model || 'N/A'}`);
            console.log(`   Current Status: ${report.status || 'NULL'} → New Status: مكتمل`);
            console.log('');
        });
        
        if (reportsToUpdate.length > 10) {
            console.log(`... and ${reportsToUpdate.length - 10} more reports\n`);
        }
        
        // Update reports using Sequelize
        const reportIds = Array.from(allReportIds);
        let updatedCount = 0;
        
        console.log('Updating reports...');
        
        // Update in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < reportIds.length; i += batchSize) {
            const batch = reportIds.slice(i, i + batchSize);
            
            const [affectedRows] = await Report.update(
                { status: 'مكتمل' },
                {
                    where: {
                        id: batch
                    }
                }
            );
            
            updatedCount += affectedRows;
            console.log(`  Updated batch ${Math.floor(i / batchSize) + 1}: ${affectedRows} reports`);
        }
        
        console.log(`\n✓ Successfully updated ${updatedCount} reports to 'مكتمل' status\n`);
        
        // Verify the update
        const verifyQuery = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM reports r
            WHERE r.status = 'مكتمل'
            AND (
                EXISTS (
                    SELECT 1 FROM invoice_reports ir
                    INNER JOIN invoices i ON ir.invoice_id = i.id
                    WHERE ir.report_id = r.id
                    AND i.paymentStatus IN ('completed', 'paid')
                )
                OR EXISTS (
                    SELECT 1 FROM invoices i
                    WHERE (i.reportId = r.id OR i.report_id = r.id)
                    AND i.paymentStatus IN ('completed', 'paid')
                )
            )
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        const verifiedCount = verifyQuery[0]?.count || 0;
        console.log(`✓ Verification: ${verifiedCount} reports with completed invoices are now marked as 'مكتمل'\n`);
        
        console.log('Script completed successfully!');
        
    } catch (error) {
        console.error('Error marking reports with completed invoices:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the script
if (require.main === module) {
    markReportsWithCompletedInvoices()
        .then(() => {
            console.log('\n✓ Script execution completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n✗ Script execution failed:', error);
            process.exit(1);
        });
}

module.exports = markReportsWithCompletedInvoices;

