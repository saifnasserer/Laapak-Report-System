/**
 * Script to link existing invoices to their reports
 * This script will match invoices with reports based on client_id and other criteria
 */

const { Sequelize, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Report, Invoice, Client } = require('../models');

async function linkExistingInvoices() {
    try {
        console.log('🔗 Starting to link existing invoices to reports...\n');

        // Get all invoices that don't have a reportId
        const unlinkedInvoices = await Invoice.findAll({
            where: {
                reportId: null
            },
            include: [{
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'phone']
            }]
        });

        console.log(`📊 Found ${unlinkedInvoices.length} invoices without report links`);

        if (unlinkedInvoices.length === 0) {
            console.log('✅ All invoices are already linked to reports!');
            return;
        }

        let linkedCount = 0;
        let skippedCount = 0;
        let errors = [];

        for (const invoice of unlinkedInvoices) {
            try {
                console.log(`\n🔍 Processing invoice: ${invoice.id}`);
                console.log(`   Client ID: ${invoice.client_id}`);
                console.log(`   Date: ${invoice.date}`);

                // Strategy 1: Find reports by client_id and date proximity
                const reports = await Report.findAll({
                    where: {
                        client_id: invoice.client_id
                    },
                    order: [['inspection_date', 'DESC']]
                });

                console.log(`   Found ${reports.length} reports for this client`);

                if (reports.length === 0) {
                    console.log(`   ⚠️  No reports found for client ${invoice.client_id}`);
                    skippedCount++;
                    continue;
                }

                // Strategy 2: Try to match by date proximity (within 30 days)
                const invoiceDate = new Date(invoice.date);
                let bestMatch = null;
                let bestDateDiff = Infinity;

                for (const report of reports) {
                    const reportDate = new Date(report.inspection_date);
                    const dateDiff = Math.abs(invoiceDate - reportDate);
                    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

                    console.log(`     Report ${report.id}: ${daysDiff.toFixed(1)} days difference`);

                    // If report doesn't have an invoice and date is close, consider it a match
                    if (!report.invoice_created && daysDiff < 30) {
                        if (daysDiff < bestDateDiff) {
                            bestDateDiff = daysDiff;
                            bestMatch = report;
                        }
                    }
                }

                // Strategy 3: If no date match, try to match with reports that don't have invoices
                if (!bestMatch) {
                    const reportsWithoutInvoices = reports.filter(r => !r.invoice_created);
                    if (reportsWithoutInvoices.length > 0) {
                        bestMatch = reportsWithoutInvoices[0]; // Take the most recent
                        console.log(`   📅 No close date match, using most recent unlinked report`);
                    }
                }

                if (bestMatch) {
                    // Update the invoice with the report ID
                    await invoice.update({
                        reportId: bestMatch.id,
                        report_order_number: bestMatch.order_number,
                        created_from_report: true
                    });

                    // Update the report to mark it as having an invoice
                    await bestMatch.update({
                        invoice_created: true,
                        invoice_id: invoice.id,
                        invoice_date: invoice.date
                    });

                    console.log(`   ✅ Linked invoice ${invoice.id} to report ${bestMatch.id}`);
                    console.log(`   📋 Report order: ${bestMatch.order_number}`);
                    console.log(`   📅 Date difference: ${bestDateDiff.toFixed(1)} days`);
                    linkedCount++;
                } else {
                    console.log(`   ⚠️  No suitable report found for invoice ${invoice.id}`);
                    console.log(`   💡 This invoice might need manual linking`);
                    skippedCount++;
                }

            } catch (error) {
                console.error(`   ❌ Error processing invoice ${invoice.id}:`, error.message);
                errors.push({ invoiceId: invoice.id, error: error.message });
            }
        }

        // Summary
        console.log('\n📈 LINKING SUMMARY:');
        console.log(`   Total invoices processed: ${unlinkedInvoices.length}`);
        console.log(`   Successfully linked: ${linkedCount}`);
        console.log(`   Skipped (no match): ${skippedCount}`);
        console.log(`   Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            errors.forEach(error => {
                console.log(`   Invoice ${error.invoiceId}: ${error.error}`);
            });
        }

        // Final validation
        console.log('\n🔍 FINAL VALIDATION:');
        const remainingUnlinked = await Invoice.count({
            where: { reportId: null }
        });
        console.log(`   Remaining unlinked invoices: ${remainingUnlinked}`);

        const reportsWithInvoices = await Report.count({
            where: { invoice_created: true }
        });
        console.log(`   Reports with invoices: ${reportsWithInvoices}`);

        if (remainingUnlinked === 0) {
            console.log('\n✅ SUCCESS: All invoices are now linked to reports!');
        } else {
            console.log(`\n⚠️  WARNING: ${remainingUnlinked} invoices still need manual linking`);
            console.log('💡 Consider running this script again or manually linking the remaining invoices');
        }

    } catch (error) {
        console.error('❌ Fatal error during linking process:', error);
        throw error;
    }
}

// Function to show current linking status
async function showLinkingStatus() {
    try {
        console.log('📊 CURRENT INVOICE-REPORT LINKING STATUS:\n');

        const totalInvoices = await Invoice.count();
        const linkedInvoices = await Invoice.count({ where: { reportId: { [Op.ne]: null } } });
        const unlinkedInvoices = await Invoice.count({ where: { reportId: null } });

        const totalReports = await Report.count();
        const reportsWithInvoices = await Report.count({ where: { invoice_created: true } });
        const reportsWithoutInvoices = await Report.count({ where: { invoice_created: false } });

        console.log('INVOICES:');
        console.log(`   Total: ${totalInvoices}`);
        console.log(`   Linked: ${linkedInvoices}`);
        console.log(`   Unlinked: ${unlinkedInvoices}`);
        console.log(`   Linking rate: ${((linkedInvoices / totalInvoices) * 100).toFixed(2)}%`);

        console.log('\nREPORTS:');
        console.log(`   Total: ${totalReports}`);
        console.log(`   With invoices: ${reportsWithInvoices}`);
        console.log(`   Without invoices: ${reportsWithoutInvoices}`);

        if (unlinkedInvoices > 0) {
            console.log('\n🔍 UNLINKED INVOICES DETAILS:');
            const unlinked = await Invoice.findAll({
                where: { reportId: null },
                include: [{
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name']
                }],
                limit: 10
            });

            unlinked.forEach(invoice => {
                console.log(`   - Invoice ${invoice.id}: Client ${invoice.client?.name || invoice.client_id} (${invoice.date})`);
            });

            if (unlinkedInvoices > 10) {
                console.log(`   ... and ${unlinkedInvoices - 10} more`);
            }
        }

    } catch (error) {
        console.error('❌ Error showing status:', error);
    }
}

// Function to manually link specific invoice to report
async function manuallyLinkInvoice(invoiceId, reportId) {
    try {
        console.log(`🔗 Manually linking invoice ${invoiceId} to report ${reportId}...`);

        const invoice = await Invoice.findByPk(invoiceId);
        const report = await Report.findByPk(reportId);

        if (!invoice) {
            throw new Error(`Invoice ${invoiceId} not found`);
        }

        if (!report) {
            throw new Error(`Report ${reportId} not found`);
        }

        if (invoice.reportId) {
            throw new Error(`Invoice ${invoiceId} is already linked to report ${invoice.reportId}`);
        }

        if (report.invoice_created) {
            throw new Error(`Report ${reportId} already has an invoice (${report.invoice_id})`);
        }

        // Update invoice
        await invoice.update({
            reportId: reportId,
            report_order_number: report.order_number,
            created_from_report: true
        });

        // Update report
        await report.update({
            invoice_created: true,
            invoice_id: invoiceId,
            invoice_date: invoice.date
        });

        console.log(`✅ Successfully linked invoice ${invoiceId} to report ${reportId}`);

    } catch (error) {
        console.error(`❌ Error linking invoice ${invoiceId} to report ${reportId}:`, error.message);
        throw error;
    }
}

// Export functions for use in other scripts
module.exports = {
    linkExistingInvoices,
    showLinkingStatus,
    manuallyLinkInvoice
};

// Run the linking if this script is executed directly
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'status':
            showLinkingStatus().then(() => process.exit(0));
            break;
        case 'link':
            linkExistingInvoices().then(() => process.exit(0));
            break;
        case 'manual':
            const invoiceId = process.argv[3];
            const reportId = process.argv[4];
            if (!invoiceId || !reportId) {
                console.error('Usage: node link-existing-invoices.js manual <invoiceId> <reportId>');
                process.exit(1);
            }
            manuallyLinkInvoice(invoiceId, reportId).then(() => process.exit(0));
            break;
        default:
            console.log('Usage:');
            console.log('  node link-existing-invoices.js status    - Show current linking status');
            console.log('  node link-existing-invoices.js link      - Link all unlinked invoices');
            console.log('  node link-existing-invoices.js manual <invoiceId> <reportId> - Manually link specific invoice');
            process.exit(1);
    }
} 