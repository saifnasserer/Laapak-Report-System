-- Migration: Update Expense Categories to Match Form
-- This migration updates the expense categories to match the ones used in financial-add-expense.html

-- First, clear existing categories
DELETE FROM expense_categories;

-- Insert the categories that match the form
INSERT INTO expense_categories (id, name, name_ar, description, color) VALUES
(1, 'Office Expenses', 'مصاريف المكتب', 'Office rent, utilities, supplies', '#e74c3c'),
(2, 'Salaries', 'مرتبات', 'Employee salaries and wages', '#3498db'),
(3, 'Personal Expenses', 'مصاريف شخصية', 'Personal work-related expenses', '#9b59b6'),
(4, 'Work Costs', 'تكاليف الشغل', 'Materials and work tools', '#f39c12');

-- Reset auto-increment to start from 5 for any future categories
ALTER TABLE expense_categories AUTO_INCREMENT = 5;
