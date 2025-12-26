-- Migration: Update Expense Categories to Match Form
-- This migration updates the expense categories to match the ones used in financial-add-expense.html
-- Instead of deleting, we update existing categories and add missing ones

-- Update existing categories (IDs 1-4) to match the form
UPDATE expense_categories SET 
    name = 'Office Expenses',
    name_ar = 'مصاريف المكتب',
    description = 'Office-related expenses including rent, utilities, supplies',
    color = '#e74c3c',
    is_active = TRUE
WHERE id = 1;

UPDATE expense_categories SET 
    name = 'Salaries',
    name_ar = 'مرتبات',
    description = 'Employee salaries and wages',
    color = '#3498db',
    is_active = TRUE
WHERE id = 2;

UPDATE expense_categories SET 
    name = 'Personal Expenses',
    name_ar = 'مصاريف شخصية',
    description = 'Personal business expenses',
    color = '#9b59b6',
    is_active = TRUE
WHERE id = 3;

UPDATE expense_categories SET 
    name = 'Work Costs',
    name_ar = 'تكاليف الشغل',
    description = 'Direct work-related costs and materials',
    color = '#f39c12',
    is_active = TRUE
WHERE id = 4;

-- Deactivate any categories beyond ID 4 (don't delete due to foreign key constraints)
UPDATE expense_categories SET is_active = FALSE WHERE id > 4;
