-- Migration 001: Create test_records table
CREATE TABLE IF NOT EXISTS `test_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `details` TEXT,
    `status` VARCHAR(50) DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `test_records` (`id`, `title`, `details`, `status`) 
VALUES (1, 'Initial Test Node', 'Sample record created upon first deployment verification.', 'Active');
