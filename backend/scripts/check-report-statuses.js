const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/db');
const Report = require('../models/Report');

async function checkReportStatuses() {
    try {
        console.log('=== Checking Report Statuses in Database ===\n');
        
        // Get all unique statuses and their counts
        const [statusCounts] = await sequelize.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM reports
            GROUP BY status
            ORDER BY count DESC
        `);
        
        console.log('Status Distribution:');
        console.log('===================');
        statusCounts.forEach(item => {
            const status = item.status || 'NULL';
            const count = item.count;
            console.log(`${status}: ${count} reports`);
        });
        
        // Get total count
        const [totalCount] = await sequelize.query(`
            SELECT COUNT(*) as total FROM reports
        `);
        console.log(`\nTotal Reports: ${totalCount[0].total}`);
        
        // Check for NULL statuses
        const [nullStatus] = await sequelize.query(`
            SELECT COUNT(*) as count FROM reports WHERE status IS NULL
        `);
        if (nullStatus[0].count > 0) {
            console.log(`\n⚠️  WARNING: ${nullStatus[0].count} reports have NULL status`);
        }
        
        // Get sample reports for each status
        console.log('\n=== Sample Reports by Status ===');
        for (const item of statusCounts) {
            const status = item.status || null;
            const [samples] = await sequelize.query(`
                SELECT id, order_number, status, inspection_date, created_at
                FROM reports
                WHERE status ${status ? `= '${status}'` : 'IS NULL'}
                LIMIT 3
            `);
            
            console.log(`\n${status || 'NULL'} (${item.count} total):`);
            samples.forEach(report => {
                console.log(`  - ID: ${report.id}, Order: ${report.order_number}, Date: ${report.inspection_date || report.created_at}`);
            });
        }
        
        // Check if all are pending
        const [pendingCount] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM reports 
            WHERE status IN ('قيد الانتظار', 'pending', 'active') OR status IS NULL
        `);
        
        const allPending = pendingCount[0].count === totalCount[0].total;
        
        console.log('\n=== Summary ===');
        console.log('================');
        if (allPending) {
            console.log('✅ All reports are pending (or NULL)');
        } else {
            console.log('❌ NOT all reports are pending');
            console.log(`   Pending reports: ${pendingCount[0].count}`);
            console.log(`   Non-pending reports: ${totalCount[0].total - pendingCount[0].count}`);
        }
        
    } catch (error) {
        console.error('Error checking report statuses:', error);
    } finally {
        await sequelize.close();
    }
}

checkReportStatuses();

