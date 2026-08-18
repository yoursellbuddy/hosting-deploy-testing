# Node.js + PostgreSQL Sample Deployment Setup with Migrations

A production-grade Node.js + Express + PostgreSQL database application designed for testing hosting deployments, LXC containers, Docker compose setups, database connection pooling, and automated schema migrations.

---

## Features

- **Express.js API Engine**: Fast HTTP REST API endpoints (`/api/health`, `/api/db-status`, `/api/items`, `/api/migrations`).
- **Database Schema Migration System**: Automated `.sql` migration runner that tracks applied scripts inside the `schema_migrations` tracking table using PostgreSQL transactions.
- **PostgreSQL Connection Pool**: Built using `pg` Pool with auto-reconnection and database schema auto-migrations on startup.
- **Graceful Fault Tolerance**: Does not crash if PostgreSQL is unreachable—displays real-time diagnostic reporting and troubleshooting advice.
- **Interactive Health & Migration Dashboard**: Glassmorphic UI displaying server uptime, PostgreSQL ping latency, version info, migration status, and interactive CRUD operations.

---

## Project Structure

```
sample-nodejs-postgresql/
├── index.js             # Express server & REST API endpoints
├── db.js                # PostgreSQL pool manager & health check logic
├── migrator.js          # Migration runner and status inspection module
├── package.json         # Project dependencies & launch scripts
├── Dockerfile           # Alpine Node container build script
├── docker-compose.yml   # Multi-container setup (Node.js + PostgreSQL 16)
├── .env.example         # Environment template
├── README.md            # Documentation
├── migrations/          # SQL Migration Scripts
│   ├── 001_create_test_items_table.sql
│   ├── 002_create_users_table.sql
│   ├── 003_create_logs_table.sql
│   └── 004_add_category_to_test_items.sql
└── public/
    ├── index.html       # Diagnostic Dashboard & Migrations UI
    ├── style.css        # Responsive Design System
    └── app.js           # Interactive Client API Logic
```

---

## Migration Commands

Run migrations manually using npm scripts:

```bash
# Execute all pending PostgreSQL migrations
npm run migrate

# Inspect migration execution status table
npm run migrate:status
```

---

## How to Run

### Option 1: Docker (Recommended)
```bash
cd /home/jose/Desktop/docker/hosting-deploy-testing/sample-nodejs-postgresql
docker compose up -d --build
```
Access the application at `http://localhost:3000`.

---

### Option 2: Local Execution

1. Make sure PostgreSQL server is running on port `5432`.
2. Configure `.env` with your credentials:
   ```ini
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgrespassword
   DB_NAME=sample_node_pg_db
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000` in your web browser.

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server uptime, Node version, environment, & PostgreSQL status. |
| `GET` | `/api/db-status` | Database query ping timing (ms), version, and table counts. |
| `GET` | `/api/migrations` | Migration status, total count, applied list, and pending scripts. |
| `POST` | `/api/migrations/run` | Triggers execution of pending SQL migrations. |
| `GET` | `/api/items` | Fetch all records from `test_items` PostgreSQL table. |
| `POST` | `/api/items` | Insert a new record into `test_items`. |
| `DELETE` | `/api/items/:id` | Remove a record by ID. |
