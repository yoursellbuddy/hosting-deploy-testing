const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sample_node_pg_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
  }
  return pool;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testConnection(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[DB] Attempting to connect to PostgreSQL server at ${dbConfig.host}:${dbConfig.port}... (Attempt ${i + 1}/${retries})`);
      const currentPool = getPool();
      
      // Execute test query
      const res = await currentPool.query('SELECT NOW() as current_time');
      console.log('[DB] Connected to PostgreSQL server successfully! Server Time:', res.rows[0].current_time);

      // Auto-create test_items table if not exists
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS test_items (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[DB] Verified table "test_items" exists.');

      return {
        status: 'connected',
        message: 'Connected to PostgreSQL successfully!',
        host: dbConfig.host,
        port: dbConfig.port,
        dbname: dbConfig.database,
      };
    } catch (error) {
      console.error(`[DB] Connection attempt failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`[DB] Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      } else {
        return {
          status: 'error',
          message: error.message,
          host: dbConfig.host,
          port: dbConfig.port,
          dbname: dbConfig.database,
        };
      }
    }
  }
}

module.exports = {
  getPool,
  testConnection,
};
