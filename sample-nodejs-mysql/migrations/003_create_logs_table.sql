-- Migration 003: Create system_logs table
CREATE TABLE IF NOT EXISTS `system_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `level` VARCHAR(20) NOT NULL DEFAULT 'INFO',
    `message` TEXT NOT NULL,
    `source` VARCHAR(100) DEFAULT 'deployment_runner',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `system_logs` (`id`, `level`, `message`, `source`) 
VALUES 
(1, 'INFO', 'Database migration system initialized successfully.', 'migrator'),
(2, 'SUCCESS', 'MySQL container healthcheck passed.', 'system_monitor');
