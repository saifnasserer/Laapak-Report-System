# Invoice-Report Linking Fix Scripts

This directory contains scripts to analyze and fix the relationship between invoices and reports in the database.

## Understanding the Relationship

The system uses a **many-to-many** relationship between invoices and reports through the `invoice_reports` junction table. Additionally, there are legacy fields that may need to be synchronized:

- **Junction Table**: `invoice_reports` (primary linking mechanism)
  - `invoice_id` → links to `invoices.id`
  - `report_id` → links to `reports.id`

- **Legacy Fields**:
  - `invoices.reportId` → single report reference (legacy)
  - `reports.invoice_id` → single invoice reference
  - `reports.invoice_created` → boolean flag
  - `invoice_items.report_id` → report reference in invoice items

## Scripts Available

### 1. JavaScript Script (Recommended)
**File**: `fix-invoice-report-linking.js`

This is a comprehensive Node.js script that uses Sequelize ORM to analyze and fix linking issues.

#### Usage:

```bash
# Analyze current linking status
node backend/scripts/database/fix-invoice-report-linking.js analyze

# Fix all linking issues (dry run - no changes)
node backend/scripts/database/fix-invoice-report-linking.js fix --dry-run

# Fix all linking issues (live - makes changes)
node backend/scripts/database/fix-invoice-report-linking.js fix
```

#### Strategies Used:

1. **Strategy 1: Invoice Items** - Links through `invoice_items.report_id` field
2. **Strategy 2: Legacy reportId** - Links through `invoices.reportId` field
3. **Strategy 3: Report invoice_id** - Links through `reports.invoice_id` field
4. **Strategy 4: Serial Numbers** - Matches invoice items and reports by serial number and client
5. **Strategy 5: Client & Date** - Matches invoices and reports by client_id and date proximity (within 30 days)

### 2. SQL Script
**File**: `fix-invoice-report-linking.sql`

Direct SQL script that can be run on the database. Useful if you prefer SQL or need to run it directly.

#### Usage:

```bash
# Using MySQL command line
mysql -u username -p database_name < backend/scripts/database/fix-invoice-report-linking.sql

# Or copy and paste into your MySQL client
```

## Before Running

1. **Backup your database** - Always backup before running any data modification scripts
2. **Test in development first** - Run on a development/staging environment first
3. **Review the analysis** - Run `analyze` command first to understand the current state

## Example Output

```
📊 ANALYZING INVOICE-REPORT LINKING STATUS...

📈 SUMMARY STATISTICS:
   Total Invoices: 150
   Total Reports: 200
   Junction Table Links: 120
   Invoices with reportId (legacy): 80
   Reports with invoice_id: 100
   Reports with invoice_created flag: 95
   Invoice Items with report_id: 110

🔍 UNLINKED RECORDS:
   Invoices not in junction table: 30
   Reports with invoice_id but not in junction: 20
   Invoice items with report_id but not linked: 15

🔗 STRATEGY 1: Linking through invoice items...
   ✅ Created 15 links through invoice items

🔗 STRATEGY 2: Linking through legacy reportId field...
   ✅ Created 10 links through reportId field

🔗 STRATEGY 3: Linking through report invoice_id field...
   ✅ Created 5 links through report invoice_id field

📊 LINKING SUMMARY:
   Total links created: 30
   Total links skipped (already exist): 5
```

## Troubleshooting

### If links are not being created:

1. Check that the invoice and report IDs exist in their respective tables
2. Verify that client_id matches between invoices and reports
3. Check for data inconsistencies (null values, empty strings, etc.)
4. Review the analysis output to see which records are unlinked

### If you get foreign key errors:

- Ensure all invoice_ids and report_ids exist in their parent tables
- Check for orphaned records that need to be cleaned up first

## Related Scripts

- `link-existing-invoices.js` - Older script for basic linking (uses different approach)
- `update-invoice-report-linking.sql` - Migration script for schema updates

## Notes

- The script uses `ON DUPLICATE KEY UPDATE` in SQL to avoid duplicate entries
- The JavaScript script checks for existing links before creating new ones
- Report flags (`invoice_created`, `invoice_id`, `invoice_date`) are updated after linking
- The script is idempotent - safe to run multiple times


