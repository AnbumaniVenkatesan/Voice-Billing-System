-- ============================================================
-- Smart Billing System - Complete Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_billing;
USE smart_billing;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. CUSTOMER TABLE
-- ============================================================
CREATE TABLE customer (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_customer_phone ON customer(phone);

-- ============================================================
-- 3. PRODUCT TABLE
-- ============================================================
CREATE TABLE product (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    tamil_name VARCHAR(100),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_product_status ON product(status);

-- ============================================================
-- 4. PRODUCT ALIAS TABLE
-- ============================================================
CREATE TABLE product_alias (
    alias_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    alias_name VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_alias_name ON product_alias(alias_name);

-- Add language column if not exists (for existing DBs)
-- ALTER TABLE product_alias ADD COLUMN language VARCHAR(10) DEFAULT NULL AFTER alias_name;

-- ============================================================
-- 5. INVOICE TABLE
-- ============================================================
CREATE TABLE invoice (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_invoice_number ON invoice(invoice_number);
CREATE INDEX idx_invoice_payment_status ON invoice(payment_status);

-- ============================================================
-- 6. INVOICE ITEM TABLE
-- ============================================================
CREATE TABLE invoice_item (
    invoice_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. PAYMENT TABLE
-- ============================================================
CREATE TABLE payment (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'cash',
    order_id VARCHAR(100),
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payment_order_id ON payment(order_id);

-- ============================================================
-- 8. PAYMENT TRANSACTION TABLE
-- ============================================================
CREATE TABLE payment_transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    request TEXT,
    response TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_transaction_status ON payment_transaction(status);

-- ============================================================
-- 9. COMPANY TABLE
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
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA
-- ============================================================

-- NOTE: Passwords stored as plain text for demo purposes only.
-- In production, always hash passwords with BCrypt or Argon2.
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin');

-- ------------------------------------------------------------
-- CUSTOMERS (default customers for demo)
-- ------------------------------------------------------------
INSERT INTO customer (customer_name, phone, email, address) VALUES
('Walk-in Customer', '9999999999', 'walkin@shop.com', 'Shop Address'),
('Rajesh Kumar', '9876543210', 'rajesh@gmail.com', '123 Main Street, Chennai'),
('Priya Devi', '9876543211', 'priya@gmail.com', '456 Anna Nagar, Chennai'),
('Murugan S', '9876543212', 'murugan@gmail.com', '789 T Nagar, Chennai'),
('Lakshmi R', '9876543213', 'lakshmi@gmail.com', '321 Velachery, Chennai');

-- ------------------------------------------------------------
-- PRODUCTS (10 common shop items)
-- ------------------------------------------------------------
INSERT INTO product (product_name, tamil_name, price, gst_percentage, stock, status) VALUES
('Rice',         'Arisi',     85.00,  0.00, 500, 'active'),
('Soap',         'Sabuni',    35.00,  18.00, 200, 'active'),
('Sugar',        'Sarkarai',  42.00,  5.00, 300, 'active'),
('Oil',          'Ennai',     150.00, 5.00, 150, 'active'),
('Milk',         'Paal',      52.00,  0.00, 100, 'active'),
('Tea',          'Theneer',   60.00,  0.00, 250, 'active'),
('Coffee',       'Kopi',      180.00, 0.00, 200, 'active'),
('Salt',         'Uppu',      25.00,  0.00, 400, 'active'),
('Flour',        'Maavu',     40.00,  0.00, 350, 'active'),
('Dhal',         'Paruppu',   120.00, 0.00, 180, 'active');

-- ------------------------------------------------------------
-- PRODUCT ALIASES (Tamil, Tanglish, English variants)
-- ------------------------------------------------------------

-- Rice (product_id = 1)
INSERT INTO product_alias (product_id, alias_name) VALUES
(1, 'Arisi'),
(1, 'Arisi Nel'),
(1, 'Raw Rice'),
(1, 'Boiled Rice');

-- Soap (product_id = 2)
INSERT INTO product_alias (product_id, alias_name) VALUES
(2, 'Sabuni'),
(2, 'Sabbanam'),
(2, 'Body Wash'),
(2, 'Cleaning Soap');

-- Sugar (product_id = 3)
INSERT INTO product_alias (product_id, alias_name) VALUES
(3, 'Sarkarai'),
(3, 'Chekkarai'),
(3, 'White Sugar'),
(3, 'Brown Sugar');

-- Oil (product_id = 4)
INSERT INTO product_alias (product_id, alias_name) VALUES
(4, 'Ennai'),
(4, 'Yennai'),
(4, 'Cooking Oil'),
(4, 'Sunflower Oil');

-- Milk (product_id = 5)
INSERT INTO product_alias (product_id, alias_name) VALUES
(5, 'Paal'),
(5, 'Thaaipaal'),
(5, 'Cow Milk'),
(5, 'Full Cream Milk');

-- Tea (product_id = 6)
INSERT INTO product_alias (product_id, alias_name) VALUES
(6, 'Theneer'),
(6, 'Tea Powder'),
(6, 'Chai'),
(6, 'Green Tea');

-- Coffee (product_id = 7)
INSERT INTO product_alias (product_id, alias_name) VALUES
(7, 'Kopi'),
(7, 'Coffee Powder'),
(7, 'Filter Coffee'),
(7, 'Instant Coffee');

-- Salt (product_id = 8)
INSERT INTO product_alias (product_id, alias_name) VALUES
(8, 'Uppu'),
(8, 'Kal Uppu'),
(8, 'Table Salt'),
(8, 'Rock Salt');

-- Flour (product_id = 9)
INSERT INTO product_alias (product_id, alias_name) VALUES
(9, 'Maavu'),
(9, 'Aatta Maavu'),
(9, 'Wheat Flour'),
(9, 'Maida');

-- Dhal (product_id = 10)
INSERT INTO product_alias (product_id, alias_name) VALUES
(10, 'Paruppu'),
(10, 'Kadalai Paruppu'),
(10, 'Toor Dhal'),
(10, 'Moong Dhal');

-- ------------------------------------------------------------
-- COMPANY (configured via Company Settings page)
-- Table created above. DataInitializer seeds a minimal default.
-- ------------------------------------------------------------
