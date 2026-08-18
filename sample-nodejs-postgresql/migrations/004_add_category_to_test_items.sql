-- Migration 004: Add category column to test_items if missing
ALTER TABLE test_items ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
