-- ============================================================
-- Smart Billing System - Multi-Company Migration
-- Adds company_id isolation to all business tables.
-- Run ONCE:  mysql -u root -proot123 smart_billing < migration_multi_company.sql
-- ============================================================

USE smart_billing;

-- ------------------------------------------------------------
-- 1. COMPANY table - add invoice header/footer
-- ------------------------------------------------------------
ALTER TABLE company ADD COLUMN invoice_header TEXT NULL AFTER receipt_message;
ALTER TABLE company ADD COLUMN invoice_footer TEXT NULL AFTER invoice_header;

-- ------------------------------------------------------------
-- 2. USERS - each user belongs to a company (NULL = SUPER_ADMIN)
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN company_id BIGINT NULL AFTER role;
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE SET NULL;
CREATE INDEX idx_users_company ON users(company_id);

-- ------------------------------------------------------------
-- 3. PRODUCT
-- ------------------------------------------------------------
ALTER TABLE product ADD COLUMN company_id BIGINT NULL AFTER status;
ALTER TABLE product ADD CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_product_company ON product(company_id);

-- ------------------------------------------------------------
-- 4. PRODUCT ALIAS (voice aliases are company-specific)
-- ------------------------------------------------------------
ALTER TABLE product_alias ADD COLUMN company_id BIGINT NULL AFTER language;
ALTER TABLE product_alias ADD CONSTRAINT fk_alias_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_alias_company ON product_alias(company_id);

-- ------------------------------------------------------------
-- 5. CUSTOMER
-- ------------------------------------------------------------
ALTER TABLE customer ADD COLUMN company_id BIGINT NULL AFTER address;
ALTER TABLE customer ADD CONSTRAINT fk_customer_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_customer_company ON customer(company_id);

-- ------------------------------------------------------------
-- 6. INVOICE  (invoice_number unique becomes per-company)
-- ------------------------------------------------------------
ALTER TABLE invoice DROP INDEX invoice_number;
ALTER TABLE invoice ADD COLUMN company_id BIGINT NULL AFTER payment_status;
ALTER TABLE invoice ADD CONSTRAINT fk_invoice_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE UNIQUE INDEX uk_invoice_company_number ON invoice(company_id, invoice_number);
CREATE INDEX idx_invoice_company ON invoice(company_id);

-- ------------------------------------------------------------
-- 7. INVOICE ITEM
-- ------------------------------------------------------------
ALTER TABLE invoice_item ADD COLUMN company_id BIGINT NULL AFTER total;
ALTER TABLE invoice_item ADD CONSTRAINT fk_item_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_item_company ON invoice_item(company_id);

-- ------------------------------------------------------------
-- 8. PAYMENT
-- ------------------------------------------------------------
ALTER TABLE payment ADD COLUMN company_id BIGINT NULL AFTER status;
ALTER TABLE payment ADD CONSTRAINT fk_payment_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_payment_company ON payment(company_id);

-- ------------------------------------------------------------
-- 9. PAYMENT TRANSACTION
-- ------------------------------------------------------------
ALTER TABLE payment_transaction ADD COLUMN company_id BIGINT NULL AFTER status;
ALTER TABLE payment_transaction ADD CONSTRAINT fk_transaction_company FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE;
CREATE INDEX idx_transaction_company ON payment_transaction(company_id);

-- ------------------------------------------------------------
-- 10. BACKFILL - assign all existing rows to the existing company
-- ------------------------------------------------------------
SET @cid := (SELECT company_id FROM company WHERE is_active = 1 ORDER BY company_id LIMIT 1);

UPDATE users SET company_id = @cid WHERE company_id IS NULL;
UPDATE product SET company_id = @cid WHERE company_id IS NULL;
UPDATE product_alias SET company_id = @cid WHERE company_id IS NULL;
UPDATE customer SET company_id = @cid WHERE company_id IS NULL;
UPDATE invoice SET company_id = @cid WHERE company_id IS NULL;
UPDATE invoice_item SET company_id = @cid WHERE company_id IS NULL;
UPDATE payment SET company_id = @cid WHERE company_id IS NULL;
UPDATE payment_transaction SET company_id = @cid WHERE company_id IS NULL;

-- ------------------------------------------------------------
-- 11. NOTE
-- Existing invoice numbers keep their current sequence values per company.
-- New invoice numbers generated per company start from their own max.
-- ------------------------------------------------------------
