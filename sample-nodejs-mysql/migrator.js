require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const getDbConfig = () => ({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sample_db',
    connectTimeout: 5000,
    multipleStatements: true
});

async function runMigrations(externalPool = null) {
    const config = getDbConfig();
    let conn = null;
    let ownConn = false;

    try {
        if (externalPool) {
            conn = await externalPool.getConnection();
        } else {
            conn = await mysql.createConnection(config);
            ownConn = true;
        }

        // 1. Create schema_migrations tracking table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
                \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Fetch already executed migrations
        const [rows] = await conn.query('SELECT `migration_name` FROM `schema_migrations`');
        const executedSet = new Set(rows.map(r => r.migration_name));

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

            console.log(`[Migrator] Executing migration: ${file}...`);
            await conn.query(sqlContent);
            await conn.query('INSERT INTO `schema_migrations` (`migration_name`) VALUES (?)', [file]);

            results.push({ file, status: 'APPLIED', message: 'Successfully executed' });
            console.log(`[Migrator] ✅ ${file} applied successfully.`);
        }

        return { success: true, total: files.length, results };

    } catch (err) {
        console.error(`[Migrator] ❌ Migration failed:`, err.message);
        throw err;
    } finally {
        if (conn) {
            if (ownConn) {
                await conn.end();
            } else {
                conn.release();
            }
        }
    }
}

async function getMigrationStatus(externalPool = null) {
    const config = getDbConfig();
    let conn = null;
    let ownConn = false;

    try {
        if (externalPool) {
            conn = await externalPool.getConnection();
        } else {
            conn = await mysql.createConnection(config);
            ownConn = true;
        }

        await conn.query(`
            CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
                \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        const [executedRows] = await conn.query('SELECT * FROM `schema_migrations` ORDER BY `id` ASC');
        const executedMap = new Map(executedRows.map(r => [r.migration_name, r.executed_at]));

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
        if (conn) {
            if (ownConn) {
                await conn.end();
            } else {
                conn.release();
            }
        }
    }
}

// CLI Execution Support
if (require.main === module) {
    const command = process.argv[2] || 'run';

    if (command === 'status') {
        getMigrationStatus()
            .then(res => {
                console.log('=== Database Migration Status ===');
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
