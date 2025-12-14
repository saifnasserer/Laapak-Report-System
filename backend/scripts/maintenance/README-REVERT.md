# Reverting Report Status Changes

This directory contains scripts to diagnose and revert changes made by `mark-reports-with-completed-invoices.js`.

## Problem

The `mark-reports-with-completed-invoices.js` script was designed to automatically mark reports with completed invoices as 'مكتمل' (completed). However, this may have incorrectly marked some reports that should still be in progress.

## Solution

### Step 1: Diagnose What Changed

First, run the diagnostic script to see what was changed:

```bash
cd backend
node scripts/maintenance/diagnose-report-status-changes.js
```

This will show you:
- How many reports were affected
- When they were updated (to identify recently changed ones)
- Which reports might have been incorrectly marked as completed
- Current status distribution in the database

### Step 2: Review the Results

Review the diagnostic output carefully. Look for:
- Reports that were completed on the same day they were created (suspicious)
- Reports that were recently updated (likely changed by the script)
- Any reports that shouldn't be marked as completed

### Step 3: Revert Changes (Dry Run First)

Before making any changes, run the revert script in dry-run mode:

```bash
node scripts/maintenance/revert-report-status-changes.js --dry-run
```

This will show you what would be changed without actually changing anything.

### Step 4: Revert Changes

If the dry-run looks correct, run the revert script:

```bash
node scripts/maintenance/revert-report-status-changes.js
```

By default, this will revert recently updated reports from 'مكتمل' to 'قيد المعالجة' (in-progress).

### Custom Status

If you want to revert to a different status:

```bash
node scripts/maintenance/revert-report-status-changes.js --status="قيد الانتظار"
```

Available statuses:
- `قيد الانتظار` (pending)
- `قيد المعالجة` (in-progress)
- `مكتمل` (completed)
- `ملغى` (cancelled)

## Important Notes

1. **The revert script uses heuristics** - It identifies reports that were likely changed by the original script based on:
   - Status is 'مكتمل'
   - Linked to completed/paid invoices
   - Updated in the last 7 days

2. **Manual Review Required** - After reverting, you should manually review the reports and adjust any that need different statuses.

3. **No Original Status Backup** - The script cannot restore the exact original status because it wasn't saved. It uses business logic to determine what the status should be.

4. **Database Backup Recommended** - Before running the revert script, consider backing up your database.

## Alternative: Manual Revert

If you know specific report IDs that need to be reverted, you can manually update them:

```sql
UPDATE reports 
SET status = 'قيد المعالجة' 
WHERE id IN ('RPT123456789', 'RPT987654321');
```

## Questions?

If you're unsure about reverting, contact the development team or review the diagnostic output more carefully.

