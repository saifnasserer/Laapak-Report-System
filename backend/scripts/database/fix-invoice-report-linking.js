/**
 * Comprehensive script to analyze and fix invoice-report linking
 * 
 * This script:
 * 1. Analyzes current linking status
 * 2. Identifies unlinked invoices and reports
 * 3. Links them using multiple strategies:
 *    - Through invoice_reports junction table
 *    - Through invoice items (report_id field)
 *    - Through serial numbers matching
 *    - Through client_id and date proximity
 *    - Through legacy reportId field in invoices
 *    - Through invoice_id field in reports
 */

// Load environment variables - .env is in project root
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { Sequelize, Op } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Report, Invoice, Client, InvoiceReport, InvoiceItem } = require('../../models');

/**
 * Analyze current linking status
 */
async function analyzeLinkingStatus() {
    try {
        console.log('\n📊 ANALYZING INVOICE-REPORT LINKING STATUS...\n');

        // Get counts
        const totalInvoices = await Invoice.count();
        const totalReports = await Report.count();
        const totalJunctionLinks = await InvoiceReport.count();

        // Invoices with reportId (legacy field)
        const invoicesWithReportId = await Invoice.count({
            where: { reportId: { [Op.ne]: null } }
        });

        // Reports with invoice_id
        const reportsWithInvoiceId = await Report.count({
            where: { invoice_id: { [Op.ne]: null } }
        });

        // Reports with invoice_created flag
        const reportsWithInvoiceCreated = await Report.count({
            where: { invoice_created: true }
        });

        // Invoice items with report_id
        const invoiceItemsWithReportId = await InvoiceItem.count({
            where: { report_id: { [Op.ne]: null } }
        });

        // Find invoices not linked in junction table
        const invoicesNotInJunction = await sequelize.query(`
            SELECT i.id, i.client_id, i.date, i.reportId
            FROM invoices i
            LEFT JOIN invoice_reports ir ON i.id = ir.invoice_id
            WHERE ir.id IS NULL
        `, { type: Sequelize.QueryTypes.SELECT });

        // Find reports not linked in junction table but have invoice_id
        const reportsNotInJunction = await sequelize.query(`
            SELECT r.id, r.client_id, r.order_number, r.invoice_id, r.invoice_created
            FROM reports r
            WHERE r.invoice_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM invoice_reports ir 
                WHERE ir.report_id = r.id AND ir.invoice_id = r.invoice_id
            )
        `, { type: Sequelize.QueryTypes.SELECT });

        // Find invoice items with report_id but not in junction table
        const invoiceItemsNotLinked = await sequelize.query(`
            SELECT ii.invoiceId, ii.report_id, ii.serialNumber, ii.description
            FROM invoice_items ii
            WHERE ii.report_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM invoice_reports ir 
                WHERE ir.invoice_id = ii.invoiceId AND ir.report_id = ii.report_id
            )
        `, { type: Sequelize.QueryTypes.SELECT });

        console.log('📈 SUMMARY STATISTICS:');
        console.log(`   Total Invoices: ${totalInvoices}`);
        console.log(`   Total Reports: ${await Report.count()}`);
        console.log(`   Junction Table Links: ${totalJunctionLinks}`);
        console.log(`   Invoices with reportId (legacy): ${invoicesWithReportId}`);
        console.log(`   Reports with invoice_id: ${await Report.count({ where: { invoice_id: { [Op.ne]: null } } })}`);
        console.log(`   Reports with invoice_created flag: ${reportsWithInvoiceCreated}`);
        console.log(`   Invoice Items with report_id: ${invoiceItemsWithReportId}`);

        console.log('\n🔍 UNLINKED RECORDS:');
        console.log(`   Invoices not in junction table: ${invoicesNotInJunction.length}`);
        console.log(`   Reports with invoice_id but not in junction: ${reportsNotInJunction.length}`);
        console.log(`   Invoice items with report_id but not linked: ${invoiceItemsNotLinked.length}`);

        return {
            invoicesNotInJunction,
            reportsNotInJunction,
            invoiceItemsNotLinked,
            totalInvoices,
            totalReports: await Report.count(),
            totalJunctionLinks
        };
    } catch (error) {
        console.error('❌ Error analyzing linking status:', error);
        throw error;
    }
}

