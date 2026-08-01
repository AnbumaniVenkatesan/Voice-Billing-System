-- ============================================================
-- Smart Billing System - Complete Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_billing;
USE smart_billing;

-- ============================================================
-- 1. COMPANY TABLE  (created first - all other tables reference it)
-- ============================================================
CREATE TABLE company (
    company_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100),
    shop_type VARCHAR(100),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    phone_number VARCHAR(20),
    alternate_phone VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(200),
    address_line1 VARCHAR(300),
    address_line2 VARCHAR(300),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    logo VARCHAR(500),
    upi_id VARCHAR(200),
    bank_name VARCHAR(200),
    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(30),
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    currency VARCHAR(10) DEFAULT '₹',
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    bill_footer VARCHAR(500),
    receipt_message VARCHAR(500),
    invoice_header TEXT,
    invoice_footer TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. USERS TABLE
-- ============================================================
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    company_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_company ON users(company_id);

-- ============================================================
-- 3. CUSTOMER TABLE
-- ============================================================
CREATE TABLE customer (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    company_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_customer_phone ON customer(phone);
CREATE INDEX idx_customer_company ON customer(company_id);

-- ============================================================
-- 4. PRODUCT TABLE
-- ============================================================
CREATE TABLE product (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    tamil_name VARCHAR(100),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    company_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_product_company ON product(company_id);

-- ============================================================
-- 5. PRODUCT ALIAS TABLE
-- ============================================================
CREATE TABLE product_alias (
    alias_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    alias_name VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT NULL,
    company_id BIGINT NULL,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_alias_name ON product_alias(alias_name);
CREATE INDEX idx_alias_company ON product_alias(company_id);

-- Add language column if not exists (for existing DBs)
-- ALTER TABLE product_alias ADD COLUMN language VARCHAR(10) DEFAULT NULL AFTER alias_name;

-- ============================================================
-- 6. INVOICE TABLE
-- ============================================================
CREATE TABLE invoice (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    company_id BIGINT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE,
    UNIQUE KEY uk_invoice_company_number (company_id, invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_invoice_number ON invoice(invoice_number);
CREATE INDEX idx_invoice_payment_status ON invoice(payment_status);
CREATE INDEX idx_invoice_company ON invoice(company_id);

-- ============================================================
-- 7. INVOICE ITEM TABLE
-- ============================================================
CREATE TABLE invoice_item (
    invoice_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    company_id BIGINT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_item_company ON invoice_item(company_id);

-- ============================================================
-- 8. PAYMENT TABLE
-- ============================================================
CREATE TABLE payment (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'cash',
    order_id VARCHAR(100),
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    company_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payment_order_id ON payment(order_id);
CREATE INDEX idx_payment_company ON payment(company_id);

-- ============================================================
-- 9. PAYMENT TRANSACTION TABLE
-- ============================================================
CREATE TABLE payment_transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    request TEXT,
    response TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    company_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_transaction_status ON payment_transaction(status);
CREATE INDEX idx_transaction_company ON payment_transaction(company_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- NOTE: Passwords stored as plain text for demo purposes only.
-- In production, always hash passwords with BCrypt or Argon2.
INSERT INTO users (username, password, role, is_active, company_id) VALUES
('admin', 'admin123', 'ADMIN', 1, 1);

-- ------------------------------------------------------------
-- CUSTOMERS (default customers for demo)
-- ------------------------------------------------------------
INSERT INTO customer (customer_name, phone, email, address, company_id) VALUES
('Walk-in Customer', '9999999999', 'walkin@shop.com', 'Shop Address', 1),
('Rajesh Kumar', '9876543210', 'rajesh@gmail.com', '123 Main Street, Chennai', 1),
('Priya Devi', '9876543211', 'priya@gmail.com', '456 Anna Nagar, Chennai', 1),
('Murugan S', '9876543212', 'murugan@gmail.com', '789 T Nagar, Chennai', 1),
('Lakshmi R', '9876543213', 'lakshmi@gmail.com', '321 Velachery, Chennai', 1);

-- ------------------------------------------------------------
-- PRODUCTS (10 common shop items)
-- ------------------------------------------------------------
INSERT INTO product (product_name, tamil_name, price, gst_percentage, stock, status, company_id) VALUES
('Rice',         'Arisi',     85.00,  0.00, 500, 'active', 1),
('Soap',         'Sabuni',    35.00,  18.00, 200, 'active', 1),
('Sugar',        'Sarkarai',  42.00,  5.00, 300, 'active', 1),
('Oil',          'Ennai',     150.00, 5.00, 150, 'active', 1),
('Milk',         'Paal',      52.00,  0.00, 100, 'active', 1),
('Tea',          'Theneer',   60.00,  0.00, 250, 'active', 1),
('Coffee',       'Kopi',      180.00, 0.00, 200, 'active', 1),
('Salt',         'Uppu',      25.00,  0.00, 400, 'active', 1),
('Flour',        'Maavu',     40.00,  0.00, 350, 'active', 1),
('Dhal',         'Paruppu',   120.00, 0.00, 180, 'active', 1);

-- ------------------------------------------------------------
-- PRODUCT ALIASES (Tamil, Tanglish, English variants)
-- ------------------------------------------------------------

-- Rice (product_id = 1)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(1, 'Arisi', 1),
(1, 'Arisi Nel', 1),
(1, 'Raw Rice', 1),
(1, 'Boiled Rice', 1);

-- Soap (product_id = 2)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(2, 'Sabuni', 1),
(2, 'Sabbanam', 1),
(2, 'Body Wash', 1),
(2, 'Cleaning Soap', 1);

-- Sugar (product_id = 3)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(3, 'Sarkarai', 1),
(3, 'Chekkarai', 1),
(3, 'White Sugar', 1),
(3, 'Brown Sugar', 1);

-- Oil (product_id = 4)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(4, 'Ennai', 1),
(4, 'Yennai', 1),
(4, 'Cooking Oil', 1),
(4, 'Sunflower Oil', 1);

-- Milk (product_id = 5)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(5, 'Paal', 1),
(5, 'Thaaipaal', 1),
(5, 'Cow Milk', 1),
(5, 'Full Cream Milk', 1);

-- Tea (product_id = 6)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(6, 'Theneer', 1),
(6, 'Tea Powder', 1),
(6, 'Chai', 1),
(6, 'Green Tea', 1);

-- Coffee (product_id = 7)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(7, 'Kopi', 1),
(7, 'Coffee Powder', 1),
(7, 'Filter Coffee', 1),
(7, 'Instant Coffee', 1);

-- Salt (product_id = 8)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(8, 'Uppu', 1),
(8, 'Kal Uppu', 1),
(8, 'Table Salt', 1),
(8, 'Rock Salt', 1);

-- Flour (product_id = 9)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(9, 'Maavu', 1),
(9, 'Aatta Maavu', 1),
(9, 'Wheat Flour', 1),
(9, 'Maida', 1);

-- Dhal (product_id = 10)
INSERT INTO product_alias (product_id, alias_name, company_id) VALUES
(10, 'Paruppu', 1),
(10, 'Kadalai Paruppu', 1),
(10, 'Toor Dhal', 1),
(10, 'Moong Dhal', 1);

-- ------------------------------------------------------------
-- COMPANY (configured via Company Settings page)
-- Table created above. DataInitializer seeds a minimal default.
-- ------------------------------------------------------------
