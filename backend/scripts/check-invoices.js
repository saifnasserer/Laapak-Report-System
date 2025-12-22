const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/db');
const Invoice = require('../models/Invoice');

async function checkInvoices() {
    try {
        console.log('=== Checking Invoices in Database ===\n');
        
        // Get total count
        const [totalCount] = await sequelize.query(`
            SELECT COUNT(*) as total FROM invoices
        `);
        console.log(`Total Invoices: ${totalCount[0].total}\n`);
        
        // Get payment status distribution
        const [paymentStatusCounts] = await sequelize.query(`
            SELECT 
                paymentStatus,
                COUNT(*) as count
            FROM invoices
            GROUP BY paymentStatus
            ORDER BY count DESC
        `);
        
        console.log('Payment Status Distribution:');
        console.log('============================');
        paymentStatusCounts.forEach(item => {
            const status = item.paymentStatus || 'NULL';
            const count = item.count;
            console.log(`${status}: ${count} invoices`);
        });
        
        // Check for NULL payment statuses
        const [nullStatus] = await sequelize.query(`
            SELECT COUNT(*) as count FROM invoices WHERE paymentStatus IS NULL
        `);
        if (nullStatus[0].count > 0) {
            console.log(`\n⚠️  WARNING: ${nullStatus[0].count} invoices have NULL paymentStatus`);
        }
        
        // Get payment method distribution
        const [paymentMethodCounts] = await sequelize.query(`
            SELECT 
                paymentMethod,
                COUNT(*) as count
            FROM invoices
            GROUP BY paymentMethod
            ORDER BY count DESC
        `);
        
        console.log('\nPayment Method Distribution:');
        console.log('=============================');
        paymentMethodCounts.forEach(item => {
            const method = item.paymentMethod || 'NULL';
            const count = item.count;
            console.log(`${method}: ${count} invoices`);
        });
        
        // Get total amount statistics
        const [amountStats] = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                SUM(total) as totalAmount,
                AVG(total) as avgAmount,
                MIN(total) as minAmount,
                MAX(total) as maxAmount,
                SUM(CASE WHEN paymentStatus IN ('paid', 'completed', 'مدفوع', 'مكتمل') THEN total ELSE 0 END) as paidAmount,
                SUM(CASE WHEN paymentStatus IN ('unpaid', 'pending', 'غير مدفوع', 'قيد الانتظار') OR paymentStatus IS NULL THEN total ELSE 0 END) as unpaidAmount
            FROM invoices
        `);
        
        console.log('\n=== Financial Summary ===');
        console.log('=========================');
        const stats = amountStats[0];
        console.log(`Total Amount: ${parseFloat(stats.totalAmount || 0).toFixed(2)}`);
        console.log(`Average Amount: ${parseFloat(stats.avgAmount || 0).toFixed(2)}`);
        console.log(`Min Amount: ${parseFloat(stats.minAmount || 0).toFixed(2)}`);
        console.log(`Max Amount: ${parseFloat(stats.maxAmount || 0).toFixed(2)}`);
        console.log(`Paid Amount: ${parseFloat(stats.paidAmount || 0).toFixed(2)}`);
        console.log(`Unpaid Amount: ${parseFloat(stats.unpaidAmount || 0).toFixed(2)}`);
        
        // Get sample invoices for each payment status
        console.log('\n=== Sample Invoices by Payment Status ===');
        for (const item of paymentStatusCounts) {
            const status = item.paymentStatus || null;
            const [samples] = await sequelize.query(`
                SELECT id, paymentStatus, paymentMethod, total, created_at
                FROM invoices
                WHERE paymentStatus ${status ? `= '${status}'` : 'IS NULL'}
                ORDER BY created_at DESC
                LIMIT 3
            `);
            
            console.log(`\n${status || 'NULL'} (${item.count} total):`);
            samples.forEach(invoice => {
                console.log(`  - ID: ${invoice.id}, Amount: ${parseFloat(invoice.total || 0).toFixed(2)}, Method: ${invoice.paymentMethod || 'N/A'}, Date: ${invoice.created_at}`);
            });
        }
        
        // Check invoice-report linking
        const [linkedCount] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE reportId IS NOT NULL
        `);
        
        const [unlinkedCount] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE reportId IS NULL
        `);
        
        console.log('\n=== Invoice-Report Linking ===');
        console.log('===============================');
        console.log(`Linked to Reports: ${linkedCount[0].count}`);
        console.log(`Not Linked: ${unlinkedCount[0].count}`);
        
        // Check invoices with completed payment status
        const [completedCount] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE paymentStatus IN ('paid', 'completed', 'مدفوع', 'مكتمل')
        `);
        
        console.log('\n=== Summary ===');
        console.log('===============');
        console.log(`Total Invoices: ${totalCount[0].total}`);
        console.log(`Completed/Paid: ${completedCount[0].count}`);
        console.log(`Pending/Unpaid: ${totalCount[0].total - completedCount[0].count}`);
        
    } catch (error) {
        console.error('Error checking invoices:', error);
    } finally {
        await sequelize.close();
    }
}

checkInvoices();