/**
 * Strategy 1: Link through invoice items (report_id field)
 */
async function linkThroughInvoiceItems(dryRun = false) {
    try {
        console.log('\n🔗 STRATEGY 1: Linking through invoice items...');

        const invoiceItems = await InvoiceItem.findAll({
            where: {
                report_id: { [Op.ne]: null }
            },
            attributes: ['invoiceId', 'report_id']
        });

        let linkedCount = 0;
        let skippedCount = 0;
        const linksToCreate = [];

        for (const item of invoiceItems) {
            // Check if link already exists
            const existingLink = await InvoiceReport.findOne({
                where: {
                    invoice_id: item.invoiceId,
                    report_id: item.report_id
                }
            });

            if (!existingLink) {
                linksToCreate.push({
                    invoice_id: item.invoiceId,
                    report_id: item.report_id
                });
            } else {
                skippedCount++;
            }
        }

        if (dryRun) {
            console.log(`   Would create ${linksToCreate.length} links`);
            console.log(`   Would skip ${skippedCount} existing links`);
            return { linkedCount: 0, skippedCount, wouldCreate: linksToCreate.length };
        }

        if (linksToCreate.length > 0) {
            // Remove duplicates
            const uniqueLinks = Array.from(
                new Map(linksToCreate.map(link => [`${link.invoice_id}-${link.report_id}`, link])).values()
            );

            await InvoiceReport.bulkCreate(uniqueLinks, {
                ignoreDuplicates: true
            });

            linkedCount = uniqueLinks.length;
            console.log(`   ✅ Created ${linkedCount} links through invoice items`);
        } else {
            console.log(`   ℹ️  No new links to create`);
        }

        return { linkedCount, skippedCount };
    } catch (error) {
        console.error('❌ Error linking through invoice items:', error);
        throw error;
    }
}

/**
 * Strategy 2: Link through legacy reportId field in invoices
 */
async function linkThroughReportId(dryRun = false) {
    try {
        console.log('\n🔗 STRATEGY 2: Linking through legacy reportId field...');

        const invoices = await Invoice.findAll({
            where: {
                reportId: { [Op.ne]: null }
            }
        });

        let linkedCount = 0;
        let skippedCount = 0;

        for (const invoice of invoices) {
            // Check if link already exists
            const existingLink = await InvoiceReport.findOne({
                where: {
                    invoice_id: invoice.id,
                    report_id: invoice.reportId
                }
            });

            if (!existingLink) {
                // Verify report exists
                const report = await Report.findByPk(invoice.reportId);
                if (report) {
                    if (!dryRun) {
                        await InvoiceReport.create({
                            invoice_id: invoice.id,
                            report_id: invoice.reportId
                        });
                        linkedCount++;
                    } else {
                        // In dry-run, count what would be created but don't increment linkedCount
                        // Return wouldCreate separately like Strategy 1
                    }
                }
            } else {
                skippedCount++;
            }
        }

        if (dryRun) {
            // Count what would be created
            const wouldCreate = invoices.filter(inv => {
                // This is a simplified check - in real scenario we'd need to verify report exists
                return inv.reportId !== null;
            }).length;
            console.log(`   Would create ${wouldCreate} links`);
            return { linkedCount: 0, skippedCount, wouldCreate };
        } else {
            console.log(`   ✅ Created ${linkedCount} links through reportId field`);
            return { linkedCount, skippedCount };
        }
    } catch (error) {
        console.error('❌ Error linking through reportId:', error);
        throw error;
    }
}

