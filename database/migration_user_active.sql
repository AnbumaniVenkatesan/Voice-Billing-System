-- ============================================================
-- Smart Billing System - Incremental Migration
-- Adds is_active to users for super admin user management.
-- Run:  mysql -u root -proot123 smart_billing < migration_user_active.sql
-- ============================================================

USE smart_billing;

ALTER TABLE users
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role;
