/**
 * Script to link existing invoices to their corresponding reports
 * This script matches invoices to reports based on client_id and amount
 */

const mysql = require('mysql2/promise');
const config = require('../config/config.js');

async function linkInvoicesToReports() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name
        });

        console.log('🔗 Starting invoice-to-report linking process...');

        // Find matching invoices and reports
        const [matches] = await connection.execute(`
            SELECT 
                i.id as invoice_id, 
                i.client_id, 
                i.total, 
                r.id as report_id, 
                r.client_id as report_client_id, 
                r.amount as report_amount 
            FROM invoices i 
            JOIN reports r ON i.client_id = r.client_id AND i.total = r.amount 
            WHERE r.billing_enabled = 1
        `);

        console.log(`📊 Found ${matches.length} potential matches`);

        if (matches.length === 0) {
            console.log('❌ No matches found');
            return;
        }

        // Check which links already exist
        const existingLinks = [];
        for (const match of matches) {
            const [existing] = await connection.execute(`
                SELECT id FROM invoice_reports 
                WHERE invoice_id = ? AND report_id = ?
            `, [match.invoice_id, match.report_id]);
            
            if (existing.length > 0) {
                existingLinks.push(match);
            }
        }

        console.log(`📋 Found ${existingLinks.length} existing links`);

        // Create new links
        const newLinks = matches.filter(match => 
            !existingLinks.some(existing => 
                existing.invoice_id === match.invoice_id && 
                existing.report_id === match.report_id
            )
        );

        console.log(`🆕 Creating ${newLinks.length} new links`);

        if (newLinks.length > 0) {
            // Insert new links
            for (const link of newLinks) {
                await connection.execute(`
                    INSERT INTO invoice_reports (invoice_id, report_id, created_at, updated_at) 
                    VALUES (?, ?, NOW(), NOW())
                `, [link.invoice_id, link.report_id]);
                
                console.log(`✅ Linked invoice ${link.invoice_id} to report ${link.report_id}`);
            }
        }

        // Also update the direct reportId field in invoices table for backward compatibility
        console.log('🔄 Updating direct reportId fields in invoices table...');
        
        for (const match of matches) {
            await connection.execute(`
                UPDATE invoices 
                SET reportId = ?, updated_at = NOW() 
                WHERE id = ?
            `, [match.report_id, match.invoice_id]);
            
            console.log(`✅ Updated invoice ${match.invoice_id} with reportId ${match.report_id}`);
        }

        console.log('🎉 Invoice-to-report linking completed successfully!');
        
        // Show summary
        const [finalCount] = await connection.execute(`
            SELECT COUNT(*) as count FROM invoice_reports
        `);
        
        console.log(`📈 Total invoice-report links in database: ${finalCount[0].count}`);

    } catch (error) {
        console.error('❌ Error linking invoices to reports:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    linkInvoicesToReports()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { linkInvoicesToReports }; 