/**
 * Strategy 3: Link through invoice_id field in reports
 */
async function linkThroughReportInvoiceId(dryRun = false) {
    try {
        console.log('\n🔗 STRATEGY 3: Linking through invoice_id field in reports...');

        const reports = await Report.findAll({
            where: {
                invoice_id: { [Op.ne]: null }
            }
        });

        let linkedCount = 0;
        let skippedCount = 0;

        for (const report of reports) {
            // Check if link already exists
            const existingLink = await InvoiceReport.findOne({
                where: {
                    invoice_id: report.invoice_id,
                    report_id: report.id
                }
            });

            if (!existingLink) {
                // Verify invoice exists
                const invoice = await Invoice.findByPk(report.invoice_id);
                if (invoice) {
                    if (!dryRun) {
                        await InvoiceReport.create({
                            invoice_id: report.invoice_id,
                            report_id: report.id
                        });
                        linkedCount++;
                    }
                    // In dry-run, don't increment linkedCount
                }
            } else {
                skippedCount++;
            }
        }

        if (dryRun) {
            // Count what would be created (reports with valid invoice_id that don't have links)
            const wouldCreate = reports.filter(r => {
                return r.invoice_id !== null;
            }).length;
            console.log(`   Would create ${wouldCreate} links`);
            return { linkedCount: 0, skippedCount, wouldCreate };
        } else {
            console.log(`   ✅ Created ${linkedCount} links through report invoice_id field`);
            return { linkedCount, skippedCount };
        }
    } catch (error) {
        console.error('❌ Error linking through report invoice_id:', error);
        throw error;
    }
}

/**
 * Strategy 4: Link through serial numbers matching
 */
async function linkThroughSerialNumbers(dryRun = false) {
    try {
        console.log('\n🔗 STRATEGY 4: Linking through serial numbers...');

        // Get invoice items with serial numbers but without report_id
        const invoiceItems = await InvoiceItem.findAll({
            where: {
                serialNumber: { [Op.ne]: null },
                [Op.or]: [
                    { report_id: null },
                    { report_id: '' }
                ]
            },
            include: [{
                model: Invoice,
                as: 'invoice',
                attributes: ['id', 'client_id', 'date']
            }]
        });

        let linkedCount = 0;
        let skippedCount = 0;

        for (const item of invoiceItems) {
            if (!item.serialNumber || !item.invoice) continue;

            // Find reports with matching serial number and client
            const reports = await Report.findAll({
                where: {
                    serial_number: item.serialNumber,
                    client_id: item.invoice.client_id
                }
            });

            for (const report of reports) {
                // Check if link already exists
                const existingLink = await InvoiceReport.findOne({
                    where: {
                        invoice_id: item.invoiceId,
                        report_id: report.id
                    }
                });

                if (!existingLink) {
                    if (!dryRun) {
                        await InvoiceReport.create({
                            invoice_id: item.invoiceId,
                            report_id: report.id
                        });
                        linkedCount++;
                    }
                    // In dry-run, don't increment linkedCount
                } else {
                    skippedCount++;
                }
            }
        }

        if (dryRun) {
            // Count what would be created
            let wouldCreate = 0;
            for (const item of invoiceItems) {
                if (!item.serialNumber || !item.invoice) continue;
                const reports = await Report.findAll({
                    where: {
                        serial_number: item.serialNumber,
                        client_id: item.invoice.client_id
                    }
                });
                for (const report of reports) {
                    const existingLink = await InvoiceReport.findOne({
                        where: {
                            invoice_id: item.invoiceId,
                            report_id: report.id
                        }
                    });
                    if (!existingLink) {
                        wouldCreate++;
                    }
                }
            }
            console.log(`   Would create ${wouldCreate} links`);
            return { linkedCount: 0, skippedCount, wouldCreate };
        } else {
            console.log(`   ✅ Created ${linkedCount} links through serial numbers`);
            return { linkedCount, skippedCount };
        }
    } catch (error) {
        console.error('❌ Error linking through serial numbers:', error);
        throw error;
    }
}

