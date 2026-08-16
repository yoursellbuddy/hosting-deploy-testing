require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const { runMigrations, getMigrationStatus } = require('./migrator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Server Start Time for Uptime Calculation
const startTime = Date.now();

// Database Pool Reference
let pool = null;
let dbConnected = false;
let lastDbError = null;

// MySQL Config from Environment
const getDbConfig = () => ({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sample_db',
    connectTimeout: 5000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

// Initialize MySQL Connection & Auto Migration
async function initDatabase() {
    const dbConfig = getDbConfig();
    console.log(`[MySQL] Attempting connection to ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
    
    try {
        // 1. Create root connection without DB specified to ensure DB exists
        const rootConn = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            connectTimeout: 5000
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await rootConn.end();

        // 2. Initialize connection pool
        pool = mysql.createPool(dbConfig);

        // 3. Test pool connection
        const conn = await pool.getConnection();
        conn.release();

        // 4. Execute all pending SQL migration files automatically
        console.log(`[MySQL] Running database migrations from /migrations folder...`);
        const migrationResult = await runMigrations(pool);
        console.log(`[MySQL] Migrations finished. Total files: ${migrationResult.total}`);

        dbConnected = true;
        lastDbError = null;
        console.log(`[MySQL] ✅ Database connected and schema verified successfully!`);
    } catch (err) {
        dbConnected = false;
        lastDbError = err.message;
        console.warn(`[MySQL] ⚠️ Database connection pending or failed: ${err.message}`);
    }
}

// Attempt DB setup on startup
initDatabase();

// --- API ENDPOINTS ---

// Health & System Info Check
app.get('/api/health', async (req, res) => {
    // Re-check DB if previously failed
    if (!dbConnected) {
        await initDatabase();
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    res.json({
        status: 'OK',
        service: 'Node.js & MySQL Hosting Test App',
        uptimeSeconds,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: {
            connected: dbConnected,
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            databaseName: process.env.DB_NAME || 'sample_db',
            error: lastDbError
        }
    });
});

// Database Detailed Benchmark / Status Endpoint
app.get('/api/db-status', async (req, res) => {
    if (!dbConnected) {
        await initDatabase();
    }

    if (!dbConnected) {
        return res.status(503).json({
            connected: false,
            error: lastDbError || 'Database connection unavailable.',
            config: {
                host: process.env.DB_HOST || '127.0.0.1',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                database: process.env.DB_NAME || 'sample_db'
            }
        });
    }

    try {
        const pingStart = Date.now();
        const [pingRes] = await pool.query('SELECT 1 + 1 AS result, VERSION() as version, NOW() as db_time');
        const pingMs = Date.now() - pingStart;

        const [tables] = await pool.query('SHOW TABLES');
        const [recordsCount] = await pool.query('SELECT COUNT(*) as total FROM `test_records`');

        res.json({
            connected: true,
            pingMs,
            mysqlVersion: pingRes[0].version,
            dbTime: pingRes[0].db_time,
            tableCount: tables.length,
            recordsCount: recordsCount[0].total,
            config: {
                host: process.env.DB_HOST || '127.0.0.1',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                database: process.env.DB_NAME || 'sample_db'
            }
        });
    } catch (err) {
        dbConnected = false;
        lastDbError = err.message;
        res.status(500).json({ connected: false, error: err.message });
    }
});

// GET /api/migrations - Migration Status Endpoint
app.get('/api/migrations', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ error: 'Database connection offline.' });
    }

    try {
        const status = await getMigrationStatus(pool);
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/migrations/run - Run Pending Migrations Endpoint
app.post('/api/migrations/run', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ error: 'Database connection offline.' });
    }

    try {
        const result = await runMigrations(pool);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/items - Retrieve all test records
app.get('/api/items', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({
            error: 'Database connection offline. Configure DB parameters or start MySQL service.',
            items: []
        });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM `test_records` ORDER BY id DESC');
        res.json({ success: true, count: rows.length, items: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/items - Add a new record to MySQL
app.post('/api/items', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ error: 'Database connection offline.' });
    }

    const { title, details, status, category } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title field is required.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO `test_records` (title, details, status, category) VALUES (?, ?, ?, ?)',
            [title.trim(), details ? details.trim() : '', status || 'Active', category || 'General']
        );

        const [newRecord] = await pool.query('SELECT * FROM `test_records` WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, item: newRecord[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/items/:id - Delete a record
app.delete('/api/items/:id', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ error: 'Database connection offline.' });
    }

    const itemId = parseInt(req.params.id);
    try {
        const [result] = await pool.query('DELETE FROM `test_records` WHERE id = ?', [itemId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found.' });
        }
        res.json({ success: true, message: `Record #${itemId} deleted successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Express Listener
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🚀 Node.js & MySQL Testing App is Running!`);
    console.log(` 🌐 Local Access: http://localhost:${PORT}`);
    console.log(` 🛠 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
});
