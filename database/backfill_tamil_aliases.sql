-- Backfill: Add tamil_name as alias for products that don't already have it
-- Safe to run multiple times (INSERT IGNORE prevents duplicates)

INSERT IGNORE INTO product_alias (product_id, alias_name)
SELECT p.product_id, p.tamil_name
FROM product p
WHERE p.tamil_name IS NOT NULL
  AND p.tamil_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM product_alias pa
    WHERE pa.product_id = p.product_id
      AND LOWER(pa.alias_name) = LOWER(p.tamil_name)
  );
