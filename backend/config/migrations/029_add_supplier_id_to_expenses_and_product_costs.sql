-- Migration to add supplier_id columns to the expenses and product_costs tables
-- (Duplicate column errors are caught and ignored by the dbInit.js script)

ALTER TABLE product_costs ADD COLUMN supplier_id INT NULL AFTER cost_price;
ALTER TABLE product_costs ADD CONSTRAINT fk_product_cost_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD COLUMN supplier_id INT NULL AFTER money_location_id;
ALTER TABLE expenses ADD CONSTRAINT fk_expense_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
