/* ==========================================================================
   Node.js & MySQL Testing App - Frontend Client Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    recheckHealth();
    loadItems();
    loadMigrations();
    initForm();

    // Periodic health refresh every 10 seconds
    setInterval(recheckHealth, 10000);
});

// 1. Theme Toggle Management
function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn.querySelector('.theme-icon');

    const savedTheme = localStorage.getItem('nodemysql_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('nodemysql_theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';

        appendLog(`[THEME] UI theme switched to ${newTheme.toUpperCase()}`, 'info');
    });
}

// 2. Health & Status Verification Call
async function recheckHealth() {
    try {
        const res = await fetch('/api/health');
        const data = await res.json();

        // Node.js status
        document.getElementById('lblNodeVersion').textContent = data.nodeVersion || 'v--';
        document.getElementById('lblNodeEnv').textContent = `Environment: ${data.environment}`;
        document.getElementById('lblUptime').textContent = formatUptime(data.uptimeSeconds);
        document.getElementById('lblServerTime').textContent = new Date(data.timestamp).toLocaleTimeString();

        // MySQL status update
        const dbStatusBadge = document.getElementById('dbStatusBadge');
        const lblDbState = document.getElementById('lblDbState');
        const dbErrorBanner = document.getElementById('dbErrorBanner');

        const dbHostText = `${data.database.user}@${data.database.host}:${data.database.port}/${data.database.databaseName}`;
        document.getElementById('lblDbHostInfo').textContent = dbHostText;

        if (data.database.connected) {
            dbStatusBadge.className = 'status-badge live';
            dbStatusBadge.innerHTML = '<span class="pulse-dot green"></span> MySQL: Connected';
            lblDbState.textContent = 'Connected & Active';
            lblDbState.className = 'text-success';
            dbErrorBanner.classList.add('hidden');

            runDbBenchmark(); // Fetch ping and table stats
            loadMigrations();
        } else {
            dbStatusBadge.className = 'status-badge error';
            dbStatusBadge.innerHTML = '<span class="pulse-dot red"></span> MySQL: Offline';
            lblDbState.textContent = 'Disconnected';
            lblDbState.className = 'text-error';
            
            document.getElementById('dbErrorMsg').textContent = data.database.error || 'Connection failed.';
            dbErrorBanner.classList.remove('hidden');

            appendLog(`[MySQL ERROR] ${data.database.error || 'Database unreachable'}`, 'error');
        }

    } catch (err) {
        appendLog(`[HTTP ERROR] Failed to connect to Node.js backend: ${err.message}`, 'error');
    }
}

// 3. MySQL Benchmark & Query Latency Check
async function runDbBenchmark() {
    try {
        const res = await fetch('/api/db-status');
        const data = await res.json();

        if (data.connected) {
            document.getElementById('lblDbPing').textContent = `${data.pingMs} ms`;
            document.getElementById('lblDbVersion').textContent = data.mysqlVersion || 'MySQL 8.0';

            appendLog(`[MySQL PING] Ping: ${data.pingMs}ms | Version: ${data.mysqlVersion} | Tables: ${data.tableCount} | Items: ${data.recordsCount}`, 'success');
        } else {
            document.getElementById('lblDbPing').textContent = '-- ms';
            document.getElementById('lblDbVersion').textContent = '--';
        }
    } catch (e) {
        appendLog(`[MySQL] Benchmark request error: ${e.message}`, 'warning');
    }
}

// 4. Fetch & Render Table Records
async function loadItems() {
    const tbody = document.getElementById('itemsTableBody');
    try {
        const res = await fetch('/api/items');
        const data = await res.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${data.error || 'Database disconnected.'}</td></tr>`;
            return;
        }

        if (data.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No records in \`test_records\` table. Add your first record above!</td></tr>`;
            return;
        }

        tbody.innerHTML = data.items.map(item => `
            <tr>
                <td><strong>#${item.id}</strong></td>
                <td><strong>${escapeHtml(item.title)}</strong></td>
                <td>${escapeHtml(item.details || '-')}</td>
                <td><span class="badge-tag ${item.status ? item.status.toLowerCase() : 'active'}">${escapeHtml(item.status || 'Active')}</span></td>
                <td class="code-font">${new Date(item.created_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-xs btn-danger" onclick="deleteItem(${item.id})">🗑 Delete</button>
                </td>
            </tr>
        `).join('');

        appendLog(`[CRUD SELECT] Retrieved ${data.items.length} records from \`test_records\``, 'info');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-warning">Error loading data: ${err.message}</td></tr>`;
    }
}

// 5. Fetch & Render Migrations Status
async function loadMigrations() {
    const tbody = document.getElementById('migrationsTableBody');
    try {
        const res = await fetch('/api/migrations');
        const data = await res.json();

        if (data.error) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">${data.error}</td></tr>`;
            return;
        }

        document.getElementById('lblMigrationsApplied').textContent = `${data.appliedCount} / ${data.total}`;
        document.getElementById('lblMigrationsPending').textContent = `${data.pendingCount}`;

        if (!data.migrations || data.migrations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No migration files found in /migrations directory.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.migrations.map(m => `
            <tr>
                <td><code class="code-font">${escapeHtml(m.name)}</code></td>
                <td>
                    <span class="badge-tag ${m.status === 'APPLIED' ? 'active' : 'testing'}">${m.status}</span>
                </td>
                <td class="code-font">${m.executedAt ? new Date(m.executedAt).toLocaleString() : 'Not Executed'}</td>
            </tr>
        `).join('');

    } catch (err) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-warning">Error loading migrations: ${err.message}</td></tr>`;
        }
    }
}

// 6. Trigger Pending Migrations Execution
async function runPendingMigrations() {
    appendLog('[MIGRATOR] Requesting pending database migrations execution...', 'info');
    try {
        const res = await fetch('/api/migrations/run', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            const applied = data.results.filter(r => r.status === 'APPLIED').length;
            appendLog(`[MIGRATOR] Migrations finished. ${applied} new migrations applied out of ${data.total}.`, 'success');
            loadMigrations();
            loadItems();
        } else {
            appendLog(`[MIGRATOR ERROR] ${data.error}`, 'error');
        }
    } catch (err) {
        appendLog(`[MIGRATOR ERROR] ${err.message}`, 'error');
    }
}

// 7. Form Handling (Create Record)
function initForm() {
    const form = document.getElementById('createRecordForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('inputTitle').value.trim();
        const details = document.getElementById('inputDetails').value.trim();
        const status = document.getElementById('selectStatus').value;

        if (!title) return;

        const btnSubmit = document.getElementById('btnSubmitRecord');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Saving...';

        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, details, status })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                appendLog(`[CRUD INSERT] Inserted Record #${data.item.id} ("${data.item.title}") into MySQL`, 'success');
                document.getElementById('inputTitle').value = '';
                document.getElementById('inputDetails').value = '';
                loadItems();
            } else {
                alert(`Error: ${data.error || 'Failed to insert record'}`);
                appendLog(`[CRUD INSERT ERROR] ${data.error}`, 'error');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '➕ Insert into DB';
        }
    });
}

// Delete Record Action
async function deleteItem(id) {
    if (!confirm(`Are you sure you want to delete Record #${id}?`)) return;

    try {
        const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok && data.success) {
            appendLog(`[CRUD DELETE] Deleted Record #${id} from MySQL`, 'warning');
            loadItems();
        } else {
            alert(`Delete Error: ${data.error}`);
        }
    } catch (err) {
        alert(`Delete Error: ${err.message}`);
    }
}

// Console Logger Helper
function appendLog(message, level = 'info') {
    const consoleBody = document.getElementById('consoleBody');
    if (!consoleBody) return;

    const entry = document.createElement('div');
    entry.className = `log-entry log-${level}`;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.textContent = `[${timestamp}] ${message}`;

    consoleBody.appendChild(entry);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearConsole() {
    const consoleBody = document.getElementById('consoleBody');
    if (consoleBody) {
        consoleBody.innerHTML = '';
        appendLog('[CONSOLE] Terminal logs cleared.', 'info');
    }
}

// Utilities
function formatUptime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[m]);
}