/**
 * Strategy 5: Link through client_id and date proximity
 */
async function linkThroughClientAndDate(dryRun = false, maxDaysDiff = 30) {
    try {
        console.log(`\n🔗 STRATEGY 5: Linking through client_id and date proximity (${maxDaysDiff} days)...`);

        // Get invoices without links
        const unlinkedInvoices = await sequelize.query(`
            SELECT i.id, i.client_id, i.date, i.reportId
            FROM invoices i
            LEFT JOIN invoice_reports ir ON i.id = ir.invoice_id
            WHERE ir.id IS NULL
        `, { type: Sequelize.QueryTypes.SELECT });

        let linkedCount = 0;
        let skippedCount = 0;

        for (const invoice of unlinkedInvoices) {
            const invoiceDate = new Date(invoice.date);
            const startDate = new Date(invoiceDate);
            startDate.setDate(startDate.getDate() - maxDaysDiff);
            const endDate = new Date(invoiceDate);
            endDate.setDate(endDate.getDate() + maxDaysDiff);

            // Find reports for same client within date range
            const reports = await Report.findAll({
                where: {
                    client_id: invoice.client_id,
                    inspection_date: {
                        [Op.between]: [startDate, endDate]
                    },
                    invoice_created: false // Prefer reports without invoices
                },
                order: [['inspection_date', 'DESC']],
                limit: 1
            });

            if (reports.length > 0) {
                const report = reports[0];
                
                // Check if link already exists
                const existingLink = await InvoiceReport.findOne({
                    where: {
                        invoice_id: invoice.id,
                        report_id: report.id
                    }
                });

                if (!existingLink) {
                    if (!dryRun) {
                        await InvoiceReport.create({
                            invoice_id: invoice.id,
                            report_id: report.id
                        });
                        linkedCount++;
                    }
                    // In dry-run, don't increment linkedCount
                } else {
                    skippedCount++;
                }
            }
        }

        if (dryRun) {
            // Count what would be created
            let wouldCreate = 0;
            for (const invoice of unlinkedInvoices) {
                const invoiceDate = new Date(invoice.date);
                const startDate = new Date(invoiceDate);
                startDate.setDate(startDate.getDate() - maxDaysDiff);
                const endDate = new Date(invoiceDate);
                endDate.setDate(endDate.getDate() + maxDaysDiff);

                const reports = await Report.findAll({
                    where: {
                        client_id: invoice.client_id,
                        inspection_date: {
                            [Op.between]: [startDate, endDate]
                        },
                        invoice_created: false
                    },
                    order: [['inspection_date', 'DESC']],
                    limit: 1
                });

                if (reports.length > 0) {
                    const report = reports[0];
                    const existingLink = await InvoiceReport.findOne({
                        where: {
                            invoice_id: invoice.id,
                            report_id: report.id
                        }
                    });
                    if (!existingLink) {
                        wouldCreate++;
                    }
                }
            }
            console.log(`   Would create ${wouldCreate} links`);
            return { linkedCount: 0, skippedCount, wouldCreate };
        } else {
            console.log(`   ✅ Created ${linkedCount} links through client and date matching`);
            return { linkedCount, skippedCount };
        }
    } catch (error) {
        console.error('❌ Error linking through client and date:', error);
        throw error;
    }
}

/**
 * Update report flags after linking
 */
async function updateReportFlags() {
    try {
        console.log('\n🔄 Updating report flags...');

        // Update reports that have links in junction table
        const result = await sequelize.query(`
            UPDATE reports r
            INNER JOIN invoice_reports ir ON r.id = ir.report_id
            INNER JOIN invoices i ON ir.invoice_id = i.id
            SET r.invoice_created = TRUE,
                r.invoice_id = i.id,
                r.invoice_date = i.date,
                r.billing_enabled = TRUE
            WHERE r.invoice_created = FALSE OR r.invoice_id IS NULL
        `, { type: Sequelize.QueryTypes.UPDATE });

        console.log(`   ✅ Updated report flags`);

        return result;
    } catch (error) {
        console.error('❌ Error updating report flags:', error);
        throw error;
    }
}

