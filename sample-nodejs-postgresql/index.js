const express = require('express');
const path = require('path');
const cors = require('cors');
const { getPool, testConnection, runMigrations, getMigrationStatus } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let dbStatusInfo = {
  status: 'connecting',
  message: 'Initializing connection...',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  dbname: process.env.DB_NAME || 'sample_node_pg_db'
};

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: dbStatusInfo.status === 'connected' ? 'ok' : 'error',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbStatusInfo.status === 'connected',
      host: dbStatusInfo.host,
      port: dbStatusInfo.port,
      user: process.env.DB_USER || 'postgres',
      database: dbStatusInfo.dbname,
      error: dbStatusInfo.status === 'error' ? dbStatusInfo.message : null
    },
    db: dbStatusInfo
  });
});

// Detailed Database Status Endpoint
app.get('/api/db-status', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({
      connected: false,
      error: dbStatusInfo.message || 'Database connection unavailable.'
    });
  }

  try {
    const pool = getPool();
    const pingStart = Date.now();
    const pingRes = await pool.query('SELECT VERSION() as version, NOW() as db_time');
    const pingMs = Date.now() - pingStart;

    const tablesRes = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
    const countRes = await pool.query('SELECT COUNT(*) as total FROM test_items');

    res.json({
      connected: true,
      pingMs,
      pgVersion: pingRes.rows[0].version,
      serverTime: pingRes.rows[0].db_time,
      tableCount: parseInt(tablesRes.rows[0].count, 10),
      recordsCount: parseInt(countRes.rows[0].total, 10)
    });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// GET /api/migrations - Migration Status
app.get('/api/migrations', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const pool = getPool();
    const status = await getMigrationStatus(pool);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/migrations/run - Trigger Pending Migrations Execution
app.post('/api/migrations/run', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const pool = getPool();
    const result = await runMigrations(pool);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items - Retrieve all test items
app.get('/api/items', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({ error: 'Database not connected', success: false, items: [] });
  }
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM test_items ORDER BY id DESC');
    res.json({ success: true, count: result.rows.length, items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false, items: [] });
  }
});

// POST /api/items - Create item
app.post('/api/items', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({ error: 'Database not connected' });
  }
  const { title, details, status, category } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  try {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO test_items (title, details, status, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), details ? details.trim() : '', status || 'Active', category || 'General']
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id - Delete item
app.delete('/api/items/:id', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const pool = getPool();
    const result = await pool.query('DELETE FROM test_items WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true, message: `Item #${req.params.id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve public/index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Listener
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(` 🚀 Node.js & PostgreSQL Testing App is Running!`);
  console.log(` 🌐 Local Access: http://localhost:${PORT}`);
  console.log(`=======================================================`);
  dbStatusInfo = await testConnection();
});
