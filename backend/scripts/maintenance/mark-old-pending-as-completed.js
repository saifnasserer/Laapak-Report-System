/**
 * mark-old-pending-as-completed.js
 *
 * Marks all reports with status 'pending' that were created
 * between 2025-10-01 and 2026-02-02 (inclusive) as 'completed'.
 *
 * Usage:  node backend/scripts/maintenance/mark-old-pending-as-completed.js
 *         node backend/scripts/maintenance/mark-old-pending-as-completed.js --dry-run
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// ──────────────────────────────────────
// Config
// ──────────────────────────────────────
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'laapak';
const DB_PASSWORD = process.env.DB_PASSWORD || 'laapaksql';
const DB_NAME = process.env.DB_NAME || 'laapak_report_system';

const DATE_FROM = '2025-2-01';
const DATE_TO = '2026-02-02';

const isDryRun = process.argv.includes('--dry-run');

// ──────────────────────────────────────
// DB Connection
// ──────────────────────────────────────
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
});

// ──────────────────────────────────────
// Main
// ──────────────────────────────────────
async function main() {
    console.log('=======================================================');
    console.log('  Mark Old Pending Reports → Completed');
    console.log('=======================================================');
    console.log(`  Date range : ${DATE_FROM}  →  ${DATE_TO}`);
    console.log(`  Mode       : ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✏️  LIVE (changes will be written)'}`);
    console.log('-------------------------------------------------------\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.\n');

        // ── Preview affected rows ──────────────────────────────────
        const [affected] = await sequelize.query(
            `SELECT id, order_number, inspection_date, created_at, status
             FROM   reports
             WHERE  status = 'pending'
               AND  inspection_date BETWEEN :from AND :to
             ORDER  BY inspection_date ASC`,
            { replacements: { from: DATE_FROM, to: DATE_TO } }
        );

        if (affected.length === 0) {
            console.log('ℹ️  No pending reports found in the given date range. Nothing to do.');
            return;
        }

        console.log(`📋 Found ${affected.length} pending report(s) to update:\n`);
        affected.forEach((r, i) => {
            const date = r.inspection_date
                ? new Date(r.inspection_date).toLocaleDateString('en-GB')
                : 'N/A';
            console.log(`  ${String(i + 1).padStart(3)}. [${r.id}]  ${r.order_number || 'N/A'}  |  ${date}`);
        });

        console.log();

        if (isDryRun) {
            console.log('🔍 Dry-run mode: no changes were made. Remove --dry-run to apply.');
            return;
        }

        // ── Apply update ───────────────────────────────────────────
        const [result] = await sequelize.query(
            `UPDATE reports
             SET    status = 'completed',
                    updated_at = NOW()
             WHERE  status = 'pending'
               AND  inspection_date BETWEEN :from AND :to`,
            { replacements: { from: DATE_FROM, to: DATE_TO } }
        );

        const changedRows = result.affectedRows ?? result;
        console.log(`✅ Successfully marked ${changedRows} report(s) as 'completed'.`);

        // ── Verify ─────────────────────────────────────────────────
        const [remaining] = await sequelize.query(
            `SELECT COUNT(*) AS cnt
             FROM   reports
             WHERE  status = 'pending'
               AND  inspection_date BETWEEN :from AND :to`,
            { replacements: { from: DATE_FROM, to: DATE_TO } }
        );

        console.log(`🔍 Remaining pending reports in range: ${remaining[0].cnt}`);
        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();
