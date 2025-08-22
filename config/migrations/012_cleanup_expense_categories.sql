-- Migration: Cleanup Expense Categories
-- This migration removes all unused categories and keeps only the 4 main ones

-- First, update any expenses that reference categories beyond ID 4 to use category 1 (Office Expenses)
UPDATE expenses SET category_id = 1 WHERE category_id > 4;

-- Delete all categories beyond ID 4
DELETE FROM expense_categories WHERE id > 4;

-- Reset auto-increment to 5 (next available ID)
ALTER TABLE expense_categories AUTO_INCREMENT = 5;

-- Verify the final state
SELECT 'Final categories:' as status;
SELECT id, name_ar, is_active FROM expense_categories ORDER BY id;
