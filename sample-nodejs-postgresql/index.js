const express = require('express');
const { getPool, testConnection } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let dbStatusInfo = {
  status: 'connecting',
  message: 'Initializing connection...',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dbname: process.env.DB_NAME || 'sample_node_pg_db'
};

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node.js + PostgreSQL Testing Deployment</title>
    <style>
        :root { --bg: #09090b; --card: #18181b; --border: #27272a; --text: #f4f4f5; --muted: #a1a1aa; --accent: #3b82f6; --success: #10b981; --danger: #ef4444; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
        .container { max-width: 650px; width: 100%; display: flex; flex-direction: column; gap: 20px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        h1 { margin: 0 0 8px 0; font-size: 1.5rem; color: #fff; display: flex; align-items: center; gap: 10px; }
        p { margin: 0; font-size: 0.9rem; color: var(--muted); line-height: 1.5; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .connected { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
        .error { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
        form { display: flex; gap: 10px; margin-top: 15px; }
        input[type="text"] { flex: 1; background: #09090b; border: 1px solid var(--border); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; outline: none; }
        button { background: var(--accent); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .item-list { list-style: none; padding: 0; margin: 15px 0 0 0; display: flex; flex-direction: column; gap: 8px; }
        .item-row { display: flex; justify-content: space-between; align-items: center; background: #09090b; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); }
        .delete-btn { background: rgba(239,68,68,0.2); color: var(--danger); border: 1px solid var(--danger); padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🟢 Node.js + PostgreSQL Deployment</h1>
            <p>Automated deployment verification app for Node.js & PostgreSQL database stack.</p>
            
            <div style="margin-top: 15px;">
                <span id="statusBadge" class="status-badge connected">Connecting...</span>
            </div>

            <p style="margin-top: 12px; font-family: monospace; font-size: 0.8rem;">
                Host: <span id="dbHost"></span>:<span id="dbPort"></span><br>
                Database: <span id="dbName"></span><br>
                Status Msg: <span id="dbMsg"></span>
            </p>
        </div>

        <div class="card" id="crudCard">
            <h3 style="margin: 0; font-size: 1.1rem;">🧪 Live Database CRUD Test</h3>
            <form id="addForm">
                <input type="text" id="itemTitle" placeholder="Enter test item name..." required>
                <button type="submit">Add Item</button>
            </form>

            <ul class="item-list" id="itemList">
                <li style="color: var(--muted); font-size: 0.85rem; text-align: center; padding: 10px;">Loading items...</li>
            </ul>
        </div>
    </div>

    <script>
        async function loadStatus() {
            const res = await fetch('/api/health');
            const data = await res.json();
            const badge = document.getElementById('statusBadge');
            if (data.status === 'ok') {
                badge.className = 'status-badge connected';
                badge.textContent = '🟢 Connected to PostgreSQL';
            } else {
                badge.className = 'status-badge error';
                badge.textContent = '🔴 PostgreSQL Error';
            }
            document.getElementById('dbHost').textContent = data.db.host;
            document.getElementById('dbPort').textContent = data.db.port;
            document.getElementById('dbName').textContent = data.db.dbname;
            document.getElementById('dbMsg').textContent = data.db.message;
        }

        async function loadItems() {
            const res = await fetch('/api/items');
            const items = await res.json();
            const list = document.getElementById('itemList');
            if (!items || items.length === 0) {
                list.innerHTML = '<li style="color: var(--muted); font-size: 0.85rem; text-align: center; padding: 10px;">No test items found. Add one above!</li>';
                return;
            }
            list.innerHTML = items.map(item => \`
                <li class="item-row">
                    <span>\${item.title} <small style="color: var(--muted); margin-left: 8px;">\${new Date(item.created_at).toLocaleString()}</small></span>
                    <button class="delete-btn" onclick="deleteItem(\${item.id})">Delete</button>
                </li>
            \`).join('');
        }

        document.getElementById('addForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('itemTitle');
            const title = titleInput.value.trim();
            if (!title) return;
            await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            titleInput.value = '';
            loadItems();
        });

        async function deleteItem(id) {
            await fetch('/api/items/' + id, { method: 'DELETE' });
            loadItems();
        }

        loadStatus();
        loadItems();
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(HTML_TEMPLATE);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: dbStatusInfo.status === 'connected' ? 'ok' : 'error',
    db: dbStatusInfo
  });
});

app.get('/api/items', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM test_items ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(500).json({ error: 'Database not connected' });
  }
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const pool = getPool();
    const result = await pool.query('INSERT INTO test_items (title) VALUES ($1) RETURNING *', [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  if (dbStatusInfo.status !== 'connected') {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const pool = getPool();
    await pool.query('DELETE FROM test_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Server] Node.js server listening on http://0.0.0.0:${PORT}`);
  dbStatusInfo = await testConnection();
});
