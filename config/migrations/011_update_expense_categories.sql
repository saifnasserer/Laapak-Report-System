-- Migration: Update Expense Categories
-- This migration updates the expense categories to match the new requirements

-- Update existing categories instead of deleting them
UPDATE expense_categories SET 
    name = 'Office Expenses',
    name_ar = 'مصاريف المكتب',
    description = 'Office-related expenses including rent, utilities, supplies',
    color = '#e74c3c'
WHERE id = 1;

UPDATE expense_categories SET 
    name = 'Salaries',
    name_ar = 'مرتبات',
    description = 'Employee salaries and wages',
    color = '#3498db'
WHERE id = 2;

UPDATE expense_categories SET 
    name = 'Personal Expenses',
    name_ar = 'مصاريف شخصية',
    description = 'Personal business expenses',
    color = '#9b59b6'
WHERE id = 3;

UPDATE expense_categories SET 
    name = 'Work Costs',
    name_ar = 'تكاليف الشغل',
    description = 'Direct work-related costs and materials',
    color = '#f39c12'
WHERE id = 4;

-- Deactivate any additional categories beyond the first 4
UPDATE expense_categories SET is_active = FALSE WHERE id > 4;
