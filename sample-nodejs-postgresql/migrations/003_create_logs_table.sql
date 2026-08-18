-- Migration 003: Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'deployment_runner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_logs (level, message, source)
VALUES 
    ('INFO', 'PostgreSQL migration system initialized successfully.', 'migrator'),
    ('SUCCESS', 'PostgreSQL container healthcheck passed.', 'system_monitor');
