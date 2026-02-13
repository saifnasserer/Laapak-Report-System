-- Migration to add currency column to shopping_lists table
-- [024_add_currency_to_shopping_lists.sql]

ALTER TABLE shopping_lists 
ADD COLUMN currency VARCHAR(10) DEFAULT 'EGP' AFTER name;
