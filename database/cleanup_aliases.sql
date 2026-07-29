-- Cleanup duplicate product aliases
-- Keeps the lowest alias_id for each (product_id, alias_name) pair, deletes the rest

DELETE pa1 FROM product_alias pa1
INNER JOIN product_alias pa2
WHERE pa1.product_id = pa2.product_id
  AND LOWER(pa1.alias_name) = LOWER(pa2.alias_name)
  AND pa1.alias_id > pa2.alias_id;
