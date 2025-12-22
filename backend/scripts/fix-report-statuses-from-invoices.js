const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/db');
const Report = require('../models/Report');
const Invoice = require('../models/Invoice');

/**
 * Script to fix report statuses based on invoice payment status
 * - Matches linked reports to invoice status
 * - Fixes NULL and 'active' statuses
 * - Ensures 4 statuses: completed, pending, shipped, cancelled
 */

async function fixReportStatusesFromInvoices() {
    try {
        console.log('=== Fixing Report Statuses from Invoice Status ===\n');
        
        // Step 1: Check current status distribution
        console.log('Step 1: Checking current report status distribution...');
        const [currentStatuses] = await sequelize.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM reports
            GROUP BY status
            ORDER BY count DESC
        `);
        
        console.log('Current status distribution:');
        currentStatuses.forEach(item => {
            console.log(`  ${item.status || 'NULL'}: ${item.count} reports`);
        });
        
        // Step 2: Check invoice-report relationships
        console.log('\nStep 2: Checking invoice-report relationships...');
        const [relationships] = await sequelize.query(`
            SELECT 
                r.id as report_id,
                r.status as report_status,
                r.order_number,
                i.id as invoice_id,
                i.paymentStatus as invoice_payment_status,
                i.reportId
            FROM reports r
            LEFT JOIN invoices i ON r.id = i.reportId
            ORDER BY r.id
            LIMIT 10
        `);
        
        console.log('Sample relationships:');
        relationships.forEach(rel => {
            console.log(`  Report ${rel.report_id} (${rel.report_status || 'NULL'}) -> Invoice ${rel.invoice_id || 'NONE'} (${rel.invoice_payment_status || 'NONE'})`);
        });
        
        // Step 3: Map invoice status to report status
        // Rules:
        // - completed/paid invoice -> 'completed' report
        // - cancelled invoice -> 'cancelled' report
        // - unpaid/pending invoice -> 'pending' report
        // - NULL/active report -> 'pending' report (default)
        // - shipped status will be set manually or via other logic
        
        console.log('\nStep 3: Updating report statuses based on invoice status...');
        
        // 3a. Update reports with completed invoices to 'completed'
        const [completedResult] = await sequelize.query(`
            UPDATE reports r
            INNER JOIN invoices i ON r.id = i.reportId
            SET r.status = 'completed'
            WHERE i.paymentStatus IN ('completed', 'paid')
            AND r.status != 'completed'
        `);
        console.log(`  ✓ Updated ${completedResult.affectedRows} reports to 'completed' (from completed invoices)`);
        
        // 3b. Update reports with cancelled invoices to 'cancelled'
        const [cancelledResult] = await sequelize.query(`
            UPDATE reports r
            INNER JOIN invoices i ON r.id = i.reportId
            SET r.status = 'cancelled'
            WHERE i.paymentStatus = 'cancelled'
            AND r.status != 'cancelled'
        `);
        console.log(`  ✓ Updated ${cancelledResult.affectedRows} reports to 'cancelled' (from cancelled invoices)`);
        
        // 3c. Update reports with unpaid/pending invoices to 'pending'
        const [pendingResult] = await sequelize.query(`
            UPDATE reports r
            INNER JOIN invoices i ON r.id = i.reportId
            SET r.status = 'pending'
            WHERE i.paymentStatus IN ('unpaid', 'pending', 'partial')
            AND r.status NOT IN ('pending', 'completed', 'cancelled', 'shipped')
        `);
        console.log(`  ✓ Updated ${pendingResult.affectedRows} reports to 'pending' (from unpaid invoices)`);
        
        // Step 4: Fix NULL statuses (do this BEFORE updating ENUM)
        console.log('\nStep 4: Fixing NULL statuses...');
        
        // First, temporarily allow NULL in ENUM if needed, or use a workaround
        // Check reports with NULL status and see if they have invoices
        const [nullReports] = await sequelize.query(`
            SELECT r.id, r.status, i.paymentStatus
            FROM reports r
            LEFT JOIN invoices i ON r.id = i.reportId
            WHERE r.status IS NULL
            LIMIT 5
        `);
        
        console.log(`  Found ${nullReports.length} NULL status reports (sample)`);
        
        // Update NULL statuses - try using COALESCE or direct update
        // First, update NULL reports that have invoices
        const [nullWithInvoice] = await sequelize.query(`
            UPDATE reports r
            INNER JOIN invoices i ON r.id = i.reportId
            SET r.status = CASE 
                WHEN i.paymentStatus IN ('completed', 'paid') THEN 'completed'
                WHEN i.paymentStatus = 'cancelled' THEN 'cancelled'
                WHEN i.paymentStatus IN ('unpaid', 'pending', 'partial') THEN 'pending'
                ELSE 'pending'
            END
            WHERE r.status IS NULL
        `);
        console.log(`  ✓ Updated ${nullWithInvoice.affectedRows} NULL reports (with invoices) based on invoice status`);
        
        // Then update remaining NULL reports to 'pending'
        const [nullResult] = await sequelize.query(`
            UPDATE reports
            SET status = 'pending'
            WHERE status IS NULL
        `);
        console.log(`  ✓ Updated ${nullResult.affectedRows} NULL reports to 'pending'`);
        
        // Step 5: Fix 'active' statuses
        console.log('\nStep 5: Fixing "active" statuses...');
        const [activeResult] = await sequelize.query(`
            UPDATE reports
            SET status = 'pending'
            WHERE status = 'active'
        `);
        console.log(`  ✓ Updated ${activeResult.affectedRows} reports from 'active' to 'pending'`);
        
        // Step 6: Convert any remaining non-standard statuses
        console.log('\nStep 6: Converting non-standard statuses...');
        
        // Convert Arabic and other statuses to English equivalents
        const conversions = [
            { from: 'مكتمل', to: 'completed' },
            { from: 'ملغي', to: 'cancelled' },
            { from: 'ملغى', to: 'cancelled' },
            { from: 'قيد الانتظار', to: 'pending' },
            { from: 'قيد المعالجة', to: 'pending' },
            { from: 'in-progress', to: 'pending' },
            { from: 'canceled', to: 'cancelled' }
        ];
        
        for (const conv of conversions) {
            const [result] = await sequelize.query(`
                UPDATE reports
                SET status = '${conv.to}'
                WHERE status = '${conv.from}'
            `);
            if (result.affectedRows > 0) {
                console.log(`  ✓ Converted ${result.affectedRows} reports from '${conv.from}' to '${conv.to}'`);
            }
        }
        
        // Step 7: Update ENUM to include only the 4 required statuses
        console.log('\nStep 7: Updating status ENUM to include only required statuses...');
        
        // First, check if there are any reports with statuses not in our 4 required ones
        const [statusCheck] = await sequelize.query(`
            SELECT DISTINCT status FROM reports 
            WHERE status IS NOT NULL 
            AND status NOT IN ('completed', 'pending', 'shipped', 'cancelled')
        `);
        
        if (statusCheck.length > 0) {
            console.log(`  ⚠️  Found ${statusCheck.length} non-standard statuses, converting to 'pending'...`);
            for (const item of statusCheck) {
                const oldStatus = item.status;
                if (oldStatus) {
                    await sequelize.query(`
                        UPDATE reports
                        SET status = 'pending'
                        WHERE status = '${oldStatus}'
                    `);
                    console.log(`    ✓ Converted '${oldStatus}' to 'pending'`);
                }
            }
        }
        
        // Now update the ENUM
        try {
            await sequelize.query(`
                ALTER TABLE reports 
                MODIFY COLUMN status ENUM('completed', 'pending', 'shipped', 'cancelled') 
                DEFAULT 'pending'
            `);
            console.log('  ✓ Updated ENUM to include: completed, pending, shipped, cancelled');
        } catch (error) {
            console.log(`  ⚠️  Could not update ENUM: ${error.message}`);
            // Try alternative approach - might need to handle NULL values first
            if (error.message.includes('NULL')) {
                console.log('  Attempting to fix NULL values first...');
                await sequelize.query(`
                    UPDATE reports SET status = 'pending' WHERE status IS NULL
                `);
                // Try again
                try {
                    await sequelize.query(`
                        ALTER TABLE reports 
                        MODIFY COLUMN status ENUM('completed', 'pending', 'shipped', 'cancelled') 
                        DEFAULT 'pending'
                    `);
                    console.log('  ✓ Updated ENUM after fixing NULL values');
                } catch (error2) {
                    console.log(`  ⚠️  Still could not update ENUM: ${error2.message}`);
                }
            }
        }
        
        // Step 8: Final status distribution
        console.log('\nStep 8: Final status distribution...');
        const [finalStatuses] = await sequelize.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM reports
            GROUP BY status
            ORDER BY count DESC
        `);
        
        console.log('Final status distribution:');
        finalStatuses.forEach(item => {
            console.log(`  ${item.status || 'NULL'}: ${item.count} reports`);
        });
        
        // Step 9: Verify invoice-report status alignment
        console.log('\nStep 9: Verifying invoice-report status alignment...');
        const [alignmentCheck] = await sequelize.query(`
            SELECT 
                r.status as report_status,
                i.paymentStatus as invoice_status,
                COUNT(*) as count
            FROM reports r
            INNER JOIN invoices i ON r.id = i.reportId
            GROUP BY r.status, i.paymentStatus
            ORDER BY count DESC
        `);
        
        console.log('Report-Invoice status alignment:');
        alignmentCheck.forEach(item => {
            console.log(`  Report: ${item.report_status} | Invoice: ${item.invoice_status} | Count: ${item.count}`);
        });
        
        // Step 10: Check for misaligned statuses
        console.log('\nStep 10: Checking for misaligned statuses...');
        const [misaligned] = await sequelize.query(`
            SELECT 
                r.id as report_id,
                r.status as report_status,
                r.order_number,
                i.paymentStatus as invoice_status
            FROM reports r
            INNER JOIN invoices i ON r.id = i.reportId
            WHERE (
                (i.paymentStatus IN ('completed', 'paid') AND r.status != 'completed') OR
                (i.paymentStatus = 'cancelled' AND r.status != 'cancelled') OR
                (i.paymentStatus IN ('unpaid', 'pending', 'partial') AND r.status NOT IN ('pending', 'shipped'))
            )
            LIMIT 10
        `);
        
        if (misaligned.length > 0) {
            console.log(`  ⚠️  Found ${misaligned.length} potentially misaligned reports:`);
            misaligned.forEach(item => {
                console.log(`    Report ${item.report_id} (${item.report_status}) -> Invoice (${item.invoice_status})`);
            });
        } else {
            console.log('  ✓ No misaligned statuses found');
        }
        
        // Step 11: Summary
        console.log('\n=== Summary ===');
        console.log('===============');
        const [summary] = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_status
            FROM reports
        `);
        
        const s = summary[0];
        console.log(`Total Reports: ${s.total}`);
        console.log(`  - Completed: ${s.completed}`);
        console.log(`  - Pending: ${s.pending}`);
        console.log(`  - Shipped: ${s.shipped}`);
        console.log(`  - Cancelled: ${s.cancelled}`);
        console.log(`  - NULL: ${s.null_status}`);
        
        console.log('\n✅ Report status fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing report statuses:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the script
fixReportStatusesFromInvoices()
    .then(() => {
        console.log('\nScript completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });

