require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const getDbConfig = () => ({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sample_node_pg_db',
    connectionTimeoutMillis: 5000,
});

async function runMigrations(externalPool = null) {
    const pool = externalPool || new Pool(getDbConfig());
    const client = await pool.connect();
    let ownPool = !externalPool;

    try {
        // 1. Create schema_migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Fetch already executed migrations
        const res = await client.query('SELECT migration_name FROM schema_migrations;');
        const executedSet = new Set(res.rows.map(r => r.migration_name));

        // 3. Read migration files from /migrations directory
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        const results = [];

        for (const file of files) {
            if (executedSet.has(file)) {
                results.push({ file, status: 'SKIPPED', message: 'Already applied' });
                continue;
            }

            const filePath = path.join(migrationsDir, file);
            const sqlContent = fs.readFileSync(filePath, 'utf8');

            console.log(`[Migrator-PG] Executing migration: ${file}...`);
            await client.query('BEGIN');
            try {
                await client.query(sqlContent);
                await client.query('INSERT INTO schema_migrations (migration_name) VALUES ($1);', [file]);
                await client.query('COMMIT');
                results.push({ file, status: 'APPLIED', message: 'Successfully executed' });
                console.log(`[Migrator-PG] ✅ ${file} applied successfully.`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`[Migrator-PG] ❌ Error executing ${file}:`, err.message);
                throw err;
            }
        }

        return { success: true, total: files.length, results };

    } catch (err) {
        console.error(`[Migrator-PG] ❌ Migration runner failed:`, err.message);
        throw err;
    } finally {
        client.release();
        if (ownPool) {
            await pool.end();
        }
    }
}

async function getMigrationStatus(externalPool = null) {
    const pool = externalPool || new Pool(getDbConfig());
    const client = await pool.connect();
    let ownPool = !externalPool;

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const res = await client.query('SELECT * FROM schema_migrations ORDER BY id ASC;');
        const executedMap = new Map(res.rows.map(r => [r.migration_name, r.executed_at]));

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.existsSync(migrationsDir)
            ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
            : [];

        const migrations = files.map(file => ({
            name: file,
            status: executedMap.has(file) ? 'APPLIED' : 'PENDING',
            executedAt: executedMap.get(file) || null
        }));

        return {
            total: files.length,
            appliedCount: executedMap.size,
            pendingCount: files.length - executedMap.size,
            migrations
        };
    } catch (err) {
        return { error: err.message, migrations: [] };
    } finally {
        client.release();
        if (ownPool) {
            await pool.end();
        }
    }
}

// CLI Execution Support
if (require.main === module) {
    const command = process.argv[2] || 'run';

    if (command === 'status') {
        getMigrationStatus()
            .then(res => {
                console.log('=== PostgreSQL Migration Status ===');
                console.table(res.migrations);
                console.log(`Applied: ${res.appliedCount} / ${res.total}`);
                process.exit(0);
            })
            .catch(err => {
                console.error(err);
                process.exit(1);
            });
    } else {
        runMigrations()
            .then(res => {
                console.log(`=== Migrations Complete (${res.results.filter(r => r.status === 'APPLIED').length} applied) ===`);
                process.exit(0);
            })
            .catch(err => {
                console.error(err);
                process.exit(1);
            });
    }
}

module.exports = {
    runMigrations,
    getMigrationStatus
};