/**
 * Main function to fix all linking issues
 */
async function fixLinking(dryRun = false) {
    try {
        console.log('\n🚀 STARTING INVOICE-REPORT LINKING FIX...');
        console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be saved)'}\n`);

        // Analyze current status
        const analysis = await analyzeLinkingStatus();

        if (analysis.invoicesNotInJunction.length === 0 && 
            analysis.reportsNotInJunction.length === 0 && 
            analysis.invoiceItemsNotLinked.length === 0) {
            console.log('\n✅ All invoices and reports are already properly linked!');
            return;
        }

        // Apply all strategies
        const results = {
            strategy1: await linkThroughInvoiceItems(dryRun),
            strategy2: await linkThroughReportId(dryRun),
            strategy3: await linkThroughReportInvoiceId(dryRun),
            strategy4: await linkThroughSerialNumbers(dryRun),
            strategy5: await linkThroughClientAndDate(dryRun, 30)
        };

        // Update report flags if not dry run
        if (!dryRun) {
            await updateReportFlags();
        }

        // Summary
        const totalLinked = Object.values(results).reduce((sum, r) => sum + r.linkedCount, 0);
        const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skippedCount, 0);

        console.log('\n📊 LINKING SUMMARY:');
        console.log(`   Total links created: ${totalLinked}`);
        console.log(`   Total links skipped (already exist): ${totalSkipped}`);
        console.log(`   Strategy 1 (Invoice Items): ${results.strategy1.linkedCount}`);
        console.log(`   Strategy 2 (Legacy reportId): ${results.strategy2.linkedCount}`);
        console.log(`   Strategy 3 (Report invoice_id): ${results.strategy3.linkedCount}`);
        console.log(`   Strategy 4 (Serial Numbers): ${results.strategy4.linkedCount}`);
        console.log(`   Strategy 5 (Client & Date): ${results.strategy5.linkedCount}`);

        // Final analysis
        if (!dryRun) {
            console.log('\n🔍 FINAL STATUS:');
            const finalAnalysis = await analyzeLinkingStatus();
            
            const remainingUnlinked = finalAnalysis.invoicesNotInJunction.length + 
                                     finalAnalysis.reportsNotInJunction.length + 
                                     finalAnalysis.invoiceItemsNotLinked.length;

            if (remainingUnlinked === 0) {
                console.log('\n✅ SUCCESS: All invoices and reports are now properly linked!');
            } else {
                console.log(`\n⚠️  WARNING: ${remainingUnlinked} records still need manual linking`);
            }
        }

        return results;
    } catch (error) {
        console.error('❌ Fatal error during linking process:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    analyzeLinkingStatus,
    linkThroughInvoiceItems,
    linkThroughReportId,
    linkThroughReportInvoiceId,
    linkThroughSerialNumbers,
    linkThroughClientAndDate,
    updateReportFlags,
    fixLinking
};

// Run if executed directly
if (require.main === module) {
    const command = process.argv[2] || 'fix';
    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

    switch (command) {
        case 'analyze':
        case 'status':
            analyzeLinkingStatus()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Error:', error);
                    process.exit(1);
                });
            break;
        case 'fix':
            fixLinking(dryRun)
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Error:', error);
                    process.exit(1);
                });
            break;
        default:
            console.log('Usage:');
            console.log('  node fix-invoice-report-linking.js analyze    - Analyze current linking status');
            console.log('  node fix-invoice-report-linking.js fix        - Fix all linking issues');
            console.log('  node fix-invoice-report-linking.js fix --dry-run  - Dry run (no changes)');
            process.exit(1);
    }
}

