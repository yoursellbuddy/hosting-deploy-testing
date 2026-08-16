-- Migration 004: Add category column to test_records safely across all MySQL versions
SET @dbname = DATABASE();
SET @tablename = 'test_records';
SET @columnname = 'category';

SELECT count(*) INTO @exists
FROM information_schema.columns
WHERE table_schema = @dbname
  AND table_name = @tablename
  AND column_name = @columnname;

SET @query = IF(@exists = 0,
    'ALTER TABLE `test_records` ADD COLUMN `category` VARCHAR(100) DEFAULT "General"',
    'SELECT "Column category already exists" AS msg'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
