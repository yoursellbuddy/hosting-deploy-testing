-- Migration 002: Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, role)
VALUES 
    ('admin', 'admin@hosting2030.local', 'admin'),
    ('deployer', 'deployer@hosting2030.local', 'developer')
ON CONFLICT (username) DO NOTHING;
