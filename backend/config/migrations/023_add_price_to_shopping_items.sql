-- Add price column to shopping_list_items
ALTER TABLE `shopping_list_items`
ADD COLUMN `price` DECIMAL(10, 2) DEFAULT 0.00 AFTER `quantity`;
