-- Migration 001: Create test_items table
CREATE TABLE IF NOT EXISTS test_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    details TEXT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_items (title, details, status)
SELECT 'Initial PG Node', 'Sample record created upon first deployment verification.', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM test_items WHERE id = 1);
