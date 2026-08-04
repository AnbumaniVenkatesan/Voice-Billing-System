-- ============================================================
-- Product-wise Included GST
--
-- 1. Add gst_percentage to invoice_item so historical invoices
--    keep the GST slab that applied at billing time.
-- 2. Backfill existing rows with the product's CURRENT GST
--    (best available value for legacy invoices).
-- ============================================================

ALTER TABLE invoice_item
    ADD COLUMN gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER total;

UPDATE invoice_item ii
    JOIN product p ON p.product_id = ii.product_id
SET ii.gst_percentage = COALESCE(p.gst_percentage, 0.00)
WHERE ii.gst_percentage = 0.00;
