-- ============================================================
-- Migration: remove product_id from invoice_item, add product_name
-- This lets products be deleted even if they were used in invoices.
-- Historical invoices keep a snapshot of the product name.
-- ============================================================

-- 1. Add product_name column
ALTER TABLE invoice_item ADD COLUMN product_name VARCHAR(255) NULL AFTER invoice_id;

-- 2. Backfill product_name from product for existing rows
UPDATE invoice_item ii
JOIN product p ON p.product_id = ii.product_id
SET ii.product_name = p.product_name
WHERE ii.product_name IS NULL OR ii.product_name = '';

-- 3. Enforce product_name as required
ALTER TABLE invoice_item MODIFY COLUMN product_name VARCHAR(255) NOT NULL;

-- 4. Drop the foreign key to product and the product_id column
ALTER TABLE invoice_item DROP FOREIGN KEY invoice_item_ibfk_2;
ALTER TABLE invoice_item DROP COLUMN product_id;
