-- Migration 004: Add category column to test_records if missing
ALTER TABLE `test_records` ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT 'General';
