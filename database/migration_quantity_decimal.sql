-- Migration: Change quantity column from INT to DECIMAL to support fractional quantities
-- Supports: 1/2 kg, quarter kg, 0.5, etc.

ALTER TABLE invoice_item
    MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00;
